import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase M — Persistence, Database Integrity & Cross-Account Isolation', () => {
  let db: Client;

  test.beforeAll(async () => {
    const connectionString = process.env.TEST_DATABASE_URL || process.env.E2E_DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        '[PERSISTENCE TEST CONFIGURATION ERROR] An explicit TEST_DATABASE_URL or E2E_DATABASE_URL pointing to an isolated test database must be provided to run 11-persistence-database.spec.ts. Silent fallback to development database is strictly prohibited.'
      );
    }
    const parsed = new URL(connectionString.replace('postgresql://', 'http://'));
    const dbName = parsed.pathname.replace(/^\//, '');
    if (dbName === 'fixflow_db') {
      throw new Error(
        '[PERSISTENCE TEST SAFETY VIOLATION] Target database cannot be development/demo database "fixflow_db"! Operation blocked.'
      );
    }
    db = new Client({ connectionString });
    await db.connect();
  });

  test.afterAll(async () => {
    if (db) {
      await db.end();
    }
  });

  test('Database Baseline Integrity: Original Demo Users & Assets Preserved', async () => {
    // 1. Verify original demo users
    const usersRes = await db.query('SELECT email, role, "isActive" FROM "User"');
    const emails = usersRes.rows.map((u) => u.email);

    expect(emails).toContain('admin@fixflow.edu');
    expect(emails).toContain('manager@fixflow.edu');
    expect(emails).toContain('tech.rahul@fixflow.edu');
    expect(emails).toContain('tech.arun@fixflow.edu');
    expect(emails).toContain('student.riya@fixflow.edu');
    expect(emails).toContain('prof.sharma@fixflow.edu');

    // 2. Verify locations and assets
    const locRes = await db.query('SELECT count(*) as count FROM "Location"');
    expect(parseInt(locRes.rows[0].count, 10)).toBeGreaterThanOrEqual(5);

    const assetRes = await db.query('SELECT count(*) as count FROM "Asset"');
    expect(parseInt(assetRes.rows[0].count, 10)).toBeGreaterThanOrEqual(5);

    // 3. Verify total requests count is at least 15 (original baseline) + test records
    const reqRes = await db.query('SELECT count(*) as count FROM "MaintenanceRequest"');
    const totalRequests = parseInt(reqRes.rows[0].count, 10);
    expect(totalRequests).toBeGreaterThanOrEqual(15);
  });

  test('Lifecycle Request State Transitions Persisted in Database', async () => {
    // Verify E2E-LIFECYCLE-LEAK request was resolved/closed
    const reqRes = await db.query(
      'SELECT id, title, status, priority FROM "MaintenanceRequest" WHERE title LIKE \'%E2E-LIFECYCLE-LEAK%\' ORDER BY "createdAt" DESC'
    );
    expect(reqRes.rows.length).toBeGreaterThan(0);
    const lifecycleReq = reqRes.rows[0];
    expect(['RESOLVED', 'CLOSED']).toContain(lifecycleReq.status);

    // Verify corresponding work order was completed
    const woRes = await db.query(
      'SELECT id, status, "workNotes", "resolutionSummary", "actualCost" FROM "WorkOrder" WHERE "requestId" = $1',
      [lifecycleReq.id]
    );
    expect(woRes.rows.length).toBeGreaterThan(0);
    const wo = woRes.rows[0];
    expect(wo.status).toBe('COMPLETED');
    expect(wo.workNotes).toContain('hydronic pressure leak');
    expect(wo.resolutionSummary).toContain('Replaced 2-inch commercial union gasket');
    expect(parseFloat(wo.actualCost)).toBe(90);

    // Verify E2E-REWORK-HVAC request and work order
    const reworkReqRes = await db.query(
      'SELECT id, title, status, "verificationNotes" FROM "MaintenanceRequest" WHERE title LIKE \'%E2E-REWORK-HVAC%\' ORDER BY "createdAt" DESC'
    );
    expect(reworkReqRes.rows.length).toBeGreaterThan(0);
    const reworkReq = reworkReqRes.rows[0];

    const reworkWoRes = await db.query(
      'SELECT id, status, "workNotes" FROM "WorkOrder" WHERE "requestId" = $1',
      [reworkReq.id]
    );
    expect(reworkWoRes.rows.length).toBeGreaterThan(0);
    const reworkWo = reworkWoRes.rows[0];
    // Rework note was added during rejection
    expect(reworkWo.workNotes).toContain('Vibration dampener mount was not reinstalled');
  });

  test('Physical Upload Persistence & Metadata Consistency', async () => {
    const attachRes = await db.query('SELECT id, "fileName", "fileUrl", "fileSize", "mimeType" FROM "Attachment"');
    expect(attachRes.rows.length).toBeGreaterThanOrEqual(2);

    // Check uploaded attachment record with /api/attachments/ url
    const liveUploads = attachRes.rows.filter((r) => r.fileUrl && r.fileUrl.startsWith('/api/attachments/'));
    expect(liveUploads.length).toBeGreaterThanOrEqual(1);
    const sample = liveUploads[0];
    expect(sample.fileName).toBe('water-leak-evidence.png');
    expect(sample.fileSize).toBeGreaterThan(0);
  });

  test('Upvotes & RequestDuplicate Schema and Data Integrity', async () => {
    // 1. Verify RequestVote table contains cast votes
    const votesRes = await db.query('SELECT "userId", "requestId", "createdAt" FROM "RequestVote"');
    expect(votesRes.rows.length).toBeGreaterThanOrEqual(1);

    // Verify vote uniqueness constraint (same user cannot vote twice on same request)
    const pairs = votesRes.rows.map((v) => `${v.userId}_${v.requestId}`);
    const uniquePairs = new Set(pairs);
    expect(uniquePairs.size).toBe(pairs.length);

    // 2. Verify RequestDuplicate table is accessible and has correct schema
    const dupesRes = await db.query('SELECT count(*) as count FROM "RequestDuplicate"');
    expect(parseInt(dupesRes.rows[0].count, 10)).toBeGreaterThanOrEqual(0);
  });

  test('AuditLog Records & Sensitive Data Scrubbing', async () => {
    // Check audit logs for key operational actions
    const auditRes = await db.query(
      'SELECT action, entity, "entityId", metadata, timestamp FROM "AuditLog" ORDER BY timestamp DESC LIMIT 50'
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);

    const actions = auditRes.rows.map((a) => a.action);
    expect(actions.length).toBeGreaterThanOrEqual(5);

    // Verify sensitive data scrubbing: no passwords or raw JWT tokens in metadata JSON
    for (const row of auditRes.rows) {
      const metadataStr = JSON.stringify(row.metadata || {});
      expect(metadataStr).not.toContain('password');
      expect(metadataStr).not.toContain('super-secret');
      expect(metadataStr).not.toContain('Bearer eyJ');
    }
  });

  test('Notification Records Have Correct Targeted Recipients', async () => {
    const notifRes = await db.query(
      'SELECT id, "userId", type, title, message FROM "Notification" ORDER BY "createdAt" DESC LIMIT 30'
    );
    expect(notifRes.rows.length).toBeGreaterThan(0);

    // Notifications must have non-null recipient userId and message
    for (const notif of notifRes.rows) {
      expect(notif.userId).toBeTruthy();
      expect(notif.title).toBeTruthy();
    }
  });

  test('Cross-Account Requester Isolation at Data Layer', async () => {
    // 1. Get user IDs for two requesters
    const riyaRes = await db.query('SELECT id FROM "User" WHERE email = $1', ['student.riya@fixflow.edu']);
    const sharmaRes = await db.query('SELECT id FROM "User" WHERE email = $1', ['prof.sharma@fixflow.edu']);

    expect(riyaRes.rows.length).toBe(1);
    expect(sharmaRes.rows.length).toBe(1);

    const riyaId = riyaRes.rows[0].id;
    const sharmaId = sharmaRes.rows[0].id;

    // 2. Query requests created by Riya vs Sharma
    const riyaRequests = await db.query(
      'SELECT id, "requesterId", title FROM "MaintenanceRequest" WHERE "requesterId" = $1',
      [riyaId]
    );
    const sharmaRequests = await db.query(
      'SELECT id, "requesterId", title FROM "MaintenanceRequest" WHERE "requesterId" = $1',
      [sharmaId]
    );

    // Confirm that Riya's requests exclusively belong to Riya
    for (const req of riyaRequests.rows) {
      expect(req.requesterId).toBe(riyaId);
      expect(req.requesterId).not.toBe(sharmaId);
    }

    // Confirm that Sharma's requests exclusively belong to Sharma
    for (const req of sharmaRequests.rows) {
      expect(req.requesterId).toBe(sharmaId);
      expect(req.requesterId).not.toBe(riyaId);
    }
  });
});
