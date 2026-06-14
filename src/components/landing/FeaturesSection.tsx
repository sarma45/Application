"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Lightning Execution",
    desc: "Run AI agents with sub-second latency. SSE streaming delivers real-time results across 7 AI providers with automatic failover.",
    gradient: "from-purple-500 to-violet-600",
    border: "hover:border-purple-500/50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Enterprise Security",
    desc: "AES-256 encryption for all prompts. Rate limiting, CSRF protection, prompt injection detection, and a trust scoring system.",
    gradient: "from-cyan-500 to-blue-600",
    border: "hover:border-cyan-500/50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Credit Commerce",
    desc: "Built-in monetization. Creators earn 80% revenue share. Users buy credits via Stripe. Subscriptions auto-renew. Transparent pricing.",
    gradient: "from-emerald-500 to-teal-600",
    border: "hover:border-emerald-500/50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    title: "Multi-Provider AI",
    desc: "Smart routing across OpenAI, Anthropic, Gemini, Groq, DeepSeek, Cohere, and OpenRouter. Circuit breaker pattern protects reliability.",
    gradient: "from-orange-500 to-red-600",
    border: "hover:border-orange-500/50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "GDPR Compliant",
    desc: "Full data export, account deletion, 12-month execution log retention, 7-year transaction logs. SOC2-ready audit trail.",
    gradient: "from-pink-500 to-rose-600",
    border: "hover:border-pink-500/50",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: "Agent Categories",
    desc: "Chat, Code, Data, and Workflow agents. Each category optimized with the best model routing for its task type.",
    gradient: "from-violet-500 to-purple-600",
    border: "hover:border-violet-500/50",
  },
];

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950 pointer-events-none" />

      <div className="container-main relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider text-purple-300 uppercase bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              build and scale
            </span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            From AI agent execution to monetization — a complete platform for creators, developers, and businesses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div
                className={`group relative p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] ${feature.border}`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 text-white mb-4 shadow-lg`}>
                  {feature.icon}
                </div>

                <h3 className="relative text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>

                <p className="relative text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                  {feature.desc}
                </p>

                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}