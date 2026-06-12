# AIVerse 2.0 Deployment Guide

## Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+ (optional, for rate limiting)
- Stripe account (for payments)
- OpenRouter / Gemini API key (for AI inference)
- S3-compatible storage (MinIO, AWS S3, Cloudflare R2 - optional)

## Environment Variables

Copy `.env.example` to `.env` and fill all values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | 64-char random string (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app |
| `OPENROUTER_API_KEY` | OpenRouter API key (AI inference) |

### Optional but Recommended

| Variable | Description | Default |
|---|---|---|
| `REDIS_URL` | Redis connection string | Disabled |
| `GEMINI_API_KEY` | Google Gemini as AI fallback | Fallback disabled |
| `RESEND_API_KEY` | Email delivery (Resend) | Emails logged only |
| `STRIPE_SECRET` | Stripe secret key | Payments disabled |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Webhooks disabled |
| `STRIPE_PRO_PRICE_ID` | Stripe Pro price ID | Pro plan disabled |
| `RAZORPAY_KEY_ID` | Razorpay key ID | Razorpay disabled |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | Razorpay disabled |
| `S3_ENDPOINT` | S3-compatible endpoint | Local temp storage |
| `S3_ACCESS_KEY` | S3 access key | Local temp storage |
| `S3_SECRET_KEY` | S3 secret key | Local temp storage |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Email/password only |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Email/password only |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Email/password only |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | Email/password only |

## Docker Deployment

### Quick Start

```bash
docker compose up -d
```

This starts:
- **app** - Next.js app (port 3000)
- **db** - PostgreSQL 16
- **redis** - Redis 7

### Production Build

```bash
docker build -t aiverse:latest -f Dockerfile.prod .
docker run -p 3000:3000 --env-file .env aiverse:latest
```

## Manual Deployment

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Database Setup

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

### 3. Build

```bash
pnpm build
```

### 4. Start

```bash
# Production
pnpm start

# Development
pnpm dev
```

## Database Migrations

### Create a migration

```bash
pnpm prisma migrate dev --name <migration_name>
```

### Apply to production

```bash
pnpm prisma migrate deploy
```

### Reset (dev only)

```bash
pnpm prisma migrate reset --force
```

## Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{ "status": "ok", "timestamp": "2026-06-12T..." }
```

## Monitoring

The app logs structured JSON to stdout in production mode. Use any log aggregator (Datadog, Grafana Loki, ELK) to ingest.

### Log Levels

Set `LOG_LEVEL` env var:
- `debug` - verbose debugging
- `info` (default) - normal operations
- `warn` - warnings only
- `error` - errors only

## Security Notes

1. Never commit `.env` files
2. Rotate `AUTH_SECRET` on every deployment
3. Use strong secrets for `STRIPE_WEBHOOK_SECRET`
4. Enable rate limiting in production (Redis required)
5. Configure CORS if using separate frontend domain
6. Security headers are set via `next.config.mjs`
7. CSP is configured - update CSP in production with your domain

## Scale Considerations

- **Horizontal scaling**: App is stateless; scale behind a load balancer
- **Session affinity**: Not required (sessions stored in DB)
- **Rate limiting**: Use Redis backend (`REDIS_URL`) for shared state
- **Database connection**: Increase `DATABASE_URL` connection pool for high traffic
- **File storage**: Configure S3 endpoint (`S3_ENDPOINT`) for persistent uploads
