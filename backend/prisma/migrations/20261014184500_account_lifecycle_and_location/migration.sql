-- FixFlow Phase 6C.2/6C.3: Incremental Migration
-- Account Lifecycle, Registration Application, Verification Tokens, Mandatory Request Location, Optional Asset, and Work Order Handover
-- Wrapped in a transaction to ensure atomic application or rollback on failure.

BEGIN;

-- 1. Create Enums
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_VERIFICATION', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- 2. Alter User Table (Account Lifecycle & Token Versioning)
ALTER TABLE "User" 
    ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
    ADD COLUMN "institutionalId" TEXT;

CREATE INDEX "User_status_idx" ON "User"("status");

-- 3. Data Migration: Preserve Administrative Recovery Without Falsifying Email Verification
-- Existing active administrators are transitioned to status = 'ACTIVE' to preserve administrative access and recovery.
-- IMPORTANT: emailVerified remains false and emailVerifiedAt remains NULL because active status does NOT prove email ownership.
-- Legacy administrators must verify their institutional email or use an authorized bootstrap recovery process.
-- Non-admin accounts remain at their default PENDING_VERIFICATION to prevent silent unauthorized access.
UPDATE "User"
SET "status" = 'ACTIVE'
WHERE "role" = 'ADMIN'
  AND "isActive" = true;

-- 4. Alter MaintenanceRequest (Mandatory Location & Optional Asset)
-- Step 4a: Add locationId as nullable initially and drop NOT NULL from assetId
ALTER TABLE "MaintenanceRequest" 
    ADD COLUMN "locationId" TEXT,
    ALTER COLUMN "assetId" DROP NOT NULL;

-- Step 4b: Data Backfill - Map locationId from existing associated Asset
UPDATE "MaintenanceRequest" mr
SET "locationId" = a."locationId"
FROM "Asset" a
WHERE mr."assetId" = a."id"
  AND mr."locationId" IS NULL;

-- Step 4c: Guarded NOT NULL enforcement
-- Stops and rolls back the entire transaction if any MaintenanceRequest cannot be safely mapped to a location.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "MaintenanceRequest" WHERE "locationId" IS NULL) THEN
    RAISE EXCEPTION 'Safety constraint violation: Unmapped MaintenanceRequest records exist with NULL locationId. Aborting migration before enforcing NOT NULL.';
  ELSE
    ALTER TABLE "MaintenanceRequest" ALTER COLUMN "locationId" SET NOT NULL;
  END IF;
END $$;

-- Step 4d: Foreign Key and Index for MaintenanceRequest.locationId
CREATE INDEX "MaintenanceRequest_locationId_idx" ON "MaintenanceRequest"("locationId");
ALTER TABLE "MaintenanceRequest" 
    ADD CONSTRAINT "MaintenanceRequest_locationId_fkey" 
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 4e: Update MaintenanceRequest.assetId Foreign Key to ON DELETE SET NULL
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT "MaintenanceRequest_assetId_fkey";
ALTER TABLE "MaintenanceRequest" 
    ADD CONSTRAINT "MaintenanceRequest_assetId_fkey" 
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Alter WorkOrder (Optional Asset Association)
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_assetId_fkey";
ALTER TABLE "WorkOrder" ALTER COLUMN "assetId" DROP NOT NULL;
ALTER TABLE "WorkOrder" 
    ADD CONSTRAINT "WorkOrder_assetId_fkey" 
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Create RegistrationApplication Table
CREATE TABLE "RegistrationApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "institutionalId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "requestedRole" "Role" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "tradeDiscipline" TEXT,
    "certificationNumber" TEXT,
    "yearsExperience" TEXT,
    "facilityScope" TEXT,
    "appointmentJustification" TEXT,
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationApplication_status_idx" ON "RegistrationApplication"("status");
CREATE INDEX "RegistrationApplication_applicantEmail_idx" ON "RegistrationApplication"("applicantEmail");
CREATE INDEX "RegistrationApplication_requestedRole_idx" ON "RegistrationApplication"("requestedRole");
CREATE INDEX "RegistrationApplication_submittedAt_idx" ON "RegistrationApplication"("submittedAt");
CREATE INDEX "RegistrationApplication_userId_idx" ON "RegistrationApplication"("userId");
CREATE INDEX "RegistrationApplication_reviewedById_idx" ON "RegistrationApplication"("reviewedById");

ALTER TABLE "RegistrationApplication" 
    ADD CONSTRAINT "RegistrationApplication_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RegistrationApplication" 
    ADD CONSTRAINT "RegistrationApplication_reviewedById_fkey" 
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Create EmailVerificationToken Table
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");
CREATE INDEX "EmailVerificationToken_tokenHash_idx" ON "EmailVerificationToken"("tokenHash");

ALTER TABLE "EmailVerificationToken" 
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Create WorkOrderHandover Table
CREATE TABLE "WorkOrderHandover" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "previousTechId" TEXT,
    "nextTechId" TEXT NOT NULL,
    "handoverNotes" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderHandover_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkOrderHandover_workOrderId_idx" ON "WorkOrderHandover"("workOrderId");
CREATE INDEX "WorkOrderHandover_previousTechId_idx" ON "WorkOrderHandover"("previousTechId");
CREATE INDEX "WorkOrderHandover_nextTechId_idx" ON "WorkOrderHandover"("nextTechId");
CREATE INDEX "WorkOrderHandover_createdAt_idx" ON "WorkOrderHandover"("createdAt");

ALTER TABLE "WorkOrderHandover" 
    ADD CONSTRAINT "WorkOrderHandover_workOrderId_fkey" 
    FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkOrderHandover" 
    ADD CONSTRAINT "WorkOrderHandover_previousTechId_fkey" 
    FOREIGN KEY ("previousTechId") REFERENCES "User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkOrderHandover" 
    ADD CONSTRAINT "WorkOrderHandover_nextTechId_fkey" 
    FOREIGN KEY ("nextTechId") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
