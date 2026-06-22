"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVisualizerStore } from "@/hooks/use-visualizer-store";
import { AVAILABLE_MODELS } from "@/lib/limits";
import { LiveTaskVisualizer3DWrapper } from "@/components/effects/LiveTaskVisualizer3DWrapper";

interface SwarmAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  pricingType: string;
  creditsPerRun: number;
  modelProvider: string;
  modelId: string | null;
  toolsConfig: any;
}

interface SwarmDashboardProps {
  agents: SwarmAgent[];
}

interface TerminalLog {
  id: string;
  timestamp: string;
  type: "system" | "planner" | "tool" | "code" | "error" | "success" | "user";
  source?: string;
  message: string;
}

const ALL_SWARM_TOOLS = [
  { id: "web_search", name: "Web Search", desc: "Query facts & relevance indices", color: "from-purple-500 to-indigo-500", glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]" },
  { id: "web_fetch", name: "Web Fetch", desc: "Download page markdown summaries", color: "from-cyan-500 to-blue-500", glow: "shadow-[0_0_15px_rgba(6,182,212,0.4)]" },
  { id: "code_runner", name: "Code Sandbox", desc: "Secure isolated Python/JS containers", color: "from-emerald-500 to-teal-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.4)]" },
  { id: "file_write_s3", name: "S3 Write", desc: "Sync logs and reports to cloud", color: "from-orange-500 to-amber-500", glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]" },
  { id: "file_read_s3", name: "S3 Read", desc: "Access records from cloud buckets", color: "from-pink-500 to-rose-500", glow: "shadow-[0_0_15px_rgba(244,63,94,0.4)]" },
  { id: "db_query", name: "DB Query", desc: "Safe read-only execution audits", color: "from-violet-500 to-fuchsia-500", glow: "shadow-[0_0_15px_rgba(139,92,246,0.4)]" },
  { id: "subagent_dispatch", name: "Subagent Swarm", desc: "Delegate complex subgoals", color: "from-sky-500 to-indigo-500", glow: "shadow-[0_0_15px_rgba(14,165,233,0.4)]" },
];

export function SwarmDashboard({ agents }: SwarmDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<SwarmAgent | null>(agents[0] || null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "graph">("terminal");
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [activeTools, setActiveTools] = useState<Record<string, boolean>>({});
  const [currentAction, setCurrentAction] = useState<string>("Idle");
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Sync tools configuration of selected agent
  const agentTools = React.useMemo(() => {
    if (!selectedAgent || !selectedAgent.toolsConfig) return [];
    return Object.keys(selectedAgent.toolsConfig).filter(k => selectedAgent.toolsConfig[k] === true);
  }, [selectedAgent]);

  const addLog = useCallback((type: TerminalLog["type"], message: string, source?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const id = Math.random().toString(36).slice(2, 9);
    setLogs((prev) => [...prev, { id, timestamp, type, source, message }]);
  }, []);

  const handleClear = () => {
    setLogs([]);
    setActiveTools({});
    setCurrentAction("Idle");
    useVisualizerStore.getState().reset();
  };

  async function handleStartSwarm(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgent || !prompt.trim() || running) return;

    setRunning(true);
    handleClear();
    setCurrentAction("Initializing Swarm");
    addLog("user", prompt);
    addLog("system", `Spawning Orchestrator Swarm Agent for "${selectedAgent.name}"...`);
    addLog("system", `System prompt configured. LLM Backend: ${selectedModel.label}`);

    try {
      const res = await fetch(`/api/agents/${selectedAgent.slug}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          agentId: selectedAgent.id,
          category: selectedAgent.category,
          modelProvider: selectedModel.provider,
          modelId: selectedModel.model,
          _test: true, // run in test mode
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Could not construct log stream reader.");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);

              // 1. Log session activation
              if (parsed.sessionId && !sessionIdRef.current) {
                sessionIdRef.current = parsed.sessionId;
                addLog("system", `Session established: ${parsed.sessionId}`);
              }

              // 2. Track structured R3F pipeline events
              if (parsed.type === "plan_created") {
                const plan = parsed.payload.plan;
                useVisualizerStore.getState().setPlan(plan);
                addLog("planner", `Swarm Strategy created. Target: ${plan.length} steps.`);
                plan.forEach((step: any, idx: number) => {
                  addLog("planner", ` -> Step [${idx + 1}]: Use [${step.tool}] - ${step.description}`);
                });
              } else if (parsed.type === "tool_call_started") {
                const { stepId, tool } = parsed.payload;
                useVisualizerStore.getState().updateStep(stepId, { status: "running" });
                setActiveTools(prev => ({ ...prev, [tool]: true }));
                setCurrentAction(`Running tool ${tool}`);
                addLog("tool", `Invoking secure tool interface [${tool}]...`, tool);
              } else if (parsed.type === "tool_call_completed") {
                const { stepId, tool, result } = parsed.payload;
                useVisualizerStore.getState().updateStep(stepId, { status: "success", output: result });
                setActiveTools(prev => ({ ...prev, [tool]: false }));
                setCurrentAction(`Tool ${tool} completed`);
                addLog("success", `Tool [${tool}] completed successfully. Output payload synced.`, tool);
                if (result) {
                  addLog("code", typeof result === "string" ? result : JSON.stringify(result, null, 2));
                }
              } else if (parsed.type === "step_failed") {
                const { stepId, error, tool } = parsed.payload;
                useVisualizerStore.getState().updateStep(stepId, { status: "error", error });
                if (tool) setActiveTools(prev => ({ ...prev, [tool]: false }));
                setCurrentAction(`Step failed`);
                addLog("error", `Tool [${tool || "orchestrator"}] error: ${error}`);
              } else if (parsed.type === "task_complete") {
                useVisualizerStore.getState().setActive(false);
                setCurrentAction("Execution Complete");
                addLog("success", "Swarm execution chain finished cleanly.");
              }

              // 3. Log text streams
              if (parsed.text) {
                // Periodic flush of text streams to the terminal logs
                if (parsed.text.includes("\n") || parsed.text.length > 30) {
                  addLog("planner", parsed.text);
                }
              }
              if (parsed.error) {
                addLog("error", parsed.error);
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Orchestrator timeout or socket failure";
      addLog("error", `Critical: ${msg}`);
      setCurrentAction("Error encountered");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tools Coordination HUD */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Swarm Core Tools Configuration
          </h2>
          <span className="text-xs text-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Sandbox Environment Active
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_SWARM_TOOLS.map((tool) => {
            const isConfigured = agentTools.includes(tool.id);
            const isActive = activeTools[tool.id];
            
            return (
              <div
                key={tool.id}
                className={`glass p-3 rounded-xl border flex flex-col justify-between transition-all duration-500 ${
                  isActive
                    ? `border-emerald-500/50 ${tool.glow} bg-emerald-950/20 scale-105`
                    : isConfigured
                      ? "border-purple-500/20 hover:border-purple-500/40 bg-purple-950/5"
                      : "border-theme/10 opacity-40 bg-theme/5"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[11px] font-bold truncate text-theme">{tool.name}</span>
                    <div className="flex gap-1 shrink-0">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {isConfigured && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-[9px] text-secondary leading-tight line-clamp-2">{tool.desc}</p>
                </div>
                <div className="mt-2 text-right">
                  {isActive ? (
                    <Badge variant="success" className="text-[8px] px-1 py-0 animate-pulse">Running</Badge>
                  ) : isConfigured ? (
                    <Badge variant="purple" className="text-[8px] px-1 py-0">Enabled</Badge>
                  ) : (
                    <Badge variant="default" className="text-[8px] px-1 py-0 bg-theme/20 text-muted">Disabled</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Column */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3 border-b border-light">
              <h3 className="text-md font-semibold text-theme">Swarm Controller</h3>
              <p className="text-xs text-secondary">Dispatch workflow agents to solve multi-step goals</p>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleStartSwarm} className="space-y-4">
                {/* Agent Selector */}
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">
                    Select Swarm Agent
                  </label>
                  <select
                    value={selectedAgent?.id || ""}
                    onChange={(e) => {
                      const selected = agents.find(a => a.id === e.target.value);
                      setSelectedAgent(selected || null);
                    }}
                    disabled={running}
                    className="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-xs text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.category})
                      </option>
                    ))}
                  </select>
                  {selectedAgent && (
                    <p className="text-[10px] text-secondary mt-1.5">
                      {selectedAgent.description || "No description provided for this agent."}
                    </p>
                  )}
                </div>

                {/* Model Selector */}
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">
                    Planner LLM Model
                  </label>
                  <select
                    value={selectedModel.model}
                    onChange={(e) => {
                      const m = AVAILABLE_MODELS.find(x => x.model === e.target.value);
                      if (m) setSelectedModel(m);
                    }}
                    disabled={running}
                    className="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-xs text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.model} value={m.model}>
                        {m.label} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goal Input */}
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase mb-1.5">
                    Target Goal / Query
                  </label>
                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={running}
                    placeholder="Enter an instruction... (e.g. Research the weather in Miami, write a script to convert Celsius to Fahrenheit, and save it to cloud storage)"
                    className="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-xs text-theme placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                {/* Run Button */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 neural-glow font-semibold"
                    disabled={running || !prompt.trim()}
                    loading={running}
                  >
                    Dispatch Swarm Loop
                  </Button>
                  {logs.length > 0 && !running && (
                    <Button type="button" variant="secondary" onClick={handleClear}>
                      Clear
                    </Button>
                  )}
                </div>
              </form>

              {/* Status Indicator */}
              <div className="pt-4 border-t border-light flex items-center justify-between text-xs">
                <span className="text-secondary">Orchestrator HUD State:</span>
                <span className="font-bold text-purple-400 animate-pulse">{currentAction}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Output Column with Terminal / R3F Canvas Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[620px] flex flex-col relative overflow-hidden">
            {/* Terminal Header Tabs */}
            <div className="flex items-center justify-between px-4 py-2 bg-theme/50 border-b border-light">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("terminal")}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 font-semibold ${
                    activeTab === "terminal"
                      ? "text-white bg-purple-600/20 border border-purple-500/30"
                      : "text-secondary hover:text-theme"
                  }`}
                >
                  📟 Sandbox Terminal
                </button>
                <button
                  onClick={() => setActiveTab("graph")}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 font-semibold ${
                    activeTab === "graph"
                      ? "text-white bg-purple-600/20 border border-purple-500/30"
                      : "text-secondary hover:text-theme"
                  }`}
                >
                  🔮 3D Swarm Graph
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 min-h-0 relative">
              {activeTab === "terminal" ? (
                /* Cybernetic Retro Terminal Output */
                <div className="absolute inset-0 bg-[#09090b] p-4 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-2 select-text text-neutral-300 selection:bg-purple-900/40">
                  {/* Scanline CRT overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-[0.015] z-10" />

                  {/* Empty state prompt */}
                  {logs.length === 0 && (
                    <div className="text-secondary text-xs p-6 text-center mt-12 space-y-2">
                      <p>❯ SWARM SANDBOX SHELL v2.4.1 (AIVERSE CORE)</p>
                      <p className="text-muted">Enter a query on the left and click Dispatch to watch the coordinator schedule steps and call secure sandbox tools.</p>
                      <span className="inline-block text-[10px] bg-theme/40 text-theme px-2.5 py-1 rounded border border-theme">
                        Waiting for prompt...
                      </span>
                    </div>
                  )}

                  {/* Terminal rows */}
                  {logs.map((log) => {
                    let textClass = "text-neutral-300";
                    let prefix = "❯";

                    if (log.type === "system") {
                      textClass = "text-purple-400 font-bold";
                      prefix = "⚙️ [SYSTEM]";
                    } else if (log.type === "planner") {
                      textClass = "text-cyan-400";
                      prefix = "🧠 [PLANNER]";
                    } else if (log.type === "tool") {
                      textClass = "text-yellow-400 font-medium";
                      prefix = `🔧 [TOOL: ${log.source}]`;
                    } else if (log.type === "code") {
                      textClass = "text-neutral-400 bg-neutral-900/60 p-2 rounded border border-theme/5 block whitespace-pre overflow-x-auto";
                      prefix = "💻 [OUTPUT]";
                    } else if (log.type === "error") {
                      textClass = "text-rose-500 font-semibold";
                      prefix = "🚨 [ERROR]";
                    } else if (log.type === "success") {
                      textClass = "text-emerald-400 font-bold";
                      prefix = "✅ [SUCCESS]";
                    } else if (log.type === "user") {
                      textClass = "text-indigo-300 italic border-l-2 border-indigo-500 pl-2";
                      prefix = "👤 [GOAL]";
                    }

                    return (
                      <div key={log.id} className="space-y-1 py-0.5 border-b border-white/[0.01]">
                        <div className="flex items-start gap-2">
                          <span className="text-muted shrink-0 select-none">[{log.timestamp}]</span>
                          <span className={`${textClass}`}>
                            <span className="mr-1.5 select-none font-bold opacity-80">{prefix}</span>
                            {log.message}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* End anchor for autoscroll */}
                  <div ref={terminalEndRef} />
                </div>
              ) : (
                /* Live R3F 3D Node connections */
                <div className="absolute inset-0 bg-[#0c0a1c] pointer-events-auto">
                  <div className="absolute top-3 left-3 z-10 glass border border-purple-500/20 px-3 py-1.5 rounded-lg text-[10px] text-secondary">
                    🚀 Live Swarm Pipeline Path tracking active (WebGL Canvas)
                  </div>
                  <LiveTaskVisualizer3DWrapper />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
