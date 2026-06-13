import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCredits } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [wallet, agents, recentExecutions] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.agent.findMany({ where: { creatorId: userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.agentExecution.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { agent: { select: { name: true, slug: true } } },
    }),
  ]);

  return (
    <div className="container-main py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-theme">Dashboard</h1>
          <p className="text-sm text-secondary">Welcome back, {session.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="purple">{session.user.plan}</Badge>
          {wallet && (
            <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-sm text-theme">
              <svg className="h-4 w-4 text-stream-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatCredits(wallet.balance)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Runs", value: recentExecutions.length, icon: "run" },
          { label: "My Agents", value: agents.length, icon: "agent" },
          { label: "Credits", value: wallet ? formatCredits(wallet.balance) : "0", icon: "credit" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-secondary">{stat.label}</p>
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                {stat.icon === "run" && (
                  <svg className="w-4 h-4 text-stream-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {stat.icon === "agent" && (
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {stat.icon === "credit" && (
                  <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-theme font-mono">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme">My Agents</h2>
            <Link href="/agents/create">
              <Button variant="secondary" size="sm">New Agent</Button>
            </Link>
          </div>
          {agents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-secondary">No agents yet</p>
                <Link href="/agents/create">
                  <Button variant="primary" size="sm" className="mt-3">Create your first agent</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.slug}`}>
                  <Card className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-theme">{agent.name}</p>
                      <p className="text-xs text-secondary">{agent.totalRuns} runs</p>
                    </div>
                    <Badge variant={agent.status === "APPROVED" ? "success" : agent.status === "DRAFT" ? "warning" : agent.status === "PENDING" ? "warning" : "default"}>
                      {agent.status}
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-theme mb-4">Recent Activity</h2>
          {recentExecutions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-secondary">No activity yet. Try running an agent!</p>
                <Link href="/agents">
                  <Button variant="primary" size="sm" className="mt-3">Browse agents</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentExecutions.map((exec, idx) => (
                <Card key={exec.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        exec.status === "COMPLETED" ? "bg-emerald-400" : "bg-red-400"
                      } neural-pulse`} />
                      {idx < recentExecutions.length - 1 && (
                        <div className="w-px h-full min-h-[2rem] bg-gradient-to-b from-white/10 to-transparent" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <Link href={`/agents/${exec.agent.slug}`} className="text-sm font-medium text-theme hover:text-stream-400 transition-colors">
                          {exec.agent.name}
                        </Link>
                        <p className="text-xs text-secondary">{formatDate(exec.createdAt)}</p>
                      </div>
                      <div className="text-right text-xs text-secondary">
                        <p>{exec.creditsUsed} credits</p>
                        <Badge variant={exec.status === "COMPLETED" ? "success" : "danger"}>{exec.status}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
