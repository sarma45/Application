import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { FeaturedToggle } from "@/components/admin/featured-toggle";

export default async function AdminPage() {
  const session = await requireRole("ADMIN", "MODERATOR");

  const [pendingAgents, allUsers, recentAuditLogs, featuredAgents] = await Promise.all([
    prisma.agent.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { creator: { select: { email: true } } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { email: true } } } }),
    prisma.agent.findMany({ where: { isFeatured: true }, orderBy: { totalRuns: "desc" }, take: 10, include: { creator: { select: { email: true } } } }),
  ]);

  return (
    <div className="container-main py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-theme">Admin Panel</h1>
          <p className="text-sm text-secondary">Moderation & system management</p>
        </div>
        <Badge variant="purple">{session.user.role}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-theme">
                  Pending Agents ({pendingAgents.length})
                </h2>
              </div>
              {pendingAgents.length === 0 ? (
                <p className="text-sm text-secondary">No pending agents</p>
              ) : (
                <div className="space-y-2">
                  {pendingAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg glass">
                      <div>
                        <Link href={`/agents/${agent.slug}`} className="text-sm font-medium text-theme hover:text-stream-400 transition-colors">
                          {agent.name}
                        </Link>
                        <p className="text-xs text-secondary">by {agent.creator.email} &middot; {agent.category}</p>
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
              <h2 className="text-lg font-semibold text-theme mb-4">
                Recent Audit Logs
              </h2>
              {recentAuditLogs.length === 0 ? (
                <p className="text-sm text-secondary">No audit logs</p>
              ) : (
                <div className="space-y-2">
                  {recentAuditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-light last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 neural-pulse" />
                        <div>
                          <p className="text-sm text-theme">{log.action}</p>
                          <p className="text-xs text-muted">
                            {log.actor.email} &middot; {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold text-theme mb-4">
                Users ({allUsers.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0">
                      <p className="text-sm text-theme truncate">{user.email}</p>
                      <p className="text-xs text-muted">
                        {user.role} &middot; {user.plan}
                      </p>
                    </div>
                    <Badge variant={user.isActive ? "success" : "danger"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold text-theme mb-4">
                Featured Agents
              </h2>
              {featuredAgents.length === 0 ? (
                <p className="text-sm text-secondary">No featured agents</p>
              ) : (
                <div className="space-y-2">
                  {featuredAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between py-1.5">
                      <div className="min-w-0">
                        <Link href={`/agents/${agent.slug}`} className="text-sm text-theme hover:text-stream-400 truncate block transition-colors">
                          {agent.name}
                        </Link>
                        <p className="text-xs text-muted">by {agent.creator.email}</p>
                      </div>
                      <FeaturedToggle agentId={agent.id} isFeatured />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
