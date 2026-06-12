import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  if (query) where.OR = [
    { name: { contains: query, mode: "insensitive" } },
    { systemPrompt: { contains: query, mode: "insensitive" } },
  ];

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
          <h1 className="text-2xl font-bold text-white">Explore Agents</h1>
          <p className="text-sm text-zinc-500">{agents.length} agents available</p>
        </div>
        <Link href="/agents/create">
          <Button>Publish Agent</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <Link key={cat} href={`/agents${cat === "ALL" ? "" : `?category=${cat}`}`}>
            <Badge
              variant={category === cat ? "purple" : "default"}
              className="cursor-pointer"
            >
              {cat === "ALL" ? "All" : cat}
            </Badge>
          </Link>
        ))}
      </div>

      {agents.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-zinc-500">No agents found</p>
          <Link href="/agents/create">
            <Button variant="secondary" className="mt-4">Be the first to publish</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
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
