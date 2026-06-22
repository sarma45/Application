import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SwarmDashboard } from "@/components/agent/SwarmDashboard";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/redis";

export const metadata: Metadata = {
  title: "Agent Swarm Coordination Center",
  description: "Real-time dispatch dashboard for multi-agent autonomous loops, S3 storage synchronizations, and sandbox runs.",
};

export default async function SwarmPage() {
  const cacheKey = "agents:swarm-list";
  let agents = await cacheGet<any[]>(cacheKey);

  if (!agents) {
    agents = await prisma.agent.findMany({
      where: { status: "APPROVED" },
      orderBy: { totalRuns: "desc" },
    });
    // Parse toolsConfig if it is database-stored as stringified JSON or keep it as parsed
    agents = agents.map(agent => ({
      ...agent,
      toolsConfig: typeof agent.toolsConfig === "string" ? JSON.parse(agent.toolsConfig) : agent.toolsConfig,
    }));
    await cacheSet(cacheKey, agents, CACHE_TTL.SEARCH);
  }

  return (
    <div className="container-main py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-theme">
          Agent Swarm Coordination Center
        </h1>
        <p className="text-sm text-secondary mt-1 max-w-3xl">
          Dispatch agents inside our isolated sandbox microservice to orchestrate tasks across web searches, 
          sandboxed code runs, subagent delegations, and cloud file synchronizations.
        </p>
      </div>

      <SwarmDashboard agents={agents} />
    </div>
  );
}
