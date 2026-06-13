import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastId = "";

      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      sendEvent("connected", { userId: session.user.id });

      const poll = setInterval(async () => {
        try {
          const notifications = await prisma.notification.findMany({
            where: {
              userId: session.user.id,
              read: false,
              ...(lastId ? { id: { gt: lastId } } : {}) as any,
            },
            orderBy: { createdAt: "asc" },
            take: 10,
          });

          for (const n of notifications) {
            sendEvent("notification", n);
            lastId = n.id;
          }
        } catch {
          // ignore poll errors
        }
      }, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(poll);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}