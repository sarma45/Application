# AIVerse 2.0 - Unified Step Documentation Index

This document serves as the single entry point for all development prompts and audit records for the AIVerse 2.0 project. Each step doc is an AI-ready prompt designed to be fed to an AI coding assistant.

---

## Document Map

| Step | File | Purpose | When to Use |
|------|------|---------|-------------|
| **Step 1** | `step_1_comprehensive_audit_and_gaps.md` | Audit results & gap inventory | Start here to understand known issues and resolved items |
| **Step 2** | `step_2_master_architecture_query.md` | Full-stack architecture instructions | Implementing Next.js app + AI Gateway changes |
| **Step 3** | `step_3_master_agent_swarm_query.md` | Agent swarm microservice instructions | Building/modifying the standalone agent execution service |
| **Step 4** | `step_4_continuous_ui_and_3d_development.md` | Frontend & WebGL instructions | Developing UI components, 3D models, canvas optimization |
| **Full Directive** | `ULTRA_MODERNIZED_QUERY.md` | Phased bug fixes + 3D UI overhaul | Starting fresh or major feature sprints |
| **Kimi Prompt** | `kimi_2_6_prompt.md` | Kimi 2.6-specific variant of the full directive | Using Kimi 2.6 as the AI assistant |

---

## Execution Order

For a full project bootstrapping, follow this sequence:

```
Step 1 (Audit) → Step 2 (Architecture) → Step 3 (Agent Swarm) → Step 4 (UI/3D)
```

For targeted work, jump to the relevant step:

| Task | Use Step |
|------|----------|
| Understanding current bugs & gaps | Step 1 |
| Fixing backend/API/database issues | Step 2 |
| Building agent execution infrastructure | Step 3 |
| Developing UI components or 3D scenes | Step 4 |
| Full phased modernization sprint | ULTRA_MODERNIZED_QUERY |
| Quick bug fix + UI pass | kimi_2_6_prompt |

---

## Codebase Verification (as of current repo state)

All file references in the step docs have been verified against the actual codebase. Key findings:

### Confirmed Files

| Document Reference | Actual Path | Status |
|---|---|---|
| `services/ai-gateway/src/server.ts` | `/project/workspace/services/ai-gateway/src/server.ts` | Exists |
| `services/ai-gateway/src/gateway.ts` | `/project/workspace/services/ai-gateway/src/gateway.ts` | Exists |
| `services/ai-gateway/src/routing.ts` | `/project/workspace/services/ai-gateway/src/routing.ts` | Exists |
| `services/ai-gateway/src/circuit-breaker.ts` | `/project/workspace/services/ai-gateway/src/circuit-breaker.ts` | Exists |
| `src/lib/ai/gateway.ts` | `/project/workspace/src/lib/ai/gateway.ts` | Exists |
| `src/lib/websocket.ts` | `/project/workspace/src/lib/websocket.ts` | Exists |
| `src/lib/stripe.ts` | `/project/workspace/src/lib/stripe.ts` | Exists |
| `src/middleware.ts` | `/project/workspace/src/middleware.ts` | Exists |
| `src/lib/prisma/index.ts` | `/project/workspace/src/lib/prisma/index.ts` | Exists |
| `src/app/globals.css` | `/project/workspace/src/app/globals.css` | Exists |
| `packages/shared/` | `/project/workspace/packages/shared/` | Exists |
| `aiverse-swarm-service/` | `/project/workspace/aiverse-swarm-service/` | Exists |

### Bug Fix Accuracy

| Issue (from Step 1 / ULTRA_MODERNIZED) | Current Code State |
|---|---|
| `checkSafety` unawaited in server.ts | **FIXED** - `await checkSafety(prompt)` is present |
| Gateway catches all errors indiscriminately | **FIXED** - 4xx errors throw immediately, only 5xx triggers fallback |
| Key rotation on every access | **FIXED** - `rotateApiKey()` only called on 429/401/403 |
| Circuit breaker in-memory only | **PARTIAL** - ai-gateway uses Redis + in-memory fallback; Next.js copy is in-memory only |
| WebSocket auth bypass | **FIXED** - JWT verification via `next-auth/jwt` (`getToken`) |
| Stripe module-scope crash | **FIXED** - Lazy `getStripe()` singleton pattern |
| Rate limit memory leak | **FIXED** - Redis Lua script + in-memory with pruning (2000 entry cap) |
| Prisma env mutation | **FIXED** - Explicit `datasources` config with `DATABASE_POOL_URL` support |

### Additional Files Not Referenced in Step Docs

| Path | Purpose |
|---|---|
| `services/ai-gateway/src/safety.ts` | Content safety checking |
| `services/ai-gateway/src/providers.ts` | Provider configurations |
| `services/ai-gateway/src/types.ts` | Type definitions |
| `services/ai-gateway/src/tracing.ts` | OpenTelemetry setup |
| `src/lib/ai/safety.ts` | App-side safety checking |
| `src/lib/ai/providers.ts` | App-side provider configs |
| `src/lib/ai/routing.ts` | App-side routing |
| `src/lib/ai/circuit-breaker.ts` | App-side circuit breaker (in-memory only) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  AIVerse 2.0 Monorepo                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐    ┌───────────────────────┐  │
│  │   Next.js App    │    │   AI Gateway Service   │  │
│  │   (src/)         │───▶│   (services/ai-gateway)│  │
│  │                  │    │                       │  │
│  │ - Frontend UI    │    │ - Provider routing    │  │
│  │ - API routes     │    │ - Safety checks       │  │
│  │ - WebSocket      │    │ - Key rotation        │  │
│  │ - Auth/Stripe    │    │ - Circuit breakers    │  │
│  └──────────────────┘    └───────────────────────┘  │
│           │                         │               │
│           ▼                         ▼               │
│  ┌──────────────────┐    ┌───────────────────────┐  │
│  │  Shared Package  │    │   Agent Swarm Service  │  │
│  │  (packages/      │    │   (aiverse-swarm-     │  │
│  │   shared/)       │    │    service/)           │  │
│  └──────────────────┘    └───────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              Infrastructure                   │   │
│  │  PostgreSQL (pgvector) │ Redis │ BullMQ      │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Provider Support

7 AI providers with dual API key support per provider:

| Provider | Categories | Key Variable |
|----------|-----------|--------------|
| OpenRouter | All | `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2` |
| Gemini | All | `GEMINI_API_KEY`, `GEMINI_API_KEY_2` |
| OpenAI | All | `OPENAI_API_KEY`, `OPENAI_API_KEY_2` |
| Anthropic | All | `ANTHROPIC_API_KEY`, `ANTHROPIC_API_KEY_2` |
| DeepSeek | All | `DEEPSEEK_API_KEY`, `DEEPSEEK_API_KEY_2` |
| Groq | All | `GROQ_API_KEY`, `GROQ_API_KEY_2` |
| Cohere | All | `COHERE_API_KEY`, `COHERE_API_KEY_2` |

Routing matrix varies by agent category: CHAT, CODE, DATA, WORKFLOW.

---

## Deployment Reference

See `DEPLOYMENT.md` for full deployment instructions.

**Quick commands:**
```bash
# Docker
docker compose up -d

# Manual
pnpm install && pnpm prisma migrate deploy && pnpm build && pnpm start

# Health check
curl http://localhost:3000/api/health
```

**Required env vars:** `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `OPENROUTER_API_KEY`

**Optional:** `REDIS_URL`, `GEMINI_API_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, S3 config, OAuth configs.
