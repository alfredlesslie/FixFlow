FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy monorepo manifests for workspace-aware installation
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Reproducible install for backend dependencies
RUN npm ci --workspace=backend

# Copy backend prisma schema & generate Prisma Client
COPY backend/prisma ./backend/prisma
RUN npx --workspace=backend prisma generate

# Copy backend source and config
COPY backend/nest-cli.json backend/tsconfig*.json ./backend/
COPY backend/src ./backend/src
COPY backend/assets ./backend/assets

# Build NestJS backend
RUN npm run build --workspace=backend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

# Copy manifests and install production dependencies only
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=backend --omit=dev && npm cache clean --force

# Copy generated Prisma Client and compiled artifacts from builder
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --chown=node:node --from=builder /app/backend/dist ./backend/dist
COPY --chown=node:node --from=builder /app/backend/prisma ./backend/prisma
COPY --chown=node:node backend/assets ./backend/assets

# Create uploads directory and set ownership to node user
RUN mkdir -p /app/backend/uploads/attachments && chown -R node:node /app

USER node

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "dist/main"]
