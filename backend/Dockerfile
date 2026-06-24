# Luigi Games — Medusa backend (monorepo)
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat wget

FROM base AS deps
COPY package.json package-lock.json turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/
RUN npm ci --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/backend
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app/apps/backend

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend /app/apps/backend
COPY --from=builder /app/package.json /app/package.json

EXPOSE 9000
ENV PORT=9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

CMD ["npm", "run", "start"]
