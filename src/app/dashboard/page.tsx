import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500">Welcome back, {session.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="purple">{session.user.plan}</Badge>
          {wallet && (
            <div className="flex items-center gap-1 text-sm text-zinc-300">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
              </svg>
              {formatCredits(wallet.balance)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Total Runs</p>
            <p className="text-2xl font-bold text-white mt-1">{recentExecutions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">My Agents</p>
            <p className="text-2xl font-bold text-white mt-1">{agents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Credits</p>
            <p className="text-2xl font-bold text-white mt-1">{wallet ? formatCredits(wallet.balance) : "0"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">My Agents</h2>
            <Link href="/agents/create">
              <Button variant="secondary" size="sm">New Agent</Button>
            </Link>
          </div>
          {agents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-zinc-500">No agents yet</p>
                <Link href="/agents/create">
                  <Button variant="primary" size="sm" className="mt-3">Create your first agent</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.slug}`}>
                  <Card className="p-4 hover:border-zinc-700 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{agent.name}</p>
                      <p className="text-xs text-zinc-500">{agent.totalRuns} runs</p>
                    </div>
                    <Badge variant={agent.status === "PUBLISHED" ? "success" : agent.status === "DRAFT" ? "warning" : "default"}>
                      {agent.status}
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          {recentExecutions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-zinc-500">No activity yet. Try running an agent!</p>
                <Link href="/agents">
                  <Button variant="primary" size="sm" className="mt-3">Browse agents</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentExecutions.map((exec) => (
                <Card key={exec.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/agents/${exec.agent.slug}`} className="text-sm font-medium text-zinc-200 hover:text-purple-400">
                        {exec.agent.name}
                      </Link>
                      <p className="text-xs text-zinc-500">{formatDate(exec.createdAt)}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      <p>{exec.creditsUsed} credits</p>
                      <Badge variant={exec.status === "COMPLETED" ? "success" : "danger"}>{exec.status}</Badge>
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
