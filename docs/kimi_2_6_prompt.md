# Kimi 2.6 Master Implementation Prompt

Copy and paste the prompt below directly into Kimi 2.6 to guide it through the bug-fixing and 3D UI transformation phases.

***

```markdown
You are an expert full-stack engineer and WebGL/3D developer specializing in Next.js, React Three Fiber (R3F), GSAP, Express, Prisma, and Redis.

Your task is to modernize the **AIVerse AI Agent Marketplace** application by executing two main phases:
1. **Critical Bug Fixes**: Diagnose and fix 9 critical bugs in both the Next.js app and the AI Gateway microservice.
2. **Ultra-Modern 3D UI Transformation**: Implement a stunning, high-performance 3D layout using R3F, GSAP, and Tailwind CSS v4.

---

### 📦 PROJECT ARCHITECTURE & STRUCTURE

- **Monorepo Root**: Next.js frontend (App Router, Tailwind CSS v4, Prisma, NextAuth, WebSocket client)
- **Shared Package**: `packages/shared/` (common interfaces, utility modules)
- **AI Gateway Microservice**: `services/ai-gateway/` (Express, TypeScript, OpenTelemetry, Redis, AI model routing)
- **Infrastructure (Docker)**: Configurations are organized in `infra/` (`nginx.conf`, `otel-collector.yml`, `pgbouncer.ini`)

---

### 🛠 SECTION 1: CRITICAL BUG FIXES & MICROSERVICE AUDIT

#### 1. AI Gateway Microservice (`services/ai-gateway/`)
- **P0 Bug in `services/ai-gateway/src/server.ts`**:
  *   **Issue**: `checkSafety(prompt)` is called synchronously without `await`. It returns a Promise, so `safety.safe` is always `undefined`, causing all requests to get blocked by safety checks.
  *   **Fix**: Correctly await the safety check: `const safety = await checkSafety(prompt);`.
- **P0 Bug in `services/ai-gateway/src/gateway.ts`**:
  *   **Issue**: The provider fallback loop catches all errors (including 4xx client input/format errors) and triggers unnecessary failovers.
  *   **Fix**: Route fallbacks *only* on **5xx server errors** or timeouts. Let 4xx client errors propagate to the caller immediately.
- **P1 Issue in `services/ai-gateway/src/routing.ts`**:
  *   **Issue**: API keys rotate on every single request, leading to key mismatches.
  *   **Fix**: Rotate the key *only* when a rate limit (429) or authentication error is returned by a provider.
- **P1 Issue in `services/ai-gateway/src/circuit-breaker.ts`**:
  *   **Issue**: The circuit state is stored in an in-memory `Map`, which does not sync when scaling the AI Gateway horizontally.
  *   **Fix**: Migrate the state store to the configured Redis client (`ioredis` is already a dependency).

#### 2. Next.js App (`src/`)
- **P0 Bug in `src/lib/ai/gateway.ts`**:
  *   **Issue**: The client handler catches all API errors and silently downgrades, hiding client-side request validation issues.
  *   **Fix**: Modify catch blocks to allow 4xx client-side errors to fail-fast.
- **P0 Bug in `src/lib/websocket.ts`**:
  *   **Issue**: WebSocket auth trusts the client-provided `userId` parameter without validation.
  *   **Fix**: Authenticate using validated JWT tokens or NextAuth session signatures during the connection handshake.
- **P0 Bug in `src/lib/stripe.ts`**:
  *   **Issue**: Stripe initializes directly at module-import time, crashing the server if configuration env variables are missing.
  *   **Fix**: Refactor to a lazy-loaded `getStripe()` singleton pattern.
- **P0 Bug in `src/middleware.ts`**:
  *   **Issue**: An in-memory rate limiting map grows infinitely, causing a memory leak.
  *   **Fix**: Re-route the rate-limiting checks to use Redis (`ioredis`).
- **P0 Bug in `src/lib/prisma/index.ts`**:
  *   **Issue**: Prisma mutates `process.env.DATABASE_URL` at runtime, causing configuration issues.
  *   **Fix**: Pass connection parameters explicitly inside the PrismaClient constructor.

---

### 🎨 SECTION 2: ULTRA-MODERN 3D UI TRANSFORMATION (Kimi 2.6-Level)

Please write clean, TypeScript-compliant code to build the following components:

#### 1. Unified CSS Variables & Design Tokens (`src/app/globals.css`)
- Configure Tailwind CSS v4 variables with a dark space theme (deep space blues, neon violets, dark greys).
- Create styling classes for glassmorphic card layouts with rich glows and transitions.

#### 2. Single-Canvas React Three Fiber (R3F) Layout
- Implement a `UnifiedSceneProvider` (React Context) hosting a single fullscreen R3F `<Canvas>`.
- Use a central registry where components/routes can register their sub-meshes, cameras, and shaders to avoid mounting multiple R3F canvases.
- Optimize using instanced meshes, LOD (Level of Detail), and camera frustum culling.

#### 3. Hero Section GSAP Animations (`HeroScene3D.tsx`)
- Bind GSAP ScrollTrigger to the single canvas scene:
  - **0% - 30%**: Floating particles align into a neural network constellation.
  - **30% - 60%**: Mesh nodes morph smoothly into a 3D Agent Core model.
  - **60% - 100%**: The model centers and launches orbits representing marketplace categories.
- Implement smooth mouse-guided camera/object parallax.

#### 4. Interactive 3D Cards (`AgentCard3D.tsx`)
- Implement a 3D hover-tilt effect (using CSS 3D perspectives or WebGL).
- Apply custom shaders (acrylic refraction, render-to-texture preview) and high-performance particle hover trails.

#### 5. WebGL Page Transitions & Optimization
- Implement a vertex-shader page warp/fold transition for page navigation.
- Ensure all 3D assets are lazy-loaded and textures are in KTX2 format.
- Ensure all TypeScript checks pass: `pnpm typecheck` or `npm run typecheck` must run without errors.

Please implement these phases sequentially, focusing on high reliability, robust TypeScript types, and maximum performance.
```
