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
| **Database** | PostgreSQL 16 / 18 | Relational persistence with transactional integrity |
| **DevOps** | Docker, Docker Compose, Kubernetes | Containerization and deployment readiness |

---

## 3. Quickstart & Local Setup

### Step 1: Start Local PostgreSQL Database
FixFlow bundles an embedded PostgreSQL engine for zero-config local evaluation:
```powershell
npm run db:start
```
PostgreSQL will run on `postgresql://postgres:postgres@localhost:5432/fixflow_db`.

### Step 2: Push Database Schema & Seed Data
In a second terminal:
```powershell
# Push Prisma schema to PostgreSQL
npm run prisma:push --workspace=backend

# Seed users, locations, categories, and 15+ assets
npm run db:seed
```

### Step 3: Run Backend (NestJS)
```powershell
npm run dev:backend
# API running at: http://localhost:4000
# GraphQL Playground: http://localhost:4000/graphql
# Health check: http://localhost:4000/api/health
```

### Step 4: Run Frontend (Next.js)
```powershell
npm run dev:frontend
# UI running at: http://localhost:3000
```

---

## 4. Demo Accounts & Credentials

| Role | Email | Password | Pre-fill Available |
|---|---|---|---|
| **Facility Manager** | `manager@fixflow.edu` | `Manager@123` | Yes (`/login`) |
| **Technician** | `tech.rahul@fixflow.edu` | `Tech@123` | Yes (`/login`) |
| **Requester (Student)** | `student.riya@fixflow.edu` | `Student@123` | Yes (`/login`) |
| **Administrator** | `admin@fixflow.edu` | `Admin@123` | Yes (`/login`) |

---

## 5. Running Automated Tests

Run backend unit and integration tests:
```powershell
cd backend
npm test
```
All 5 test suites (22 tests) cover authentication, JWT issuance, roles guard, asset CRUD validation, and location/category constraints.

---

## 6. Development Roadmap

- [x] **Phase 1 — Foundation**: Monorepo scaffolding, NestJS backend, GraphQL health endpoint, Prisma schema with 12 entities, Next.js frontend with Apollo Client, and Docker manifests.
- [x] **Phase 2 — Core Backend, Auth & Asset Management**: PostgreSQL setup, Prisma migration & seeding, JWT authentication (`login`, `me`), RBAC (`@Roles(...)`, `RolesGuard`), User management, Campus Locations CRUD, Asset Categories CRUD, Campus Asset Registry with search & multi-filtering, audit logging, and automated Jest tests.
- [ ] **Phase 3 — Maintenance Requests & Work Orders**: Strict state machine (OPEN -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> VERIFIED -> CLOSED), SLA calculation engine, technician assignment, and repair execution.
- [ ] **Phase 4 — Preventive Maintenance & History**: Maintenance schedules, upcoming/due/overdue status engine, and asset maintenance history records.
- [ ] **Phase 5 — Role Dashboards & Analytics**: Requester, Technician, Facility Manager, and Admin dashboards with SLA compliance and failure analytics.
- [ ] **Phase 6 — Enhancements & University Submission**: QR code routes (`/assets/[id]`), in-app notifications, Docker Compose verification, Kubernetes manifests, and academic documentation.

---

## 7. License

Academic project developed for University Web Technologies evaluation.
