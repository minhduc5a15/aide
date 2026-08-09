FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate prisma client before building
RUN npx prisma generate

# Next.js telemetry is disabled
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install git since it is required by GitService
RUN apk add --no-cache git

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Note: We run prisma migrate deploy here so that the DB is ready before the server starts
# Since the container runs as nextjs user, we just start the node server. We will do DB migration via a shell wrapper or docker-compose entrypoint.
# For simplicity, we can do it in the command. But `prisma` requires `npx` which requires full node_modules if we use Prisma CLI.
# The standalone output does not contain `npx prisma`. 
# To handle migrations gracefully without adding full node_modules to runner:
# We can include `npx prisma migrate deploy` in docker-compose.yml as a separate init container, or we use `package.json` in runner.
# Let's just start the server here and handle migration via docker-compose.
CMD ["node", "server.js"]
