# FixFlow Production Readiness & Deployment Guide

This guide details configuration, security safeguards, and infrastructure requirements for deploying FixFlow to production environments.

---

## 1. Architecture & Services

FixFlow consists of three primary services:
1. **Frontend:** Next.js 14 App Router, standalone Node.js server or container, port `3000`.
2. **Backend:** NestJS 10 GraphQL / REST API server, port `4000`.
3. **Database:** PostgreSQL 16+ with Prisma ORM connection pool, default port `5432`.
4. **Email Testing (Local):** Mailpit on ports `8025` (Web UI) and `1025` (SMTP). In production, configure an authenticated SMTP provider.

---

## 2. Environment Configuration

Copy [.env.example](file:///c:/projects/FixFlow/.env.example) to `.env` and configure production secrets.

### Required Production Environment Variables

| Variable | Description | Security Requirements |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Use TLS/SSL (`?sslmode=require`), connection pooling parameters |
| `JWT_SECRET` | Secret key for signing authentication tokens | Must be a random cryptographically secure string $\ge 32$ chars |
| `JWT_EXPIRES_IN` | Token validity duration | Recommended: `7d` or `1d` with refresh token strategy |
| `PORT` | Backend listening port | Default `4000` |
| `NODE_ENV` | Runtime environment | Set to `production` |
| `CORS_ORIGIN` | Allowed web origin for CORS | Restrict to authoritative domain (e.g. `https://fixflow.edu`) |
| `FRONTEND_URL` | Public frontend URL for verification links | e.g. `https://fixflow.edu` |
| `TRUST_PROXY` | Reverse proxy trust setting | See Section 3 below |
| `SMTP_HOST` | Production SMTP relay host | e.g. `smtp.brevo.com` or `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP authentication username | Inject via secret manager |
| `SMTP_PASS` | SMTP authentication password | Inject via secret manager |
| `SMTP_FROM` | Outgoing sender address | Verified institutional domain (e.g. `noreply@fixflow.edu`) |

---

## 3. Reverse-Proxy Trust & Client IP Resolution

FixFlow defends authentication endpoints against brute-force attacks using `RateLimitGuard`. Client IP addresses are resolved via Express `req.ip`.

Configure the `TRUST_PROXY` variable based on your hosting topology:

| Deployment Topology | `TRUST_PROXY` Setting | Behavior |
|---|---|---|
| **Direct Access / Local Dev** | `"false"` or omitted | Direct TCP socket IP is used. Client-supplied `X-Forwarded-For` headers are strictly ignored (fails closed). |
| **Single Edge Reverse Proxy** (AWS ALB, Cloudflare, NGINX) | `"1"` | Trusts the first upstream proxy hop. |
| **Multi-Tier Proxies** | `"<count>"` | Trusts *N* upstream hops. |
| **Private Subnet / VPC Range** | `"loopback, 10.0.0.0/8"` | Trusts upstream proxies within matching CIDR ranges. |

---

## 4. Production Security Hardening

### 4.1 GraphQL Error Masking
In `NODE_ENV=production`, internal database errors, file system paths, and stack traces are masked into generic messages (`"An internal server error occurred"`). Only sanitized validation errors and explicit domain exceptions are forwarded.

### 4.2 Introspection & Playground
GraphQL Playground and schema introspection are automatically disabled when `NODE_ENV=production` to prevent unauthenticated schema harvesting.

### 4.3 HTTP Security Headers
The backend automatically injects security headers on all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Powered-By` header is disabled.

---

## 5. Storage Pipeline & Uploads

By default, attachments are stored on local persistent disk (`ATTACHMENTS_STORAGE_DRIVER=local` at `/app/backend/uploads/attachments`).

For horizontal multi-replica deployments:
- Mount a persistent shared volume across instances, or
- Implement an S3-compatible cloud object store driver (AWS S3 / Cloudflare R2).

---

## 6. Horizontal Scaling Considerations

`RateLimitGuard` uses an in-memory hit store isolated to the local Node.js process replica. In multi-pod or Kubernetes deployments with $>1$ replica, configure a centralized Redis cache for throttler persistence across pods.

---

## 7. Migration & Deployment Sequence

1. **Deploy Migrations:** Run `npx prisma migrate deploy` in the backend build stage.
2. **Seed Initial Admin:** Execute `npm run bootstrap:admin` via secure CLI prompt if provisioning a new instance.
3. **Health Check:** Probe `/api/health` to confirm database connectivity before enabling traffic.
