# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for NEXT_PUBLIC_* vars (baked into client bundle at build time)
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_TURNSTILE_DEBUG=false
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEBUG_LEVEL=none

ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_DEBUG=$NEXT_PUBLIC_TURNSTILE_DEBUG
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_DEBUG_LEVEL=$NEXT_PUBLIC_DEBUG_LEVEL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
# tesseract.js is a serverExternalPackage — it must be present in node_modules
# at runtime so its Node.js worker can load correctly
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tesseract.js ./node_modules/tesseract.js
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tesseract.js-core ./node_modules/tesseract.js-core
# Pre-download Tesseract.js language data at build time so the first OCR
# request doesn't stall on the CDN. Files are stored in /app/tessdata and
# the worker is told to use this path via TESSDATA_CACHE (read in ocr-engine.ts).
RUN mkdir -p /app/tessdata && \
    wget -q -O /app/tessdata/eng.traineddata.gz \
      https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz && \
    chown -R nextjs:nodejs /app/tessdata
ENV TESSDATA_CACHE=/app/tessdata
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
