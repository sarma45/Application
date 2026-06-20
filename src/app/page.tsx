import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NeuralText } from "@/components/effects/neural-text";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/redis";
import HeroSection from "@/components/landing/HeroSection";
import { AgentCard3D } from "@/components/ui/AgentCard3D";

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
    <div className="overflow-x-hidden">
      <HeroSection />

      <section className="container-main py-20 scroll-reveal">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-theme">Agent Categories</h2>
          <p className="mt-2 text-secondary">Find the right agent for any task</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link key={cat.slug} href={`/agents?category=${cat.slug}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <AgentCard3D className="p-6 group cursor-pointer">
                <span className="text-3xl block transition-transform duration-300 group-hover:scale-110 group-hover:animate-float">{cat.icon}</span>
                <h3 className="mt-4 font-semibold text-theme group-hover:neural-text transition-all duration-300">
                  {cat.label}
                </h3>
                <p className="mt-1 text-sm text-secondary">{cat.desc}</p>
              </AgentCard3D>
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
                <AgentCard3D className="p-5 group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={agent.category === "CHAT" ? "purple" : agent.category === "CODE" ? "success" : agent.category === "DATA" ? "warning" : "default"}>
                      {agent.category}
                    </Badge>
                    <span className="text-xs text-secondary font-mono">{agent.totalRuns} runs</span>
                  </div>
                  <h3 className="font-semibold text-theme group-hover:neural-text transition-all duration-300">
                    {agent.name}
                  </h3>
                  <p className="mt-1 text-sm text-secondary line-clamp-2">{agent.description || agent.systemPrompt?.slice(0, 100)}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted">
                    <span>by {agent.creator.username || "anonymous"}</span>
                    {agent.pricingType === "FREE" ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      <span>{agent.creditsPerRun} credits</span>
                    )}
                  </div>
                </AgentCard3D>
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
