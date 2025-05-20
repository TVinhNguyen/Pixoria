FROM node:18-alpine AS builder
WORKDIR /app

# Add build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL

# Set environment variables
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NODE_ENV=production

# Copy package files and install dependencies
COPY package.json package-lock.json ./
# Install both production and development dependencies for build stage
RUN npm ci --include=dev

# Copy configuration files first (for better caching)
COPY tailwind.config.ts tsconfig.json next.config.mjs ./
COPY components.json ./
COPY postcss.config.js ./

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Keep NODE_ENV consistent between build and runtime
ENV NODE_ENV=production

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy config files needed for runtime
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["npm", "run", "start"]