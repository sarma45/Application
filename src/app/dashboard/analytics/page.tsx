import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCredits, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AnalyticsPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [agents, totalEarnings, pendingPayouts] = await Promise.all([
    prisma.agent.findMany({
      where: { creatorId: userId },
      include: {
        _count: { select: { executions: true, reviews: true } },
      },
      orderBy: { totalRuns: "desc" },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.creatorPayout.findMany({
      where: { creatorId: userId, status: "PENDING" },
    }),
  ]);

  const totalPendingPayouts = pendingPayouts.reduce((sum, p) => sum + Number(p.amountUsd), 0);

  return (
    <div className="container-main py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Analytics</h1>
          <p className="text-sm text-zinc-500">Track your agent performance and earnings</p>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Published Agents</p>
            <p className="text-2xl font-bold text-white mt-1">{agents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Total Runs</p>
            <p className="text-2xl font-bold text-white mt-1">
              {agents.reduce((sum, a) => sum + a.totalRuns, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Lifetime Earned</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {formatCredits(totalEarnings?.lifetimeEarned || 0)} credits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500">Pending Payouts</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              ${totalPendingPayouts.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-zinc-500 mb-4">No agents published yet</p>
            <Link href="/agents/create">
              <Button>Create your first agent</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Agent Performance</h2>
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/agents/${agent.slug}`}
                        className="text-sm font-semibold text-zinc-200 hover:text-purple-400"
                      >
                        {agent.name}
                      </Link>
                      <Badge variant={agent.status === "APPROVED" ? "success" : agent.status === "PENDING" ? "warning" : "default"}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {agent._count.executions} runs &middot; {agent._count.reviews} reviews
                      {agent.avgRating ? ` &middot; ${agent.avgRating.toFixed(1)} ★` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <p>{agent.creditsPerRun} credits/run</p>
                    <p>{formatDate(agent.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
