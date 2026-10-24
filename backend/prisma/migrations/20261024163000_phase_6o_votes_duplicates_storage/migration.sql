-- FixFlow Phase 6O: Dedicated Relational Upvotes, Duplicate Request Links, and Storage Metadata
-- Wrapped in a transaction to ensure atomic application or rollback on failure.

BEGIN;

-- 1. Create RequestVote table with database-level uniqueness on (requestId, userId)
CREATE TABLE "RequestVote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RequestVote_requestId_userId_key" ON "RequestVote"("requestId", "userId");
CREATE INDEX "RequestVote_requestId_idx" ON "RequestVote"("requestId");
CREATE INDEX "RequestVote_userId_idx" ON "RequestVote"("userId");

ALTER TABLE "RequestVote" 
    ADD CONSTRAINT "RequestVote_requestId_fkey" 
    FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequestVote" 
    ADD CONSTRAINT "RequestVote_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Create RequestDuplicate table
CREATE TABLE "RequestDuplicate" (
    "id" TEXT NOT NULL,
    "originalRequestId" TEXT NOT NULL,
    "duplicateRequestId" TEXT NOT NULL,
    "markedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestDuplicate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RequestDuplicate_duplicateRequestId_key" ON "RequestDuplicate"("duplicateRequestId");
CREATE INDEX "RequestDuplicate_originalRequestId_idx" ON "RequestDuplicate"("originalRequestId");
CREATE INDEX "RequestDuplicate_duplicateRequestId_idx" ON "RequestDuplicate"("duplicateRequestId");
CREATE INDEX "RequestDuplicate_markedById_idx" ON "RequestDuplicate"("markedById");

ALTER TABLE "RequestDuplicate" 
    ADD CONSTRAINT "RequestDuplicate_originalRequestId_fkey" 
    FOREIGN KEY ("originalRequestId") REFERENCES "MaintenanceRequest"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequestDuplicate" 
    ADD CONSTRAINT "RequestDuplicate_duplicateRequestId_fkey" 
    FOREIGN KEY ("duplicateRequestId") REFERENCES "MaintenanceRequest"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RequestDuplicate" 
    ADD CONSTRAINT "RequestDuplicate_markedById_fkey" 
    FOREIGN KEY ("markedById") REFERENCES "User"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Enhance Attachment table with storageKey and mimeType
ALTER TABLE "Attachment" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "Attachment" ADD COLUMN "mimeType" TEXT;

-- 4. Backfill existing upvotes from AuditLog if any exist
INSERT INTO "RequestVote" ("id", "requestId", "userId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    al."entityId",
    al."actorId",
    al."timestamp"
FROM "AuditLog" al
WHERE al."action" = 'REQUEST_UPVOTED'
  AND al."entity" = 'MAINTENANCE_REQUEST'
  AND al."actorId" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "MaintenanceRequest" mr WHERE mr."id" = al."entityId")
  AND EXISTS (SELECT 1 FROM "User" u WHERE u."id" = al."actorId")
ON CONFLICT ("requestId", "userId") DO NOTHING;

COMMIT;
