import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NeuralText } from "@/components/effects/neural-text";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/redis";

export const dynamic = "force-dynamic";

const categories = [
  { slug: "CHAT", label: "Chat Agents", desc: "Conversational AI for any task", icon: "💬" },
  { slug: "CODE", label: "Code Agents", desc: "Generate, review, and debug code", icon: "⌨️" },
  { slug: "DATA", label: "Data Agents", desc: "Analyze, visualize, and transform data", icon: "📊" },
  { slug: "WORKFLOW", label: "Workflow Agents", desc: "Automate multi-step processes", icon: "⚡" },
];

const morphingBlobs = [
  "M25,50 C25,22.4 47.4,0 75,0 C102.6,0 125,22.4 125,50 C125,77.6 102.6,100 75,100 C47.4,100 25,77.6 25,50 Z",
  "M30,45 C35,20 55,5 80,10 C105,15 115,35 110,60 C105,85 85,95 60,90 C35,85 25,70 30,45 Z",
  "M20,55 C15,30 35,10 60,15 C85,20 105,40 100,65 C95,90 75,100 50,95 C25,90 25,80 20,55 Z",
];

export default async function HomePage() {
  const cacheKey = "home:featured";
  let featuredAgents = await cacheGet<any[]>(cacheKey);
  if (!featuredAgents) {
    featuredAgents = await prisma.agent.findMany({
      where: { status: "APPROVED" },
      orderBy: { totalRuns: "desc" },
      take: 6,
      include: { creator: { select: { username: true } } },
    });
    await cacheSet(cacheKey, featuredAgents, CACHE_TTL.FEATURED_AGENTS);
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-light min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent" />
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <svg className="absolute -top-40 -right-40 w-[600px] h-[600px] opacity-10 animate-float" viewBox="0 0 150 100">
            <path d={morphingBlobs[0]} fill="url(#neuralGrad)" />
            <defs>
              <linearGradient id="neuralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(106,0,240)" />
                <stop offset="100%" stopColor="rgb(0,230,204)" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="absolute -bottom-20 -left-20 w-[400px] h-[400px] opacity-10 animate-float" style={{ animationDelay: "-2s" }} viewBox="0 0 150 100">
            <path d={morphingBlobs[1]} fill="url(#neuralGrad2)" />
            <defs>
              <linearGradient id="neuralGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(0,230,204)" />
                <stop offset="100%" stopColor="rgb(106,0,240)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="container-main relative py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="purple" className="mb-6 animate-float">
              <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-purple-400 neural-pulse" />
              AI Agent Marketplace
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-theme leading-tight">
              Discover, deploy, and<br />
              <NeuralText as="span" className="inline-block mt-2">
                monetize AI agents
              </NeuralText>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-secondary max-w-2xl mx-auto">
              The unified hub where creators publish agents, developers build tools,
              and businesses deploy governed AI workflows.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/agents">
                <Button size="lg" className="neural-glow">
                  Explore Agents
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="/agents/create">
                <Button variant="secondary" size="lg">
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Publish Agent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-main py-20 scroll-reveal">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-theme">Agent Categories</h2>
          <p className="mt-2 text-secondary">Find the right agent for any task</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link key={cat.slug} href={`/agents?category=${cat.slug}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <Card className="p-6 group cursor-pointer">
                <span className="text-3xl block transition-transform duration-300 group-hover:scale-110 group-hover:animate-float">{cat.icon}</span>
                <h3 className="mt-4 font-semibold text-theme group-hover:neural-text transition-all duration-300">
                  {cat.label}
                </h3>
                <p className="mt-1 text-sm text-secondary">{cat.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {featuredAgents.length > 0 && (
        <section className="container-main pb-20 scroll-reveal">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-theme">Featured Agents</h2>
              <p className="text-sm text-secondary">Most popular agents on AIVerse</p>
            </div>
            <Link href="/agents">
              <Button variant="ghost" size="sm">
                View all
                <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredAgents.map((agent: any) => (
              <Link key={agent.id} href={`/agents/${agent.slug}`}>
                <Card className="p-5 group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={agent.category === "CHAT" ? "purple" : agent.category === "CODE" ? "success" : agent.category === "DATA" ? "warning" : "default"}>
                      {agent.category}
                    </Badge>
                    <span className="text-xs text-secondary font-mono">{agent.totalRuns} runs</span>
                  </div>
                  <h3 className="font-semibold text-theme group-hover:neural-text transition-all duration-300">
                    {agent.name}
                  </h3>
                  <p className="mt-1 text-sm text-secondary line-clamp-2">{agent.systemPrompt?.slice(0, 100)}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted">
                    <span>by {agent.creator.username || "anonymous"}</span>
                    {agent.pricingType === "FREE" ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      <span>{agent.creditsPerRun} credits</span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-light py-20 scroll-reveal">
        <div className="container-main text-center">
          <h2 className="text-3xl font-bold text-theme">Built for everyone</h2>
          <p className="mt-2 text-secondary mb-12">From solo creators to enterprise teams</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "For Creators", desc: "Publish agents, earn 80% revenue share, and grow your audience with zero platform fees for 6 months." },
              { title: "For Developers", desc: "Integrate AI agents into your workflow with our API. Build SaaS products on top of our agent runtime." },
              { title: "For Businesses", desc: "Deploy governed AI workflows with team workspaces, SSO, audit logs, and custom SLAs." },
            ].map((item, i) => (
              <Card key={item.title} className="p-6" style={{ animationDelay: `${i * 0.15}s` }}>
                <h3 className="text-lg font-semibold text-theme mb-2">{item.title}</h3>
                <p className="text-sm text-secondary">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
