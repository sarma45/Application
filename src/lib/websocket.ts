import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parse } from "url";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { complete } from "@/lib/ai/gateway";
import { checkSafety, sanitizeInput } from "@/lib/ai/safety";

interface WSClient {
  ws: WebSocket;
  userId: string;
  sessionId: string;
  isAlive: boolean;
}

const clients = new Map<string, WSClient>();
const HEARTBEAT_INTERVAL = 30000;

export function createWebSocketServer(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  const heartbeat = setInterval(() => {
    for (const [id, client] of clients) {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(id);
        logger.debug("WebSocket client timed out", { clientId: id });
        continue;
      }
      client.isAlive = false;
      client.ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const params = parse(req.url || "", true).query;
    const sessionId = (params.sessionId as string) || crypto.randomUUID();

    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    let token = null;
    try {
      token = await getToken({ req: req as any, secret });
    } catch (err) {
      logger.error("WebSocket auth token verification failed", { error: String(err) });
    }

    if (!token || !token.id) {
      ws.close(4003, "Unauthorized");
      return;
    }

    const userId = token.id as string;
    const clientId = `${userId}:${sessionId}`;
    const client: WSClient = { ws, userId, sessionId, isAlive: true };
    clients.set(clientId, client);

    logger.info("WebSocket client connected", { userId, sessionId });

    ws.on("pong", () => {
      client.isAlive = true;
    });

    ws.on("message", async (raw: Buffer) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type, payload } = data;

        if (type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        if (type === "chat") {
          const message = payload?.message || "";
          const systemPrompt = payload?.systemPrompt || "You are AIVerse, an AI assistant.";
          const category = payload?.category || "CHAT";

          const safety = await checkSafety(message, userId);
          if (!safety.safe) {
            ws.send(JSON.stringify({
              type: "error",
              payload: { code: "SAFETY_CHECK_FAILED", message: safety.reason },
            }));
            return;
          }

          const safeMessage = sanitizeInput(message);

          ws.send(JSON.stringify({
            type: "status",
            payload: { status: "processing" },
          }));

          const result = await complete({
            category,
            prompt: safeMessage,
            systemPrompt,
          });

          ws.send(JSON.stringify({
            type: "token",
            payload: { text: result.text, done: true },
          }));

          ws.send(JSON.stringify({
            type: "complete",
            payload: {
              text: result.text,
              usage: result.usage,
              provider: result.provider,
              model: result.model,
            },
          }));

          await prisma.agentExecution.create({
            data: {
              agentId: "websocket-chat",
              userId,
              sessionId,
              inputTokens: result.usage.promptTokens,
              outputTokens: result.usage.completionTokens,
              creditsUsed: 0,
              status: "COMPLETED",
              modelUsed: result.model,
              provider: result.provider,
            },
          }).catch(() => {});
        }
      } catch (error) {
        logger.error("WebSocket message error", { error: String(error) });
        ws.send(JSON.stringify({
          type: "error",
          payload: { code: "INTERNAL_ERROR", message: "Failed to process message" },
        }));
      }
    });

    ws.on("close", () => {
      clients.delete(clientId);
      logger.info("WebSocket client disconnected", { userId, sessionId });
    });

    ws.on("error", (err) => {
      logger.error("WebSocket error", { error: err.message });
      clients.delete(clientId);
    });

    ws.send(JSON.stringify({
      type: "connected",
      payload: { sessionId, userId },
    }));
  });

  wss.on("error", (err) => {
    logger.error("WebSocket server error", { error: err.message });
  });

  wss.on("close", () => {
    clearInterval(heartbeat);
  });

  logger.info("WebSocket server initialized at /ws/chat");
  return wss;
}
