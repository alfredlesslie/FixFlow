-- Rollback script for 20261024163000_phase_6o_votes_duplicates_storage
BEGIN;

DROP TABLE IF EXISTS "RequestDuplicate" CASCADE;
DROP TABLE IF EXISTS "RequestVote" CASCADE;
ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "storageKey";
ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "mimeType";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261024163000_phase_6o_votes_duplicates_storage';

COMMIT;
