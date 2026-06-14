"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Discover Agents",
    desc: "Browse our curated marketplace of AI agents across Chat, Code, Data, and Workflow categories. Filter by category, search by keyword, or let our semantic search find the perfect agent for your task.",
    gradient: "from-purple-500 to-violet-600",
  },
  {
    number: "02",
    title: "Execute & Stream",
    desc: "Run any agent with one click. Results stream in real-time via SSE. Your conversation history persists across sessions. No setup, no infrastructure — just instant AI execution.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    number: "03",
    title: "Build & Publish",
    desc: "Create your own AI agents with our multi-step publishing wizard. Define system prompts, set pricing, and submit for moderation. Once approved, your agent is live on the marketplace.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    number: "04",
    title: "Earn & Scale",
    desc: "Every time a user runs your agent, you earn 80% of the credit cost. Track performance in your analytics dashboard, request payouts, and scale your reach with featured placements.",
    gradient: "from-orange-500 to-rose-600",
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent hidden md:block" />
      </div>

      <div className="container-main relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-20"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider text-cyan-300 uppercase bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            From discovery to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              revenue
            </span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Four simple steps to start using — and building — AI agents on AIVerse.
          </p>
        </motion.div>

        <div className="space-y-12 md:space-y-24">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 * i }}
              className={`relative flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-6 md:gap-16`}
            >
              <div className="flex-1">
                <div className={`inline-flex items-center gap-3 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r ${step.gradient} bg-opacity-10 border border-white/10 mb-4`}>
                  <span className="text-xs font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-zinc-400 leading-relaxed max-w-lg">{step.desc}</p>
              </div>

                  <div className="shrink-0">
                <div className={`relative w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-gradient-to-br ${step.gradient} p-0.5`}>
                  <div className="w-full h-full rounded-2xl md:rounded-3xl bg-zinc-950 flex items-center justify-center">
                    <span className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>
                  <div className={`absolute -inset-4 rounded-3xl bg-gradient-to-br ${step.gradient} opacity-20 blur-xl`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}