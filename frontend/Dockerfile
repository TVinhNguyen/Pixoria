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

# Install dependencies with specific approach to fix autoprefixer issue
RUN npm install -g npm@latest
RUN npm cache clean --force
RUN npm install --legacy-peer-deps
RUN npm i -g autoprefixer postcss tailwindcss
RUN npm i autoprefixer postcss tailwindcss --save-dev
RUN npm ls autoprefixer || true

# Create empty postcss.config.js file to ensure it's available
RUN echo "module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };" > postcss.config.js

# Build the Next.js application with NODE_OPTIONS for more memory
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

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
COPY --from=builder --chown=nextjs:nodejs /app/postcss.config.js ./postcss.config.js

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
