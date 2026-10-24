FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo manifests for workspace-aware installation
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Reproducible install for frontend dependencies
RUN npm ci --workspace=frontend

# Copy frontend source code and configs
COPY frontend/ ./frontend/

# Build Next.js application
ENV NODE_ENV=production
RUN npm run build --workspace=frontend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy manifests and install production dependencies only
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=frontend --omit=dev && npm cache clean --force

# Copy Next.js build outputs
COPY --chown=node:node --from=builder /app/frontend/.next ./frontend/.next
COPY --chown=node:node --from=builder /app/frontend/package.json ./frontend/package.json
COPY --chown=node:node frontend/public ./frontend/public

# Set ownership to node user
RUN chown -R node:node /app

USER node

WORKDIR /app/frontend

EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
