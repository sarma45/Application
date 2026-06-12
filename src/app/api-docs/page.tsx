const API_ENDPOINTS = [
  {
    group: "Authentication",
    endpoints: [
      { method: "POST", path: "/api/auth/register", auth: false, desc: "Register a new user account" },
      { method: "POST", path: "/api/auth/logout", auth: true, desc: "Log out current session" },
      { method: "POST", path: "/api/auth/forgot-password", auth: false, desc: "Request password reset email" },
      { method: "POST", path: "/api/auth/reset-password", auth: false, desc: "Reset password with token" },
      { method: "GET", path: "/api/auth/session", auth: true, desc: "Get current session info" },
      { method: "POST", path: "/api/auth/verify-email/send", auth: true, desc: "Send verification email" },
      { method: "POST", path: "/api/auth/verify-email", auth: false, desc: "Verify email with token" },
    ],
  },
  {
    group: "Agents",
    endpoints: [
      { method: "GET", path: "/api/agents", auth: false, desc: "List agents (paginated, filterable)" },
      { method: "POST", path: "/api/agents", auth: true, desc: "Create a new agent" },
      { method: "GET", path: "/api/agents/:slug", auth: false, desc: "Get agent details" },
      { method: "PATCH", path: "/api/agents/:slug", auth: true, desc: "Update agent" },
      { method: "POST", path: "/api/agents/:slug/publish", auth: true, desc: "Submit agent for moderation" },
      { method: "POST", path: "/api/agents/:slug/execute", auth: true, desc: "Execute an agent" },
      { method: "GET", path: "/api/agents/:slug/executions", auth: true, desc: "Get agent execution history" },
      { method: "POST", path: "/api/agents/:slug/reviews", auth: true, desc: "Review an agent" },
      { method: "GET", path: "/api/agents/:slug/reviews", auth: false, desc: "List agent reviews (paginated)" },
      { method: "POST", path: "/api/agents/:slug/favorite", auth: true, desc: "Toggle favorite agent" },
    ],
  },
  {
    group: "Wallet & Payments",
    endpoints: [
      { method: "GET", path: "/api/wallet", auth: true, desc: "Get wallet balance and stats" },
      { method: "POST", path: "/api/checkout", auth: true, desc: "Create Stripe checkout session" },
      { method: "POST", path: "/api/subscriptions/subscribe", auth: true, desc: "Subscribe to a plan" },
      { method: "POST", path: "/api/subscriptions/cancel", auth: true, desc: "Cancel subscription" },
      { method: "GET", path: "/api/subscriptions/plans", auth: false, desc: "List available plans" },
      { method: "POST", path: "/api/webhooks/stripe", auth: false, desc: "Stripe webhook handler" },
    ],
  },
  {
    group: "Creator Payouts",
    endpoints: [
      { method: "POST", path: "/api/payouts/request", auth: true, desc: "Request a payout" },
      { method: "GET", path: "/api/payouts", auth: true, desc: "List payouts (paginated)" },
    ],
  },
  {
    group: "Referrals",
    endpoints: [
      { method: "GET", path: "/api/referrals", auth: true, desc: "Get referral code and stats" },
      { method: "POST", path: "/api/referrals", auth: true, desc: "Generate referral code / redeem" },
    ],
  },
  {
    group: "Upload",
    endpoints: [
      { method: "POST", path: "/api/upload", auth: true, desc: "Upload file (S3/local, multipart form)" },
    ],
  },
  {
    group: "Chat",
    endpoints: [
      { method: "POST", path: "/api/chat", auth: true, desc: "Chat with AI (SSE stream)" },
    ],
  },
  {
    group: "Admin",
    endpoints: [
      { method: "GET", path: "/api/admin/analytics", auth: true, desc: "Platform analytics (admin only)" },
      { method: "GET", path: "/api/admin/users", auth: true, desc: "List users (admin only)" },
      { method: "POST", path: "/api/admin/users/:id/credits", auth: true, desc: "Adjust user credits" },
      { method: "GET", path: "/api/admin/agents/queue", auth: true, desc: "Moderation queue (admin/moderator)" },
      { method: "POST", path: "/api/admin/agents/:id", auth: true, desc: "Approve/reject agent" },
      { method: "GET", path: "/api/admin/audit-logs", auth: true, desc: "Audit log (admin only)" },
    ],
  },
  {
    group: "System",
    endpoints: [
      { method: "GET", path: "/api/health", auth: false, desc: "Health check endpoint" },
    ],
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-600",
    POST: "bg-blue-600",
    PATCH: "bg-amber-600",
    PUT: "bg-orange-600",
    DELETE: "bg-red-600",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-mono font-bold text-white rounded ${colors[method] || "bg-gray-600"}`}
    >
      {method}
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-gray-400 mb-8">
          AIVerse 2.0 REST API &mdash; base URL: <code className="text-cyan-400">{process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}</code>
        </p>

        <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-2">Authentication</h2>
          <p className="text-sm text-gray-400 mb-2">
            Most endpoints require a valid session cookie (HTTP-only, set by NextAuth). Include credentials or the
            <code className="text-cyan-400"> next-auth.session-token</code> cookie.
          </p>
          <p className="text-sm text-gray-400">
            Admin endpoints require the <code className="text-cyan-400">ADMIN</code> or <code className="text-cyan-400">MODERATOR</code> role.
          </p>
        </div>

        {API_ENDPOINTS.map((group) => (
          <div key={group.group} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2">
              {group.group}
            </h2>
            <div className="space-y-3">
              {group.endpoints.map((ep) => (
                <div
                  key={`${ep.method}-${ep.path}`}
                  className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800/50"
                >
                  <div className="shrink-0 pt-0.5">
                    <MethodBadge method={ep.method} />
                  </div>
                  <div className="min-w-0">
                    <code className="text-sm font-mono text-gray-200 break-all">
                      {ep.path}
                    </code>
                    <p className="text-sm text-gray-400 mt-0.5">{ep.desc}</p>
                  </div>
                  <div className="ml-auto shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        ep.auth
                          ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-green-900/50 text-green-400"
                      }`}
                    >
                      {ep.auth ? "Auth required" : "Public"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Error Response Format</h2>
          <pre className="text-sm text-gray-300 bg-gray-950 p-3 rounded overflow-x-auto">
{`{
  "error": "Human-readable error message"
}`}
          </pre>
        </div>

        <div className="mt-6 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Pagination</h2>
          <p className="text-sm text-gray-400 mb-2">
            List endpoints use cursor-based pagination. Include <code className="text-cyan-400">?cursor=&lt;id&gt;&limit=20</code> to paginate.
            The response returns <code className="text-cyan-400">nextCursor</code> (null if last page).
          </p>
          <pre className="text-sm text-gray-300 bg-gray-950 p-3 rounded overflow-x-auto">
{`{
  "data": [...],
  "nextCursor": "abc123" | null
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
