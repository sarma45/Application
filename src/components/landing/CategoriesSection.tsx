"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const categories = [
  {
    slug: "CHAT",
    label: "Chat Agents",
    desc: "Conversational AI for customer support, sales, and personal assistants. Stream responses in real-time via SSE.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    gradient: "from-purple-500 to-violet-600",
    glow: "group-hover:shadow-purple-500/20",
    model: "OpenRouter → Gemini → OpenAI",
    stats: "45% of executions",
  },
  {
    slug: "CODE",
    label: "Code Agents",
    desc: "Generate, review, debug, and document code across 50+ languages. Syntax-highlighted output with copy-to-clipboard.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-500/20",
    model: "OpenRouter → Anthropic → Gemini",
    stats: "30% of executions",
  },
  {
    slug: "DATA",
    label: "Data Agents",
    desc: "Analyze CSV, XLSX, PDF, and DOCX files. RAG-powered Q&A, table generation, and multi-modal document understanding.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: "from-cyan-500 to-blue-600",
    glow: "group-hover:shadow-cyan-500/20",
    model: "Gemini → OpenAI → DeepSeek",
    stats: "15% of executions",
  },
  {
    slug: "WORKFLOW",
    label: "Workflow Agents",
    desc: "Automate multi-step processes with MCP tools. Web search, code execution, data analysis, HTTP requests, and email.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    gradient: "from-orange-500 to-rose-600",
    glow: "group-hover:shadow-orange-500/20",
    model: "Gemini → OpenRouter → Groq",
    stats: "10% of executions",
  },
];

export default function CategoriesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-transparent to-zinc-950/50 pointer-events-none" />

      <div className="container-main relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider text-emerald-300 uppercase bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
            Agent Categories
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Specialized AI for{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              every task
            </span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Four distinct agent categories, each with optimized model routing and specialized capabilities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
            >
              <Link href={`/agents?category=${cat.slug}`}>
                <div
                  className={`group relative p-5 md:p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm transition-all duration-500 hover:scale-[1.01] hover:border-zinc-700/50 ${cat.glow} hover:shadow-xl`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex items-start gap-4 md:gap-5">
                    <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} p-2 md:p-3 text-white shadow-lg`}>
                      {cat.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all">
                          {cat.label}
                        </h3>
                        <span className="text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                          {cat.stats}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                        {cat.desc}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-zinc-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{cat.model}</span>
                      </div>
                    </div>

                    <svg className="shrink-0 w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}