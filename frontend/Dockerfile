FROM node:20-alpine AS builder
WORKDIR /app

# Add build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL

# Set environment variables
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install necessary build tools
RUN apk add --no-cache libc6-compat

# Copy everything to build properly, path resolution issues require complete codebase
COPY . .

# Install all dependencies (including dev dependencies)
RUN npm install

# Verify autoprefixer is installed
RUN npm list autoprefixer

# Build the Next.js application
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

# Add user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set the correct permission for the /app directory
RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Copy necessary files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
