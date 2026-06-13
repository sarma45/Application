import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const models = [
  {
    name: "DeepSeek V4 Pro",
    lab: "DeepSeek AI",
    params: "1.02T MoE / 41B active",
    context: "1M tokens",
    license: "MIT",
    sweBench: "80.6%",
    liveCodeBench: "93.5",
    humanEval: "~94%",
    vram: "2× H100 (80GB)",
    bestFor: "Best overall agentic coding, 1M context",
    deploy: [
      { tool: "vLLM", cmd: "vllm serve deepseek-ai/DeepSeek-V4-Pro --tensor-parallel-size 4" },
      { tool: "SGLang", cmd: "python -m sglang.launch_server --model deepseek-ai/DeepSeek-V4-Pro --tp 4" },
      { tool: "Ollama", cmd: "ollama run deepseek-v4-pro" },
    ],
    url: "https://chat.deepseek.com",
  },
  {
    name: "Kimi K2.6",
    lab: "Moonshot AI",
    params: "~1T MoE",
    context: "262K tokens",
    license: "MIT",
    sweBench: "80.2%",
    liveCodeBench: "89.6",
    humanEval: "~92%",
    vram: "4× H100 (80GB)",
    bestFor: "Agent swarms, multi-step autonomous coding (300 sub-agents, 13h sessions)",
    deploy: [
      { tool: "vLLM", cmd: "vllm serve moonshotai/Kimi-K2.6 --tensor-parallel-size 8" },
      { tool: "SGLang", cmd: "python -m sglang.launch_server --model moonshotai/Kimi-K2.6 --tp 8" },
    ],
    url: "https://kimi.com",
  },
  {
    name: "GLM-5.1",
    lab: "Zhipu AI (Z.ai)",
    params: "~400B MoE",
    context: "200K tokens",
    license: "Apache 2.0",
    sweBench: "58.4% (Pro)",
    liveCodeBench: "75.37",
    humanEval: "~91%",
    vram: "2× H100 (80GB)",
    bestFor: "Long-horizon agentic engineering, structured outputs",
    deploy: [
      { tool: "vLLM", cmd: "vllm serve zhipu-ai/GLM-5.1 --tensor-parallel-size 4" },
      { tool: "SGLang", cmd: "python -m sglang.launch_server --model zhipu-ai/GLM-5.1 --tp 4" },
    ],
    url: "https://z.ai",
  },
  {
    name: "Qwen3.6-27B",
    lab: "Alibaba (Qwen Team)",
    params: "27B dense",
    context: "262K (1M YaRN)",
    license: "Apache 2.0",
    sweBench: "77.2%",
    liveCodeBench: "83.9",
    humanEval: "~91%",
    vram: "1× RTX 5090 (24GB, Q4)",
    bestFor: "Consumer hardware, single GPU, best performance-per-parameter",
    deploy: [
      { tool: "Ollama", cmd: "ollama run qwen3.6:27b" },
      { tool: "vLLM", cmd: "vllm serve Qwen/Qwen3.6-27B" },
      { tool: "LM Studio", cmd: "Download from HuggingFace, load in LM Studio" },
    ],
    url: "https://huggingface.co/Qwen/Qwen3.6-27B",
  },
  {
    name: "Qwen3-Coder-Next",
    lab: "Alibaba (Qwen Team)",
    params: "80B total / 3B active MoE",
    context: "256K tokens",
    license: "Apache 2.0",
    sweBench: "~65%",
    liveCodeBench: "~80",
    humanEval: "~90%",
    vram: "1× RTX 5090 (24GB, Q4)",
    bestFor: "Best efficiency per active param, agentic CLI tool use",
    deploy: [
      { tool: "Ollama", cmd: "ollama run qwen3-coder-next" },
      { tool: "vLLM", cmd: "vllm serve Qwen/Qwen3-Coder-Next --tensor-parallel-size 1" },
    ],
    url: "https://huggingface.co/Qwen",
  },
  {
    name: "DeepSeek V4 Flash",
    lab: "DeepSeek AI",
    params: "284B MoE / 13B active",
    context: "1M tokens",
    license: "MIT",
    sweBench: "~72%",
    liveCodeBench: "~85",
    humanEval: "~90%",
    vram: "1× H100 (80GB)",
    bestFor: "Cost-efficient self-hosted MoE, runs on single H100",
    deploy: [
      { tool: "vLLM", cmd: "vllm serve deepseek-ai/DeepSeek-V4-Flash --tensor-parallel-size 1" },
      { tool: "SGLang", cmd: "python -m sglang.launch_server --model deepseek-ai/DeepSeek-V4-Flash --tp 1" },
    ],
    url: "https://chat.deepseek.com",
  },
  {
    name: "StarCoder 3 15B",
    lab: "BigCode / Hugging Face",
    params: "15B dense",
    context: "16K tokens",
    license: "BigCode OpenRAIL-M",
    sweBench: "~45%",
    liveCodeBench: "~55",
    humanEval: "85.4%",
    vram: "1× RTX 4090 (16GB, Q4)",
    bestFor: "Fully open (weights + data + code), auditable training",
    deploy: [
      { tool: "Ollama", cmd: "ollama run starcoder3:15b" },
      { tool: "vLLM", cmd: "vllm serve bigcode/StarCoder3-15B" },
    ],
    url: "https://huggingface.co/bigcode",
  },
  {
    name: "MiniMax M3",
    lab: "MiniMax",
    params: "~400B MoE",
    context: "1M tokens",
    license: "Modified MIT",
    sweBench: "59.0% (Pro)",
    liveCodeBench: "~88",
    humanEval: "~93%",
    vram: "2× H100 (80GB)",
    bestFor: "First open-weight frontier model with 1M context + multimodality",
    deploy: [
      { tool: "vLLM", cmd: "vllm serve minimax/MiniMax-M3 --tensor-parallel-size 4" },
      { tool: "SGLang", cmd: "python -m sglang.launch_server --model minimax/MiniMax-M3 --tp 4" },
    ],
    url: "https://minimax.com",
  },
];

const categories = [
  { name: "Workstation GPU (24GB)", vram: "24GB", models: ["Qwen3.6-27B", "Qwen3-Coder-Next", "StarCoder 3 15B", "DeepSeek V4 Flash"] },
  { name: "Single H100/A100 (80GB)", vram: "80GB", models: ["DeepSeek V4 Flash", "Qwen3.6-27B", "GLM-5.1"] },
  { name: "Multi-GPU Enterprise", vram: "160GB+", models: ["DeepSeek V4 Pro", "Kimi K2.6", "MiniMax M3", "GLM-5.1"] },
  { name: "Consumer Laptop (16GB)", vram: "16GB", models: ["StarCoder 3 15B", "Qwen3-Coder-Next (Q4)"] },
];

export default function OpenSourceModelsPage() {
  return (
    <div className="container-main py-8">
      <div className="text-center mb-12">
        <Badge variant="cyan" className="mb-4">Open Source</Badge>
        <h1 className="text-4xl font-bold text-white font-[family-name:var(--font-neural)] mb-4">
          Open-Source Coding Models
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          In 2026, open-weight code models match proprietary alternatives on raw code generation benchmarks.
          Self-host them for zero per-seat costs, complete code privacy, and unlimited inference.
        </p>
      </div>

      <section className="mb-16">
        <h2 className="text-xl font-semibold text-white mb-6 font-[family-name:var(--font-neural)]">
          Choose by Hardware
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card key={cat.name} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg glass flex items-center justify-center">
                  <svg className="w-4 h-4 text-stream-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{cat.name}</h3>
                  <p className="text-xs text-zinc-500">{cat.vram} VRAM</p>
                </div>
              </div>
              <ul className="space-y-1">
                {cat.models.map((m) => (
                  <li key={m} className="text-sm text-zinc-400 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {m}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-xl font-semibold text-white mb-6 font-[family-name:var(--font-neural)]">
          Model Leaderboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Model</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Lab</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Params</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">License</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">SWE-Bench</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">LiveCodeBench</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium">Context</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-zinc-100 font-medium">{m.name}</span>
                  </td>
                  <td className="py-3 px-4 text-zinc-400">{m.lab}</td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{m.params}</td>
                  <td className="py-3 px-4">
                    <Badge variant={m.license === "Apache 2.0" ? "success" : m.license === "MIT" ? "cyan" : "default"}>
                      {m.license}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-mono">{m.sweBench}</td>
                  <td className="py-3 px-4 text-stream-400 font-mono">{m.liveCodeBench}</td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{m.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white mb-6 font-[family-name:var(--font-neural)]">
          Model Details & Deployment
        </h2>
        {models.map((model) => (
          <Card key={model.name} className="p-6 overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">
                    {model.name}
                  </h3>
                  <Badge variant={model.license === "Apache 2.0" ? "success" : model.license === "MIT" ? "cyan" : "default"}>
                    {model.license}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-500">{model.lab}</p>
              </div>
              <a
                href={model.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-stream-400 transition-colors flex items-center gap-1"
              >
                Visit
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="glass rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Parameters</p>
                <p className="text-xs text-zinc-200 font-mono mt-0.5">{model.params}</p>
              </div>
              <div className="glass rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Context</p>
                <p className="text-xs text-zinc-200 font-mono mt-0.5">{model.context}</p>
              </div>
              <div className="glass rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">VRAM Needed</p>
                <p className="text-xs text-zinc-200 font-mono mt-0.5">{model.vram}</p>
              </div>
              <div className="glass rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Best For</p>
                <p className="text-xs text-zinc-200 mt-0.5">{model.bestFor}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Deployment Commands</p>
              <div className="space-y-1.5">
                {model.deploy.map((d) => (
                  <div key={d.tool} className="flex items-center gap-2">
                    <Badge variant="default" className="shrink-0">{d.tool}</Badge>
                    <code className="text-xs text-zinc-300 font-mono bg-zinc-950/50 px-2 py-1 rounded overflow-x-auto whitespace-nowrap">
                      {d.cmd}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </section>

      {models.length > 0 && (
        <section className="mt-16 p-8 rounded-lg glass glass-strong text-center">
          <h2 className="text-xl font-semibold text-white mb-3 font-[family-name:var(--font-neural)]">
            Run any model in AIVerse
          </h2>
          <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
            Connect your own OpenAI-compatible endpoint (vLLM, Ollama, SGLang) and route agent
            execution through the model of your choice. Your code never leaves your hardware.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <span>Configure in</span>
            <code className="text-purple-400 font-mono text-xs bg-purple-500/10 px-2 py-0.5 rounded">Settings → API Keys</code>
          </div>
        </section>
      )}
    </div>
  );
}
