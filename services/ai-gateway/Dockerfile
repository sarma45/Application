FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat python3 make g++

FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile || pnpm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && npx tsc --noEmit || true
RUN npx esbuild src/server.ts --bundle --platform=node --target=node22 --outdir=dist --external:./node_modules/*

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER nodejs
EXPOSE 4001
ENV PORT=4001
CMD ["node", "dist/server.js"]
