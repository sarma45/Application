# AIVerse 2.0 — Environment Variables Registry

This document catalogs every environment variable configured in AIVerse 2.0. The system consists of three services:
1. **Core Web App (Next.js)**: Runs on port `3000`/`3002`.
2. **AI Gateway**: Runs on port `4001`.
3. **Swarm Worker Service**: Standalone background worker consuming from BullMQ queue.

---

## 💻 1. CORE WEB APP (Next.js)
Located at: `/project/workspace/`  
Example file: [Root .env.example](file:///project/workspace/.env.example)

### Required Setup
| Variable | Description | Example / Recommended |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://aiverse:aiverse@localhost:5432/aiverse` |
| `DATABASE_POOL_URL` | Transaction connection pooler (e.g. PgBouncer). | `postgresql://aiverse:aiverse@pgbouncer:6432/aiverse` |
| `AUTH_SECRET` | Used for NextAuth cookie signing. | Generate via `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | Base public URL of the web server. | `http://localhost:3000` |
| `AI_GATEWAY_URL` | HTTP endpoint of the AI Gateway microservice. | `http://ai-gateway:4001` |
| `REDIS_URL` | Connection string for BullMQ queue/PubSub logs. | `redis://:aiverse@localhost:6379` |

### Integrations (Optional)
| Variable | Description | Scope / Integration |
| :--- | :--- | :--- |
| `STRIPE_SECRET` | Stripe API credentials. | Credit Topups (Wallet) |
| `STRIPE_WEBHOOK_SECRET`| Validates Stripe payment events. | Webhooks |
| `RAZORPAY_KEY_ID` | Razorpay payment credential ID. | Credit Topups (Wallet) |
| `RAZORPAY_KEY_SECRET` | Razorpay payment credential secret. | Credit Topups (Wallet) |
| `RESEND_API_KEY` | Resend mail delivery credentials. | Email Verifications |
| `S3_ENDPOINT` | Storage endpoint. | Storage uploads (MinIO/R2) |
| `S3_ACCESS_KEY` | Storage Access Key. | Storage uploads (MinIO/R2) |
| `S3_SECRET_KEY` | Storage Secret Key. | Storage uploads (MinIO/R2) |
| `S3_BUCKET` | Destination bucket name. | Storage uploads (MinIO/R2) |

---

## ⚡ 2. AI GATEWAY MICROSERVICE
Located at: `/project/workspace/services/ai-gateway/`  
Example file: [AI Gateway .env.example](file:///project/workspace/services/ai-gateway/.env.example)

The AI Gateway routes LLM requests through multiple providers. Setting up at least one API key is required.

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `AI_GATEWAY_PORT` | The port the gateway listens on. | `4001` |
| `REDIS_URL` | Connection for rate limiting & metrics. | `redis://:aiverse@localhost:6379` |
| `OPENROUTER_API_KEY` | OpenRouter credential. | Empty |
| `GEMINI_API_KEY` | Google Gemini credential. | Empty |
| `OPENAI_API_KEY` | OpenAI API credential. | Empty |
| `ANTHROPIC_API_KEY` | Anthropic Claude API credential. | Empty |
| `DEEPSEEK_API_KEY` | DeepSeek API credential. | Empty |
| `GROQ_API_KEY` | Groq API credential. | Empty |

### Model Overrides (Optional)
Overrides allow mapping specific completion endpoints to alternative target models:
- `GEMINI_MODEL` (Default: `gemini-2.5-flash`)
- `OPENROUTER_MODEL` (Default: `meta-llama/llama-4-maverick:free`)
- `OPENAI_MODEL` (Default: `gpt-4o-mini`)
- `ANTHROPIC_MODEL` (Default: `claude-3-haiku-20240307`)

---

## 🤖 3. AGENT SWARM SERVICE
Located at: `/project/workspace/aiverse-swarm-service/`  
Example file: [Swarm .env.example](file:///project/workspace/aiverse-swarm-service/.env.example)

The Swarm Worker executes long-running multi-agent workflows. It reads from the Redis queue and writes logs and results to Postgres/S3.

*Note: By default, this service is configured to look upwards and read configurations directly from the root `.env` file.*

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | Accesses `Agent` system prompts and writes `AgentExecution` logs. |
| `REDIS_URL` | Listens to task queue (`agent-swarm-execution`) and publishes live event streams. |
| `AI_GATEWAY_URL` | Calls the AI Gateway for plan generation and reflection. |
| `S3_ENDPOINT` | Target for writing/reading files in swarm steps (`file_write_s3` / `file_read_s3`). |
