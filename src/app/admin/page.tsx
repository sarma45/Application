import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { FeaturedToggle } from "@/components/admin/featured-toggle";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

async function UserList({ search, sort }: { search: string; sort: string }) {
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" as const } },
      { username: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const orderBy: any =
    sort === "oldest" ? { createdAt: "asc" }
    : sort === "agents" ? { agents: { _count: "desc" } }
    : sort === "executions" ? { agentExecutions: { _count: "desc" } }
    : { createdAt: "desc" };

  const users = await prisma.user.findMany({
    where: where as any,
    orderBy: orderBy as any,
    take: 50,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      plan: true,
      isActive: true,
      createdAt: true,
      _count: { select: { agents: true, agentExecutions: true } },
    },
  });

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {users.length === 0 ? (
        <p className="text-sm text-secondary">No users found</p>
      ) : (
        users.map((user) => (
          <div key={user.id} className="flex items-center justify-between py-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-theme truncate">{user.email}</p>
              <p className="text-xs text-muted">
                {user.role} &middot; {user.plan}
                {" "}&middot; {user._count?.agents ?? 0} agents
                {" "}&middot; {user._count?.agentExecutions ?? 0} runs
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge variant={user.isActive ? "success" : "danger"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
              {user.role !== "ADMIN" && (
                <form action={`/api/admin/users/${user.id}/suspend`} method="POST">
                  <button
                    type="submit"
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      user.isActive
                        ? "text-red-400 hover:bg-red-400/10"
                        : "text-green-400 hover:bg-green-400/10"
                    }`}
                  >
                    {user.isActive ? "Suspend" : "Restore"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default async function AdminPage(props: PageProps) {
  const session = await requireRole("ADMIN", "MODERATOR");
  const searchParams = await props.searchParams;
  const search = searchParams.q || "";
  const sort = searchParams.sort || "latest";

  const [pendingAgents, recentAuditLogs, featuredAgents] = await Promise.all([
    prisma.agent.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { email: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { email: true } } },
    }),
    prisma.agent.findMany({
      where: { isFeatured: true },
      orderBy: { totalRuns: "desc" },
      take: 10,
      include: { creator: { select: { email: true } } },
    }),
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-theme">Users</h2>
              </div>
              <form className="mb-4 space-y-3" method="GET">
                <input
                  type="text"
                  name="q"
                  defaultValue={search}
                  placeholder="Search by email or username..."
                  className="flex w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                  <select
                    name="sort"
                    defaultValue={sort}
                    onChange={(e) => e.target.form?.requestSubmit()}
                    className="flex-1 rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                    <option value="agents">Most Agents</option>
                    <option value="executions">Most Executions</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                  >
                    Filter
                  </button>
                </div>
              </form>
              <Suspense fallback={<p className="text-sm text-secondary">Loading...</p>}>
                <UserList search={search} sort={sort} />
              </Suspense>
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