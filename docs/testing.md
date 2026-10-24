# FixFlow Testing & Quality Assurance Guide

FixFlow maintains a rigorous multi-tier testing architecture spanning unit, integration, and browser-driven end-to-end acceptance tests.

---

## 1. Automated Test Architecture

```
                          ┌─────────────────────────────────────┐
                          │     Playwright System Acceptance    │
                          │   (11 E2E Suites / 38 Real Tests)   │
                          └──────────────────┬──────────────────┘
                                             │
                          ┌──────────────────▼──────────────────┐
                          │      Backend Unit & Integration     │
                          │    (33 Jest Suites / 273 Tests)     │
                          └──────────────────┬──────────────────┘
                                             │
                          ┌──────────────────▼──────────────────┐
                          │   Frontend Typecheck & Next Build   │
                          │    (14 / 14 Static Prerendered)     │
                          └─────────────────────────────────────┘
```

---

## 2. Backend Automated Test Suite (Jest)

The backend test suite verifies domain services, GraphQL resolvers, authentication lifecycle engines, role-based guards, and database access logic.

### Running Backend Tests

```bash
# Run the entire backend test suite
npm test --workspace=backend

# Run with verbose reporting
npm run test --workspace=backend -- --verbose

# Run a specific test suite
npm run test --workspace=backend -- src/auth/auth.service.spec.ts
```

### Coverage Highlights (33 Suites, 273 Tests)
- **Authentication & RBAC:** `auth.service.spec.ts`, `jwt.strategy.spec.ts`, `account-switching-rbac.spec.ts`, `roles.guard.spec.ts`, `rate-limit.guard.spec.ts`.
- **Account Lifecycle:** `account-lifecycle.spec.ts`, `registration.service.spec.ts`, `administrator-approvals.service.spec.ts`, `verification-token.service.spec.ts`.
- **Maintenance Operations:** `requests.service.spec.ts`, `requests.resolver.spec.ts`, `work-orders.service.spec.ts`, `workflow-integration.spec.ts`.
- **Infrastructure & Assets:** `assets.service.spec.ts`, `locations.service.spec.ts`, `attachments.controller.spec.ts`, `audit.service.spec.ts`, `environment.helper.spec.ts`.

---

## 3. Playwright System Acceptance Test Suite (E2E)

FixFlow features an end-to-end acceptance test campaign executed in real Chromium browser contexts using Playwright.

### Prerequisites for E2E Tests
1. **Frontend running** on `http://localhost:3000`
2. **Backend running** on `http://localhost:4000`
3. **Mailpit running** on `http://localhost:8025` (API) and `:1025` (SMTP)
4. **PostgreSQL connected** on port `5432`

### Running the E2E Test Suite

```bash
# Run all 11 acceptance suites sequentially
npx playwright test

# Run a specific acceptance suite
npx playwright test e2e/01-startup-health.spec.ts

# Run with interactive UI mode
npx playwright test --ui

# Inspect HTML report
npx playwright show-report
```

### Suite Directory Map (`e2e/`)

| Test Suite | Focus Area | Key Verifications |
|---|---|---|
| `01-startup-health.spec.ts` | Phase A | Health API status `ok`, GraphQL preflight, Mailpit API, landing page render |
| `02-account-switching.spec.ts` | Phase C | Rapid sequential login/logout (Requester $\to$ Tech $\to$ FM $\to$ Admin) in single session without page refresh; zero 403 race conditions |
| `03-request-creation-upload.spec.ts` | Phase D | Issue creation with multipart PNG upload; attachment rendering; cross-account visibility segregation |
| `04-upvotes-duplicates.spec.ts` | Phase E | Campus feed ticket upvoting; duplicate vote prevention idempotency; live duplicate detection banner |
| `05-staff-registration-admin-approvals.spec.ts` | Phase F | Multi-role registration; Mailpit email verification; admin approval queue; rejected user station enclosure |
| `06-maintenance-lifecycle.spec.ts` | Phase G | Complete happy path (Triage $\to$ Dispatch $\to$ Tech Execution with Parts & Evidence $\to$ FM Verification $\to$ Case Closure) & Rework Path |
| `07-manager-kpi-severity.spec.ts` | Phase H | Interactive Critical/High Severity KPI card toggle via click, Enter, and Space keys; priority override |
| `08-admin-console.spec.ts` | Phase I | User governance; account suspension/reactivation; audit explorer search & secret sanitization |
| `09-ui-control-inventory.spec.ts` | Phase B & J | Theme toggle; notification drawer; assets table filtering; asset creation modal; issue discussion comments |
| `10-rbac-negative.spec.ts` | Phase K & L | In-place 403 station shields; unauthorized GraphQL mutation rejections; bad input & malicious upload guards |
| `11-persistence-database.spec.ts` | Phase M | Read-only SQL assertions verifying demo data preservation, work order records, audit trails, and data isolation |

---

## 4. Test Data Safety & Isolation Rules

- **Development Database Safeguard:** Never execute destructive SQL, table truncations, or `prisma migrate reset` against `fixflow_db`.
- **Test User Naming:** Test identities use unique timestamp-based identifiers (`e2e-<timestamp>@fixflow.edu`).
- **Disposable Testing:** For isolated CI/CD pipelines, configure `DATABASE_URL` pointing to an isolated test database (e.g. `fixflow_e2e_test_db`).

---

## 5. Database Concurrency Testing Specifications

To verify atomic token consumption under simultaneous race conditions, FixFlow implements conditional row updates:

```sql
UPDATE "EmailVerificationToken"
SET "usedAt" = NOW()
WHERE "id" = $1
  AND "usedAt" IS NULL
  AND "expiresAt" > NOW();
```

When validating concurrency in a dedicated test container:
1. Submit two simultaneous requests without `await` interleaving via `Promise.allSettled`.
2. Assert that exactly one transaction succeeds (HTTP 200 / `emailVerified: true`) and exactly one fails (HTTP 400 / `BAD_REQUEST`).
