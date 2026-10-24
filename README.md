# FixFlow — Campus Maintenance & Asset Lifecycle Management Platform

FixFlow is a comprehensive, production-grade web platform engineered for higher-education campuses and institutions (universities, colleges, residential hostels, and research facilities) to streamline facilities maintenance, track equipment lifecycles, and enforce deterministic service-level agreements (SLAs).

---

## 1. Key Features & Capabilities

- **Campus Asset Inventory:** Complete lifecycle management for HVAC, electrical, laboratory, and IT equipment across campus buildings, floors, and rooms.
- **Deterministic SLA Engine:** Automated priority scoring and SLA deadline calculation (Critical: 2h, High: 6h, Medium: 24h, Low: 72h).
- **Technician Dispatch & Workbench:** Step-by-step repair state progression, parts and consumables logging, before/after evidence photos, and shift notes.
- **Facility Manager Command Center:** Interactive Triage Queue, Verification Studio, Critical/High Severity filtering, priority overrides, and technician dispatch.
- **Campus Issue Discovery & Upvoting:** Feed discovery, upvoting with duplicate prevention idempotency, and live duplicate suggestion banner.
- **Staff Governance & Verification:** Self-service registration with institutional email verification (Mailpit SMTP) and administrator review queue.
- **Role-Based Access Control (RBAC):** Station isolation across Requester, Technician, Facility Manager, and Administrator roles with automatic Apollo cache isolation.
- **Immutable Audit Logging:** Operational audit trail tracking key actions with automatic sensitive credential scrubbing.

---

## 2. Architecture & Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS | High-performance dashboard UI with Apollo Client integration |
| **API Layer** | Apollo GraphQL & Apollo Server 4 | Type-safe queries, mutations, and field-level resolvers |
| **Backend** | NestJS 10, TypeScript | Domain-driven modular architecture with guards, interceptors, and DTOs |
| **Data Access** | Prisma ORM 5 | Type-safe query builder, relation modeling, and migration engine |
| **Database** | PostgreSQL 16+ | ACID-compliant relational storage with transactional integrity |
| **Email Testing** | Mailpit | Local SMTP server (`:1025`) and HTTP inspection API (`:8025`) |
| **Testing** | Playwright (E2E), Jest (Unit/Integration) | 11 browser acceptance suites + 33 backend suites (273 tests) |
| **Containerization** | Docker, Docker Compose | Multi-container setup with network bridging and volume mounts |

---

## 3. Quickstart & Local Setup

### Prerequisites
- **Node.js:** v20+ or v22 LTS
- **Docker Desktop:** 4.x (running Linux containers)
- **PostgreSQL:** PostgreSQL 16+ (e.g. running on port `5432`)
- **Package Manager:** npm 10+ (workspace-aware)

---

### Step 1: Environment Configuration
Copy [.env.example](file:///c:/projects/FixFlow/.env.example) to `.env`:
```powershell
cp .env.example .env
```
Configure your local database password and secrets in `.env`:
```env
DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@localhost:5432/fixflow_db?schema=public"
DOCKER_DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@host.docker.internal:5432/fixflow_db?schema=public"
JWT_SECRET="<YOUR_STRONG_RANDOM_SECRET_AT_LEAST_32_CHARS>"
```
*(Never commit `.env` containing real credentials to source control).*

---

### Step 2: Apply Database Migrations
Apply the migration chain (`0_init`, `20261014184500_account_lifecycle_and_location`, `20261024163000_phase_6o_votes_duplicates_storage`):
```powershell
npx.cmd --workspace=backend prisma migrate deploy
```

---

### Step 3: Run the Application

#### Option A: Docker Compose (Recommended)
Launch backend, frontend, and Mailpit services:
```powershell
docker compose up -d backend frontend mailpit
```
- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000`
- **GraphQL Endpoint:** `http://localhost:4000/graphql`
- **Health Check:** `http://localhost:4000/api/health`
- **Mailpit Email UI:** `http://localhost:8025`

#### Option B: Local Node.js Development
```powershell
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

---

### Step 4: Provision Administrator & Reset Demo Accounts
To provision the initial administrator account via secure CLI prompt:
```powershell
npm run bootstrap:admin
```
To reset local demo passwords safely without mutating application records:
```powershell
npm run reset:demo-passwords
```

---

## 4. Automated Testing

FixFlow includes two comprehensive automated testing layers:

```powershell
# Run backend unit and integration test suite (33 suites, 273 tests)
npm test --workspace=backend

# Run frontend type-checking and production build
npm run build --workspace=frontend

# Run full browser end-to-end acceptance suite (11 suites, 38 tests)
npx.cmd playwright test
```

For detailed testing guidelines, refer to [docs/testing.md](file:///c:/projects/FixFlow/docs/testing.md).

---

## 5. Comprehensive Documentation

Detailed technical documentation is available in the [docs/](file:///c:/projects/FixFlow/docs/) directory:

- [Architecture & Domain Model](file:///c:/projects/FixFlow/docs/architecture.md): System architecture, RBAC rules, state machines, and lifecycle diagrams.
- [Setup & Development Guide](file:///c:/projects/FixFlow/docs/setup.md): Environment requirements, Docker workflows, and database procedures.
- [Database & Schema Guide](file:///c:/projects/FixFlow/docs/database.md): Prisma models, relational schema, indexes, and migration strategy.
- [GraphQL API Specification](file:///c:/projects/FixFlow/docs/graphql.md): Complete schema documentation, queries, mutations, and error handling.
- [Testing & Quality Assurance Guide](file:///c:/projects/FixFlow/docs/testing.md): Unit test matrix, Playwright E2E suites, and test data safety.
- [Production Deployment Guide](file:///c:/projects/FixFlow/docs/deployment.md): Reverse proxy trust (`TRUST_PROXY`), rate limiting, scaling, and security headers.

---

## 6. License & Academic Attribution

Developed as a Web Technologies Capstone Project. Educational and institutional use permitted.
