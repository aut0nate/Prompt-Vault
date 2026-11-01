FROM node:22-alpine AS base
WORKDIR /app
RUN apk upgrade --no-cache \
  && apk add --no-cache ca-certificates openssl sqlite su-exec

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci

FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci --omit=dev \
  && npx prisma generate \
  && npm cache clean --force

FROM base AS builder
WORKDIR /app
ARG DATABASE_URL="file:/app/data/dev.db"
ENV DATABASE_URL=${DATABASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/data
RUN mkdir -p public
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
EXPOSE 3000
CMD ["sh", "-c", "mkdir -p /app/data /app/data/prompt-attachments && chown -R nextjs:nodejs /app/data && exec su-exec nextjs sh -c 'node scripts/db-push.mjs && exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000'"]
