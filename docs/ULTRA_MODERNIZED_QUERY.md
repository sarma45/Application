# AIVerse Master Modernization & Bug Fix Directive

You are tasked with fixing all critical backend and microservice issues, and then implementing an ultra-modern, Kimi 2.6-level 3D interactive layout for the **AIVerse AI Agent Marketplace** application.

Please execute this instructions in phases:
- **Phase 1**: Critical Bug Fixes (Next.js Application & AI Gateway Microservice)
- **Phase 2**: Core Design System & CSS Variables
- **Phase 3**: Single-Canvas React Three Fiber & GSAP Scroll-Trigger Setup
- **Phase 4**: 3D UI Components (AgentCard3D, NeuralBackgroundV2)
- **Phase 5**: Homepage & Polish (Transitions, Performance, Add-ons)

---

## 🛠 SECTION 1: CRITICAL BUG FIXES & MICROSERVICE AUDIT

### [A] AI Gateway Microservice (`services/ai-gateway/`)

#### 1. P0 Bug: safety.ts checkSafety Unawaited Promise Failures
*   **File**: `services/ai-gateway/src/server.ts` (lines 27-30)
*   **Problem**: `checkSafety(prompt)` is an `async` function and returns a `Promise`. However, it is called synchronously without `await`. This makes `safety.safe` evaluate to `undefined` (since the Promise object has no `safe` property), causing `!safety.safe` to always evaluate as `true`. Every incoming request to `/v1/complete` is rejected as a content policy violation.
*   **Fix**: Await the `checkSafety` call: `const safety = await checkSafety(prompt);`.

#### 2. P0 Bug: gateway.ts Indiscriminate Provider Fallback
*   **File**: `services/ai-gateway/src/gateway.ts` (lines 34-49)
*   **Problem**: The loop catches *all* errors thrown by a provider (including client validations, bad request formats, or invalid options) and falls back to subsequent providers. 
*   **Fix**: Only execute fallback routing on **5xx server errors** or connection timeouts. Let 4xx client errors bubble up to the user immediately.

#### 3. P1 Issue: keyRotationIndex Indiscriminate Alternation
*   **File**: `services/ai-gateway/src/routing.ts` (lines 55-71)
*   **Problem**: Keys are rotated on *every* access during Category routing creation, causing mismatching rotations instead of rotating keys *only* when a rate limit, quota exhaustion, or failure is hit on a specific key.
*   **Fix**: Implement rotation logic that falls back to the secondary key only when the primary key returns a `429 Too Many Requests` or authentication error.

#### 4. P1 Issue: In-Memory Map Circuit Breaker Scaling
*   **File**: `services/ai-gateway/src/circuit-breaker.ts` (line 18)
*   **Problem**: Circuit states are kept in a local in-memory Map (`circuits`). When scaling the AI Gateway horizontally across multiple node processes, states are unsynced.
*   **Fix**: Leverage the configured Redis client (`ioredis` is already a dependency) to store circuit statuses globally.

---

### [B] Next.js Application (`src/`)

#### 5. P0 Bug: AI Gateway API Handler Silent Fallbacks
*   **File**: `src/lib/ai/gateway.ts` (lines 44-52)
*   **Problem**: Next.js client-side handler catches all API errors and silently downgrades, masking bad inputs.
*   **Fix**: Modify catch clauses to allow 4xx client-side errors to fail fast.

#### 6. P0 Bug: WebSocket Authorization Bypass
*   **File**: `src/lib/websocket.ts` (lines 36-44)
*   **Problem**: Connection logic trusts a client-submitted `userId` string without checking JWT tokens or sessions.
*   **Fix**: Authenticate using verified JWTs/next-auth session signatures before socket handshake completion.

#### 7. P0 Bug: Stripe Module-Scope Initializer Crash
*   **File**: `src/lib/stripe.ts`
*   **Problem**: Stripe initializes directly at import time, crashing the Node server if env variables are not present.
*   **Fix**: Refactor to a lazy-loaded `getStripe()` singleton function pattern.

#### 8. P0 Bug: rate Limit Memory Leak
*   **File**: `src/middleware.ts`
*   **Problem**: In-memory rate limiting map grows indefinitely.
*   **Fix**: Use Redis-backed rate limiting.

#### 9. P0 Bug: Prisma Database URL Mutation
*   **File**: `src/lib/prisma/index.ts` (lines 8-10)
*   **Problem**: Prisma mutates `process.env.DATABASE_URL` at runtime.
*   **Fix**: Pass connection configuration explicitly into the Prisma client constructor block instead.

---

## 🎨 SECTION 2: ULTRA-MODERN 3D UI TRANSFORMATION (Kimi 2.6-Level)

### 1. Unified CSS Variables & Design Tokens
*   Configure `src/app/globals.css` with Tailwind CSS v4 variables.
*   Implement dark space mode (dark deep blues, violet, space greys) with high-performance glassmorphism card layouts.

### 2. Single-Canvas React Three Fiber (R3F) Layout
*   Create a root-level `UnifiedSceneProvider` (React Context) hosting a single fullscreen R3F `<Canvas>`.
*   Avoid mounting multiple Canvas components. Use a registry to map sub-meshes, custom camera tracks, and shaders per route.
*   Optimize rendering: utilize instanced meshes for heavy scenes, frustum culling, and Level-of-Detail (LOD).

### 3. Interactive Hero Section (`HeroScene3D.tsx`)
*   Add scroll-linked animations (e.g. using GSAP ScrollTrigger):
    - *0% - 30%*: Floating particles form a neural network constellation.
    - *30% - 60%*: Mesh nodes morph smoothly into a 3D Agent Core model.
    - *60% - 100%*: The model centers and launches categorized orbits.
*   Implement mouse-guided parallax with spring damping.

### 4. Interactive 3D Cards (`AgentCard3D.tsx`)
*   Implement mouse-tilt animation on card hover (using CSS 3D perspectives or WebGL).
*   Add custom shaders (acrylic refraction, render-to-texture previews) and particle hover trail emissions.

### 5. WebGL Page Transitions & Polish
*   Implement a vertex-shader page fold or warp transition when navigating.
*   Lazy-load heavy 3D assets, package textures in KTX2 formats, and verify typescript compilation using `npm run typecheck`.
