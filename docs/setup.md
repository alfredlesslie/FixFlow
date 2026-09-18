# FixFlow Local Development & Setup Guide

This guide describes how to run FixFlow locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

- **Node.js**: v18+ or v20+ / v22+
- **npm**: v9+ or v10+
- **PostgreSQL**: PostgreSQL 14+ (or run local PostgreSQL via `npm run db:start`)

---

## 2. Environment Configuration

1. Copy `.env.example` templates:
   ```powershell
   Copy-Item .env.example .env
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.example frontend\.env.local
   ```
2. Verify `DATABASE_URL` in `backend/.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fixflow_db?schema=public"
   ```

---

## 3. Database Execution & Seeding

FixFlow includes a local PostgreSQL engine so you do not even need Docker Desktop or an external installation to evaluate the platform.

### Step 3.1: Start PostgreSQL
In a dedicated terminal:
```powershell
npm run db:start
```
PostgreSQL will initialize its data cluster under `backend/.postgres-data` and listen on port `5432`.

### Step 3.2: Push Schema & Seed Initial Data
In a second terminal:
```powershell
# Sync database schema
npm run prisma:push --workspace=backend

# Seed users, locations, categories, and 15+ assets
npm run db:seed
```

---

## 4. Demo User Accounts

| Role | Email | Password | Scope / Permissions |
|---|---|---|---|
| **ADMIN** | `admin@fixflow.edu` | `Admin@123` | User & audit governance, campus config |
| **FACILITY_MANAGER** | `manager@fixflow.edu` | `Manager@123` | Asset CRUD, locations, categories, SLA triage |
| **TECHNICIAN** | `tech.rahul@fixflow.edu` | `Tech@123` | Asset inspection, work execution, status updates |
| **TECHNICIAN** | `tech.arun@fixflow.edu` | `Tech@123` | IT & Hardware equipment maintenance |
| **REQUESTER** | `student.riya@fixflow.edu` | `Student@123` | Student / Hostel resident |
| **REQUESTER** | `prof.sharma@fixflow.edu` | `Faculty@123` | Department faculty / lab in-charge |

---

## 5. Running the Application

### Option A: Running with Development Servers

#### Terminal 1: NestJS Backend
```powershell
cd backend
npm run start:dev
# Backend runs on: http://localhost:4000
# GraphQL Playground: http://localhost:4000/graphql
# Health check: http://localhost:4000/api/health
```

#### Terminal 2: Next.js Frontend
```powershell
cd frontend
npm run dev
# Frontend runs on: http://localhost:3000
```

### Option B: Running from Repository Root
```powershell
# Start Backend
npm run dev:backend

# Start Frontend (in second terminal)
npm run dev:frontend
```

---

## 6. Running Automated Tests

Run backend unit and integration test suites:
```powershell
cd backend
npm test
```
Verifies authentication, JWT validation, roles guards (RBAC), asset validation, and location/category constraints.

---

## 7. Running with Docker Compose

When Docker Desktop is installed:
```powershell
docker compose up --build
```
Spins up PostgreSQL, NestJS Backend, and Next.js Frontend in containers.
