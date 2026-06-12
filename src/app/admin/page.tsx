import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ModerationActions } from "@/components/admin/moderation-actions";

export default async function AdminPage() {
  const session = await requireRole("ADMIN", "MODERATOR");

  const [pendingAgents, allUsers, recentAuditLogs] = await Promise.all([
    prisma.agent.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { creator: { select: { email: true } } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { email: true } } } }),
  ]);

  return (
    <div className="container-main py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-zinc-500">Moderation & system management</p>
        </div>
        <Badge variant="purple">{session.user.role}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100">Pending Agents ({pendingAgents.length})</h2>
              </div>
              {pendingAgents.length === 0 ? (
                <p className="text-sm text-zinc-500">No pending agents</p>
              ) : (
                <div className="space-y-2">
                  {pendingAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                      <div>
                        <Link href={`/agents/${agent.slug}`} className="text-sm font-medium text-zinc-200 hover:text-purple-400">
                          {agent.name}
                        </Link>
                        <p className="text-xs text-zinc-500">by {agent.creator.email} &middot; {agent.category}</p>
                      </div>
                      <ModerationActions agentId={agent.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Recent Users</h2>
              <div className="space-y-2">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm text-zinc-300">{user.email}</p>
                      <p className="text-xs text-zinc-600">Joined {formatDate(user.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "ADMIN" ? "purple" : user.role === "CREATOR" ? "success" : "default"}>
                        {user.role}
                      </Badge>
                      <Badge>{user.plan}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-3">Audit Log</h2>
              <div className="space-y-2">
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="text-xs text-zinc-500 border-b border-zinc-800 pb-2 last:border-0">
                    <span className="text-zinc-400">{log.actor.email}</span>
                    <span className="text-zinc-600"> &middot; {log.action}</span>
                    <p className="text-zinc-600">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <h2 className="text-sm font-semibold text-zinc-200">Quick Stats</h2>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Users</span>
                <span className="text-zinc-300">{allUsers.length}+</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Pending</span>
                <span className="text-zinc-300">{pendingAgents.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
