import express from "express";
import cors from "cors";
import { startTracing, shutdownTracing } from "./tracing.js";
import { complete } from "./gateway.js";
import { checkSafety, sanitizeInput } from "./safety.js";

await startTracing();

const app = express();
const PORT = parseInt(process.env.AI_GATEWAY_PORT || "4001", 10);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: any, res: any) => {
  res.json({ status: "ok", service: "ai-gateway" });
});

app.post("/v1/complete", async (req: any, res: any) => {
  try {
    const { category, prompt, systemPrompt, temperature, maxTokens } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing required field: prompt" });
    }

    const safety = await checkSafety(prompt);
    if (!safety.safe) {
      return res.status(400).json({ error: safety.reason || "Content policy violation", code: "SAFETY_CHECK_FAILED" });
    }

    const safeMessage = sanitizeInput(prompt);

    const result = await complete({
      category: category || "CHAT",
      prompt: safeMessage,
      systemPrompt,
      temperature,
      maxTokens,
    });

    return res.json(result);
  } catch (error: any) {
    console.error("Completion error:", error);
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`AI Gateway service listening on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down AI Gateway...");
  server.close();
  await shutdownTracing();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down AI Gateway...");
  server.close();
  await shutdownTracing();
  process.exit(0);
});

export default app;
