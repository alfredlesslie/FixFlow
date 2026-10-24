/**
 * FixFlow — Safe Local Demo Account Password Reset CLI
 *
 * Requirements & Safety Guarantees:
 * - Local development only (strictly blocked if NODE_ENV === 'production').
 * - Verifies target database host is localhost/127.0.0.1 and database name is 'fixflow_db'.
 * - Never drops or truncates tables, alters schema, or deletes records.
 * - Only modifies explicitly declared demo accounts.
 * - Never modifies the initial administrator account (admin@fixflow.edu) unless --include-admin is passed.
 * - Uses bcrypt (cost factor 10) matching the application's authentication implementation.
 * - Verifies every new password hash against bcrypt.compare before reporting success.
 * - Invalidates active user sessions by incrementing tokenVersion.
 * - Creates an immutable audit log entry for each password reset event.
 * - Kept strictly outside the NestJS production build (scripts/ directory is not compiled into dist/).
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Load environment variables if not present in process.env
function loadEnv() {
  if (process.env.DATABASE_URL) return;

  const envFiles = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];

  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

// Target demo account definitions
const EXPECTED_DEMO_ACCOUNTS = [
  {
    email: 'manager@fixflow.edu',
    expectedRole: 'FACILITY_MANAGER',
    defaultPassword: process.env.DEMO_MANAGER_PASSWORD || process.env.DEMO_PASSWORD || 'Manager@123',
    label: 'Facility Manager',
  },
  {
    email: 'tech.rahul@fixflow.edu',
    expectedRole: 'TECHNICIAN',
    defaultPassword: process.env.DEMO_TECH_PASSWORD || process.env.DEMO_PASSWORD || 'Tech@123',
    label: 'Technician (Rahul)',
  },
  {
    email: 'tech.arun@fixflow.edu',
    expectedRole: 'TECHNICIAN',
    defaultPassword: process.env.DEMO_TECH_PASSWORD || process.env.DEMO_PASSWORD || 'Tech@123',
    label: 'Technician (Arun)',
  },
  {
    email: 'student.riya@fixflow.edu',
    expectedRole: 'REQUESTER',
    defaultPassword: process.env.DEMO_STUDENT_PASSWORD || process.env.DEMO_PASSWORD || 'Student@123',
    label: 'Requester (Student Riya)',
  },
  {
    email: 'prof.sharma@fixflow.edu',
    expectedRole: 'REQUESTER',
    defaultPassword: process.env.DEMO_FACULTY_PASSWORD || process.env.DEMO_STUDENT_PASSWORD || process.env.DEMO_PASSWORD || 'Student@123',
    label: 'Requester (Prof. Sharma)',
  },
];

const ADMIN_ACCOUNT = {
  email: 'admin@fixflow.edu',
  expectedRole: 'ADMIN',
  defaultPassword: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123',
  label: 'Initial Administrator',
};

async function main() {
  console.log('====================================================');
  console.log('FixFlow — Local Demo Password Reset CLI');
  console.log('====================================================\n');

  // Guard 1: Block execution in production
  if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY ERROR] This utility is strictly restricted to local development environments.');
    process.exit(1);
  }

  // Guard 2: Verify target database is local fixflow_db
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    console.error('[CONFIG ERROR] DATABASE_URL is not set.');
    process.exit(1);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(dbUrl);
  } catch (err) {
    console.error('[CONFIG ERROR] Malformed DATABASE_URL:', err.message);
    process.exit(1);
  }

  const hostname = parsedUrl.hostname;
  const dbName = parsedUrl.pathname.replace(/^\//, '');

  console.log(`[TARGET DATABASE] Host: ${hostname}:${parsedUrl.port || '5432'} | Database: ${dbName}`);

  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'host.docker.internal';
  if (!isLocalHost || dbName !== 'fixflow_db') {
    console.error(`[SAFETY GUARD TRIGGERED] Database "${dbName}" on "${hostname}" is not the local development fixflow_db.`);
    console.error('Password reset aborted for security.');
    process.exit(1);
  }

  const isDryRun = process.argv.includes('--dry-run');
  const includeAdmin = process.argv.includes('--include-admin');

  if (isDryRun) {
    console.log('[MODE] DRY-RUN ONLY — No changes will be persisted.\n');
  }

  const targetAccounts = [...EXPECTED_DEMO_ACCOUNTS];
  if (includeAdmin) {
    targetAccounts.unshift(ADMIN_ACCOUNT);
    console.log('[NOTICE] --include-admin flag detected: Administrator account will be included in reset.');
  } else {
    console.log('[NOTICE] Initial administrator (admin@fixflow.edu) is PRESERVED unchanged.');
    console.log('         (Pass --include-admin if administrator password reset is explicitly needed.)\n');
  }

  const emails = targetAccounts.map((a) => a.email);

  // Fetch target accounts
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: emails } },
  });

  // Guard 3: Validate that every expected account exists and has the expected role
  console.log('--- Account Verification ---');
  let hasRoleMismatch = false;

  for (const def of targetAccounts) {
    const user = existingUsers.find((u) => u.email === def.email);
    if (!user) {
      console.error(`[MISSING ACCOUNT] Expected demo account "${def.email}" was not found in the database.`);
      hasRoleMismatch = true;
      continue;
    }

    if (user.role !== def.expectedRole) {
      console.error(`[ROLE MISMATCH] Account "${def.email}" has role "${user.role}", expected "${def.expectedRole}".`);
      hasRoleMismatch = true;
      continue;
    }

    console.log(`[FOUND] ${def.label.padEnd(26)} | ID: ${user.id} | Email: ${user.email} | Role: ${user.role} | Status: ${user.status}`);
  }

  if (hasRoleMismatch) {
    console.error('\n[SAFETY ABORT] Database records differ from expected demo accounts. Aborting before modifying any records.');
    process.exit(1);
  }

  console.log('\n--- Executing Password Reset ---');

  const summary = [];

  for (const def of targetAccounts) {
    const user = existingUsers.find((u) => u.email === def.email);
    const targetPassword = def.defaultPassword;

    if (!targetPassword || targetPassword.length < 8) {
      console.error(`[ERROR] Target password for ${def.email} does not meet minimum length requirement (8 chars).`);
      process.exit(1);
    }

    // Hash password with bcrypt cost factor 10
    const newHash = await bcrypt.hash(targetPassword, 10);

    if (!isDryRun) {
      // Execute within transaction: update user and record audit log
      const updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash: newHash,
            tokenVersion: { increment: 1 }, // Invalidate existing sessions
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: 'USER_PASSWORD_RESET',
            entity: 'USER',
            entityId: user.id,
            metadata: {
              source: 'CLI_DEMO_RESET',
              email: user.email,
              role: user.role,
              previousTokenVersion: user.tokenVersion,
              newTokenVersion: u.tokenVersion,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return u;
      });

      // Verify the new hash with bcrypt.compare
      const verifyCheck = await bcrypt.compare(targetPassword, updatedUser.passwordHash);
      if (!verifyCheck) {
        throw new Error(`Self-verification failed for ${user.email}: hash comparison mismatch!`);
      }

      summary.push({
        label: def.label,
        email: user.email,
        role: user.role,
        userId: user.id,
        status: updatedUser.status,
        tokenVersion: updatedUser.tokenVersion,
        resetOutcome: 'SUCCESS_VERIFIED',
      });

      console.log(`[RESET SUCCESS] ${def.email} (${user.role}) -> Password updated and bcrypt hash verified.`);
    } else {
      summary.push({
        label: def.label,
        email: user.email,
        role: user.role,
        userId: user.id,
        status: user.status,
        tokenVersion: user.tokenVersion,
        resetOutcome: 'DRY_RUN_VALIDATED',
      });
      console.log(`[DRY-RUN] Would reset password for ${def.email} (${user.role}).`);
    }
  }

  // If administrator was not included in reset, report its status as preserved
  if (!includeAdmin) {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@fixflow.edu' },
      select: { id: true, email: true, role: true, status: true, tokenVersion: true },
    });
    if (adminUser) {
      summary.unshift({
        label: 'Initial Administrator',
        email: adminUser.email,
        role: adminUser.role,
        userId: adminUser.id,
        status: adminUser.status,
        tokenVersion: adminUser.tokenVersion,
        resetOutcome: 'PRESERVED_UNCHANGED',
      });
    }
  }

  console.log('\n====================================================');
  console.log('FixFlow Demo Password Reset Summary');
  console.log('====================================================');
  console.table(summary);
  console.log('\nAll resets safely completed without modifying schema or extraneous records.');
}

main()
  .catch((err) => {
    console.error('\n[FATAL ERROR]', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
