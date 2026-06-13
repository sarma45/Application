"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface AgentRunnerProps {
  agentId: string;
  slug: string;
  agentName: string;
  category: string;
  systemPrompt?: string | null;
  pricingType: string;
  creditsPerRun: number;
  isTestMode?: boolean;
  isCreator?: boolean;
}

function formatCodeBlocks(text: string): React.ReactNode[] {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const content = part.slice(3, -3);
      const langEnd = content.indexOf("\n");
      const lang = langEnd > 0 ? content.slice(0, langEnd).trim() : "";
      const code = langEnd > 0 ? content.slice(langEnd + 1) : content;
      return (
        <div key={i} className="relative group my-2">
          <pre className="bg-theme rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed border border-theme">
            {lang && <div className="text-xs text-secondary mb-2">{lang}</div>}
            <code>{code}</code>
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-theme text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-theme"
          >
            Copy
          </button>
        </div>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ChatMessage({ role, content, running }: { role: string; content: string; running: boolean }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
          role === "user" ? "bg-purple-600 text-white" : "bg-elevated text-theme"
        }`}
      >
        {role === "assistant" && !content && running ? (
          <span className="inline-flex gap-1">
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        ) : (
          <div className="whitespace-pre-wrap break-words">{formatCodeBlocks(content)}</div>
        )}
      </div>
    </div>
  );
}

function WorkflowProgress({ messages }: { messages: { role: string; content: string }[] }) {
  const steps = messages.filter((m) => m.role === "assistant" && m.content);
  if (steps.length === 0) return null;
  return (
    <div className="px-4 py-2 border-b border-light">
      <div className="flex items-center gap-2 text-xs text-secondary">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              i < steps.length - 1 || !messages[messages.length - 1]?.content.endsWith("...")
                ? "bg-purple-600 text-white"
                : "bg-card text-secondary"
            }`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && <div className="w-4 h-px bg-card" />}
          </div>
        ))}
        <span className="text-muted">Step {steps.length}</span>
      </div>
    </div>
  );
}

export function AgentRunner({ agentId, slug, agentName, category, systemPrompt, isTestMode, isCreator }: AgentRunnerProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDataAgent = category === "DATA";
  const isWorkflowAgent = category === "WORKFLOW";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    sessionIdRef.current = null;
    setError("");
    setAttachedFile(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !attachedFile) || running) return;

    setError("");

    const userContent = attachedFile
      ? `${text ? text + "\n\n" : ""}[File: ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(1)} KB)]`
      : text;

    setMessages((prev) => [...prev, { role: "user", content: userContent }, { role: "assistant", content: "" }]);
    setRunning(true);

    try {
      const res = await fetch(`/api/agents/${slug}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userContent,
          agentId,
          category,
          systemPrompt,
          sessionId: sessionIdRef.current,
          _test: isTestMode || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setInput("");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let streamStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.sessionId && !sessionIdRef.current) {
                sessionIdRef.current = parsed.sessionId;
                setSessionId(parsed.sessionId);
              }
              if (parsed.text) {
                streamStarted = true;
                assistantMessage += parsed.text;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantMessage };
                  return next;
                });
              }
              if (parsed.error) {
                setError(parsed.error);
              }
            } catch {
              // skip non-json lines
            }
          }
        }
      }

      if (!assistantMessage && !streamStarted) {
        setMessages((prev) => prev.slice(0, -1));
        setError("No response received");
      }

      setAttachedFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-light">
        <span className="text-xs text-secondary">
          {isTestMode ? "Test Mode - no credits deducted" : ""}
          {sessionId ? `Session active` : ""}
        </span>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {isWorkflowAgent && <WorkflowProgress messages={messages} />}

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-secondary">Run {agentName} by sending a message</p>
            {isDataAgent && (
              <p className="text-xs text-muted mt-2">Attach a CSV, XLSX, PDF, or TXT file for analysis</p>
            )}
            {isCreator && (
              <p className="text-xs text-muted mt-2">Creator: use Test Mode to try without spending credits</p>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} running={running} />
        ))}
        {error && (
          <div className="text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-light p-4 flex flex-col gap-2">
        {isDataAgent && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
            />
            <Button
              type="button"
              variant={attachedFile ? "primary" : "secondary"}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {attachedFile ? attachedFile.name : "Attach file"}
            </Button>
            {attachedFile && (
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-xs text-secondary hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isDataAgent ? "Ask about your data..." : "Type your message..."}
            className="flex-1 rounded-lg border border-theme bg-card px-4 py-2 text-sm text-theme placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[42px] max-h-[120px]"
            disabled={running}
            rows={1}
          />
          <Button type="submit" loading={running} disabled={!input.trim() && !attachedFile}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
