import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchBar } from "@/components/agent/search-bar";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/redis";

const categories = ["ALL", "CHAT", "CODE", "DATA", "WORKFLOW"];

interface AgentsPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const params = await searchParams;
  const category = params.category || "ALL";
  const query = params.q || "";

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (category !== "ALL") where.category = category;
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const cacheKey = `agents:list:${category}:${query}`;
  let agents = await cacheGet<any[]>(cacheKey);
  if (!agents) {
    agents = await prisma.agent.findMany({
      where: where as any,
      orderBy: { totalRuns: "desc" },
      include: { creator: { select: { username: true } } },
    });
    await cacheSet(cacheKey, agents, CACHE_TTL.SEARCH);
  }

  return (
    <div className="container-main py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-neural)]">Explore Agents</h1>
          <p className="text-sm text-zinc-500">{agents.length} agents available</p>
        </div>
        <Link href="/agents/create">
          <Button>Publish Agent</Button>
        </Link>
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <Link key={cat} href={`/agents${cat === "ALL" ? "" : `?category=${cat}`}`}>
            <Badge
              variant={category === cat ? "purple" : "default"}
              className="cursor-pointer transition-all duration-300"
            >
              {cat === "ALL" ? "All" : cat}
            </Badge>
          </Link>
        ))}
      </div>

      {agents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full glass flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-zinc-500">No agents found</p>
          <Link href="/agents/create">
            <Button variant="secondary" className="mt-4">Be the first to publish</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.slug}`}>
              <Card className="p-5 group h-full">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={agent.category === "CHAT" ? "purple" : agent.category === "CODE" ? "success" : agent.category === "DATA" ? "warning" : "default"}>
                    {agent.category}
                  </Badge>
                  <span className="text-xs text-zinc-500 font-mono">{agent.totalRuns} runs</span>
                </div>
                <h3 className="font-semibold text-zinc-100 group-hover:neural-text transition-all duration-300 font-[family-name:var(--font-neural)]">
                  {agent.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{agent.systemPrompt?.slice(0, 100)}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
                  <span>by {agent.creator.username || "anonymous"}</span>
                  {agent.pricingType === "FREE" ? (
                    <span className="text-emerald-400">Free</span>
                  ) : (
                    <span>{agent.creditsPerRun} credits/run</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
