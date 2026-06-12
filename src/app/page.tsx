import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/redis";

const categories = [
  { slug: "CHAT", label: "Chat Agents", desc: "Conversational AI for any task", icon: "💬" },
  { slug: "CODE", label: "Code Agents", desc: "Generate, review, and debug code", icon: "⌨️" },
  { slug: "DATA", label: "Data Agents", desc: "Analyze, visualize, and transform data", icon: "📊" },
  { slug: "WORKFLOW", label: "Workflow Agents", desc: "Automate multi-step processes", icon: "⚡" },
];

export default async function HomePage() {
  const cacheKey = "home:featured";
  let featuredAgents = await cacheGet<any[]>(cacheKey);
  if (!featuredAgents) {
    featuredAgents = await prisma.agent.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { totalRuns: "desc" },
      take: 6,
      include: { creator: { select: { username: true } } },
    });
    await cacheSet(cacheKey, featuredAgents, CACHE_TTL.FEATURED_AGENTS);
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent" />
        <div className="container-main relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="purple" className="mb-4">AI Agent Marketplace</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              Discover, deploy, and<br />
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                monetize AI agents
              </span>
            </h1>
            <p className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto">
              The unified hub where creators publish agents, developers build tools,
              and businesses deploy governed AI workflows.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/agents">
                <Button size="lg">Explore Agents</Button>
              </Link>
              <Link href="/agents/create">
                <Button variant="secondary" size="lg">Publish Agent</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-main py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Agent Categories</h2>
          <p className="mt-2 text-zinc-400">Find the right agent for any task</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/agents?category=${cat.slug}`}>
              <Card className="p-6 hover:border-purple-500/50 transition-colors group cursor-pointer">
                <span className="text-3xl">{cat.icon}</span>
                <h3 className="mt-4 font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">{cat.label}</h3>
                <p className="mt-1 text-sm text-zinc-500">{cat.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {featuredAgents.length > 0 && (
        <section className="container-main pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Agents</h2>
              <p className="text-sm text-zinc-500">Most popular agents on AIVerse</p>
            </div>
            <Link href="/agents">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredAgents.map((agent) => (
              <Link key={agent.id} href={`/agents/${agent.slug}`}>
                <Card className="p-5 hover:border-zinc-700 transition-colors group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={agent.category === "CHAT" ? "purple" : agent.category === "CODE" ? "success" : agent.category === "DATA" ? "warning" : "default"}>
                      {agent.category}
                    </Badge>
                    <span className="text-xs text-zinc-500">{agent.totalRuns} runs</span>
                  </div>
                  <h3 className="font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">{agent.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{agent.systemPrompt?.slice(0, 100)}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
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

      <section className="border-t border-zinc-800 py-20">
        <div className="container-main text-center">
          <h2 className="text-3xl font-bold text-white">Built for everyone</h2>
          <p className="mt-2 text-zinc-400 mb-12">From solo creators to enterprise teams</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "For Creators", desc: "Publish agents, earn 80% revenue share, and grow your audience with zero platform fees for 6 months." },
              { title: "For Developers", desc: "Integrate AI agents into your workflow with our API. Build SaaS products on top of our agent runtime." },
              { title: "For Businesses", desc: "Deploy governed AI workflows with team workspaces, SSO, audit logs, and custom SLAs." },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
