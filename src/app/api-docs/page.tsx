const ENDPOINTS = [
  {
    group: "Authentication",
    endpoints: [
      {
        method: "POST", path: "/api/auth/register",
        auth: false, desc: "Register a new user account",
        body: `{ "email": "user@example.com", "password": "Str0ng!Pass", "username?": "johndoe" }`,
        response: `{ "ok": true, "user": { "id": "cuid...", "email": "user@example.com" } }`,
        query: "",
      },
      {
        method: "POST", path: "/api/auth/logout",
        auth: true, desc: "Log out current session",
        body: "", response: `{ "ok": true }`, query: "",
      },
      {
        method: "POST", path: "/api/auth/forgot-password",
        auth: false, desc: "Send password reset email",
        body: `{ "email": "user@example.com" }`,
        response: `{ "ok": true, "message": "If the email exists, a reset link has been sent" }`, query: "",
      },
      {
        method: "POST", path: "/api/auth/reset-password",
        auth: false, desc: "Reset password with token",
        body: `{ "token": "reset_token", "password": "NewStr0ng!Pass" }`,
        response: `{ "ok": true, "message": "Password reset successfully" }`, query: "",
      },
      {
        method: "GET", path: "/api/auth/session",
        auth: true, desc: "Get current session user info",
        body: "", response: `{ "user": { "id": "...", "email": "...", "role": "USER", "plan": "FREE" } }`, query: "",
      },
      {
        method: "POST", path: "/api/auth/verify-email",
        auth: false, desc: "Verify email with token",
        body: `{ "token": "verification_token" }`,
        response: `{ "ok": true, "message": "Email verified successfully" }`, query: "",
      },
    ],
  },
  {
    group: "Agents",
    endpoints: [
      {
        method: "GET", path: "/api/agents",
        auth: false, desc: "List agents with pagination, search, and sort",
        body: "", query: "?q=search&category=CHAT&sort=trending&mine=true&cursor=abc&limit=20",
        response: `{ "agents": [...], "nextCursor": "cuid..." }`,
      },
      {
        method: "POST", path: "/api/agents",
        auth: true, desc: "Create a new agent",
        body: `{ "name": "My Agent", "category": "CHAT", "systemPrompt": "...", "pricingType": "FREE", "creditsPerRun": 0 }`,
        response: `{ "ok": true, "slug": "my-agent", "id": "cuid..." }`, query: "",
      },
      {
        method: "GET", path: "/api/agents/:slug",
        auth: false, desc: "Get agent details with creator info",
        body: "", response: `{ "agent": { "id": "...", "name": "...", "creator": {...}, ... } }`, query: "",
      },
      {
        method: "PATCH", path: "/api/agents/:slug",
        auth: true, desc: "Update agent (creates version snapshot)",
        body: `{ "name?": "...", "systemPrompt?": "...", "pricingType?": "PAID", "creditsPerRun?": 5 }`,
        response: `{ "ok": true, "agent": { ... } }`, query: "",
      },
      {
        method: "DELETE", path: "/api/agents/:slug",
        auth: true, desc: "Delete agent (creator or admin only)",
        body: "", response: `{ "ok": true }`, query: "",
      },
      {
        method: "POST", path: "/api/agents/:slug/execute",
        auth: true, desc: "Execute agent (SSE streamed response)",
        body: `{ "message": "Hello!", "sessionId?": "...", "systemPrompt?": "...", "_test?": true }`,
        response: "SSE stream: `data: {\"text\":\"...\"}\\n\\n` → `data: {\"done\":true,\"sessionId\":\"...\"}\\n\\ndata: [DONE]\\n\\n`",
        query: "",
      },
      {
        method: "POST", path: "/api/agents/:slug/reviews",
        auth: true, desc: "Review an agent (1-5 rating, one per user)",
        body: `{ "rating": 4, "title?": "Great!", "body?": "Really helpful agent" }`,
        response: `{ "ok": true, "review": { ... } }`, query: "",
      },
      {
        method: "GET", path: "/api/agents/:slug/reviews",
        auth: false, desc: "List reviews with pagination",
        body: "", query: "?cursor=abc&limit=20",
        response: `{ "data": [...], "nextCursor": "cuid..." }`,
      },
    ],
  },
  {
    group: "Wallet & Payments",
    endpoints: [
      {
        method: "GET", path: "/api/wallet",
        auth: true, desc: "Get wallet balance, lifetime stats",
        body: "", response: `{ "wallet": { "balance": 500, "lifetimeEarned": 1200, "lifetimeSpent": 700 } }`, query: "",
      },
      {
        method: "GET", path: "/api/wallet/transactions",
        auth: true, desc: "List wallet transactions (paginated)",
        body: "", query: "?cursor=abc&limit=20",
        response: `{ "data": [...], "nextCursor": "cuid..." }`,
      },
      {
        method: "POST", path: "/api/checkout",
        auth: true, desc: "Create Stripe checkout session (form-data)",
        body: "FormData: credits=100 | 500 | 1500 | 5000 | 20000",
        response: "302 Redirect to Stripe checkout URL", query: "",
      },
      {
        method: "POST", path: "/api/webhooks/stripe",
        auth: false, desc: "Stripe webhook (signature verified)",
        body: "Stripe event JSON", response: `{ "received": true }`, query: "",
      },
    ],
  },
  {
    group: "Payouts",
    endpoints: [
      {
        method: "POST", path: "/api/payouts/request",
        auth: true, desc: "Request creator payout (min $10, 30-day hold on first)",
        body: `{ "amountUsd": 25 }`,
        response: `{ "ok": true, "payout": { "id": "...", "status": "PENDING", ... } }`, query: "",
      },
      {
        method: "GET", path: "/api/payouts",
        auth: true, desc: "List my payouts (paginated)",
        body: "", query: "?cursor=abc&limit=20",
        response: `{ "data": [...], "nextCursor": "cuid..." }`,
      },
    ],
  },
  {
    group: "Admin",
    endpoints: [
      {
        method: "GET", path: "/api/admin/users",
        auth: true, desc: "List users (ADMIN/MODERATOR, paginated, searchable)",
        body: "", query: "?q=search&cursor=abc&limit=20",
        response: `{ "data": [...], "nextCursor": "cuid..." }`,
      },
      {
        method: "POST", path: "/api/admin/users/:id/suspend",
        auth: true, desc: "Toggle user suspend (ADMIN only)",
        body: "", response: `{ "ok": true, "user": { "id": "...", "isActive": false } }`, query: "",
      },
      {
        method: "POST", path: "/api/admin/users/:id/credits",
        auth: true, desc: "Adjust user credits (ADMIN only, +/- amount)",
        body: `{ "amount": 500, "description?": "Bonus for bug report" }`,
        response: `{ "ok": true, "balance": 1500 }`, query: "",
      },
    ],
  },
  {
    group: "System",
    endpoints: [
      {
        method: "GET", path: "/api/health",
        auth: false, desc: "Health check — DB connectivity + uptime",
        body: "", response: `{ "status": "ok", "timestamp": "...", "uptime": 12345 }`, query: "",
      },
      {
        method: "GET", path: "/api/users/me/export",
        auth: true, desc: "GDPR data export — full user data as JSON",
        body: "",
        response: `{ "data": { "exportedAt": "...", "profile": {...}, "wallets": [...], "agents": [...], ... } }`, query: "",
      },
    ],
  },
];

function Badge({ children, color }: { children: string; color: string }) {
  return <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold text-white rounded ${color}`}>{children}</span>;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-600", POST: "bg-blue-600", PATCH: "bg-amber-600",
  PUT: "bg-orange-600", DELETE: "bg-red-600",
};

export default function ApiDocsPage() {
  return (
    <div className="container-main py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-theme mb-2">API Documentation</h1>
      <p className="text-sm text-secondary mb-8">
        AIVerse 2.0 REST API &mdash; base URL:{" "}
        <code className="text-purple-400">{process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}</code>
      </p>

      <div className="mb-8 p-5 rounded-lg glass glass-strong space-y-2">
        <h2 className="text-lg font-semibold text-theme">Authentication</h2>
        <p className="text-sm text-secondary">
          Most endpoints require the <code className="text-purple-400">next-auth.session-token</code> cookie
          (HTTP-only, set automatically by NextAuth on sign-in).
        </p>

        <h3 className="text-sm font-semibold text-theme mt-4">Error Response</h3>
        <pre className="text-sm text-theme p-3 rounded bg-theme/20 overflow-x-auto">{`{
  "error": "Human-readable message",
  "code": "ERROR_CODE"          // optional, machine-readable
}`}</pre>

        <h3 className="text-sm font-semibold text-theme mt-4">Pagination</h3>
        <p className="text-sm text-secondary">
          Use <code className="text-purple-400">?cursor=&lt;last_id&gt;&limit=20</code>. Response includes{" "}
          <code className="text-purple-400">nextCursor</code> (<code className="text-purple-400">null</code> = last page).
        </p>
        <pre className="text-sm text-theme p-3 rounded bg-theme/20 overflow-x-auto">{`{
  "data": [...],
  "nextCursor": "cuid..." | null
}`}</pre>
      </div>

      {ENDPOINTS.map((group) => (
        <div key={group.group} className="mb-10">
          <h2 className="text-lg font-semibold text-theme mb-4 border-b border-light pb-2">{group.group}</h2>
          <div className="space-y-3">
            {group.endpoints.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="p-4 rounded-lg glass space-y-3">
                <div className="flex items-start gap-3 flex-wrap">
                  <Badge color={METHOD_COLORS[ep.method] || "bg-gray-600"}>{ep.method}</Badge>
                  <code className="text-sm font-mono text-theme break-all flex-1">{ep.path}</code>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    ep.auth
                      ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                      : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  }`}>
                    {ep.auth ? "Auth" : "Public"}
                  </span>
                </div>
                <p className="text-sm text-secondary">{ep.desc}</p>
                {ep.query && (
                  <div>
                    <span className="text-xs text-muted font-semibold">Query:</span>
                    <code className="text-xs text-purple-400 ml-2">{ep.query}</code>
                  </div>
                )}
                {ep.body && (
                  <div>
                    <span className="text-xs text-muted font-semibold">Request body:</span>
                    <pre className="text-xs text-theme mt-1 p-2 rounded bg-theme/20 overflow-x-auto">{ep.body}</pre>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted font-semibold">Response:</span>
                  <pre className="text-xs text-theme mt-1 p-2 rounded bg-theme/20 overflow-x-auto">{ep.response}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
