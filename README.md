# FixFlow — Campus Maintenance & Asset Lifecycle Management Platform

FixFlow is a centralized, production-quality web platform designed for educational institutions (universities, colleges, hostels, and campus facilities) to manage the entire lifecycle of physical infrastructure and equipment.

---

## 1. Core Value Proposition

Institutions frequently face delayed equipment repairs, opaque maintenance workflows, unrecorded asset downtime, and lack of accountability. FixFlow provides:

1. **Campus Asset Inventory**: Full lifecycle tracking of air conditioners, projectors, lab equipment, generators, pumps, and IT infrastructure.
2. **Deterministic SLAs**: Enforced resolution deadlines based on request priority (Critical: 2h, High: 6h, Medium: 24h, Low: 72h).
3. **Technician Dispatch**: Work order lifecycle, task progression, repair notes, and parts documentation.
4. **Preventive Maintenance**: Recurring schedules with upcoming, due, and overdue tracking.
5. **Auditing & Verification**: End-to-end request verification and audit logging.
6. **Role-Based Access Control (RBAC)**: Requester, Technician, Facility Manager, and Administrator.

---

## 2. Architecture & Tech Stack

FixFlow is built as a clean **Modular Monolith**:

| Component | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS | High-performance, accessible, data-focused dashboard UI |
| **API Layer** | Apollo GraphQL | Type-safe, field-level operations via queries and mutations |
| **Backend** | NestJS (Node.js & TypeScript) | Domain-driven modular architecture with guards and validation |
| **Data Access** | Prisma ORM | Strictly typed PostgreSQL schema with full foreign keys |
| **Database** | PostgreSQL 16 | Relational persistence with transactional integrity |
| **DevOps** | Docker, Docker Compose, Kubernetes | Containerization and deployment readiness |

---

## 3. Monorepo Project Structure

```
FixFlow/
├── backend/                       # NestJS Application
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL Relational Schema & Enums
│   │   └── seed.ts                # Database Seeder
│   └── src/
│       ├── common/                # Shared Guards, Decorators, SLA Engine
│       ├── auth/                  # JWT Authentication & RBAC Guards
│       ├── users/                 # User management & roles
│       ├── locations/             # Campus buildings, floors, rooms
│       ├── asset-categories/      # Asset classification
│       ├── assets/                # Asset lifecycle, condition, status, QR ID
│       ├── maintenance-requests/  # Request workflow & deterministic SLA engine
│       ├── work-orders/           # Technician assignments & repair logs
│       ├── preventive-maintenance/# Preventive recurring schedules
│       ├── analytics/             # Operational KPIs & metrics
│       ├── audit/                 # System audit logs
│       ├── notifications/         # In-app notifications
│       └── health/                # System health check query & controller
├── frontend/                      # Next.js Application
│   └── src/
│       ├── app/                   # App Router pages (/login, /dashboard, /requests, /assets, ...)
│       ├── components/            # Reusable UI components (Modals, Badges, Tables, Forms)
│       └── lib/                   # Apollo Client, auth context, SLA calculations
├── infrastructure/                # Docker & deployment manifests
├── docs/                          # Architecture, database, API, setup guides
├── docker-compose.yml             # Unified Docker compose
├── .env.example                   # Master environment template
└── package.json                   # Root monorepo workspace
```

---

## 4. Quickstart & Local Setup

### Prerequisites
- Node.js `v18+` or `v20+` / `v22+`
- npm `v9+` or `v10+`
- PostgreSQL instance (or Docker)

### Installation
```powershell
# 1. Clone & install dependencies
npm install

# 2. Configure environment variables
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local

# 3. Generate Prisma client
npm run db:generate
```

### Running Backend (NestJS)
```powershell
npm run dev:backend
# API running at: http://localhost:4000
# GraphQL Playground: http://localhost:4000/graphql
# Health check: http://localhost:4000/api/health
```

### Running Frontend (Next.js)
```powershell
npm run dev:frontend
# UI running at: http://localhost:3000
```

### Running with Docker Compose
```powershell
docker compose up --build
```

---

## 5. GraphQL Verification

Open `http://localhost:4000/graphql` in your browser and execute:

```graphql
query HealthCheck {
  healthCheck {
    status
    service
    environment
    uptime
    timestamp
    database
  }
}
```

---

## 6. Development Roadmap

- [x] **Phase 1 — Foundation**: Monorepo scaffolding, NestJS backend, GraphQL health endpoint, Prisma schema with 12 entities, Next.js frontend with Apollo Client, and Docker manifests.
- [ ] **Phase 2 — Authentication & RBAC**: JWT login, password hashing, roles guards, and session context.
- [ ] **Phase 3 — Core Asset System**: Asset CRUD, locations, categories, lifecycle state machine.
- [ ] **Phase 4 — Maintenance Requests & Work Orders**: SLA engine, ticket lifecycle, and technician assignments.
- [ ] **Phase 5 — Preventive Maintenance**: Schedules, due/overdue calculation, and historical records.
- [ ] **Phase 6 — Dashboards & Analytics**: Requester, Technician, Manager, and Admin dashboards.
- [ ] **Phase 7 — Enhancements**: QR codes, in-app notifications, and audit logging.
- [ ] **Phase 8 — DevOps**: GitHub Actions CI/CD, Kubernetes manifests, and monitoring.

---

## 7. License

Academic project developed for University Web Technologies evaluation.
