/**
 * FixFlow — Controlled Initial Administrator Provisioning CLI
 *
 * Requirements:
 * - One-time local/CLI bootstrap command.
 * - Requires explicit credentials via environment or interactive prompt.
 * - Never prints raw password or password hash.
 * - Enforces bcrypt hashing (cost factor 10).
 * - Prevents multiple bootstrap administrators without explicit override.
 * - Follows docs/legacy-admin-recovery-policy.md (ACTIVE status, audit-logged).
 * - Never exposed via GraphQL.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

function prompt(question, isPassword = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('FixFlow — Controlled Administrator Provisioning CLI');
  console.log('====================================================\n');

  // Guard: check if an active administrator already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN', status: 'ACTIVE', isActive: true },
  });

  const allowForce = process.argv.includes('--force');
  if (existingAdmin && !allowForce) {
    console.warn(`[ABORTED] An active administrator account already exists (ID: ${existingAdmin.id}, Email: ${existingAdmin.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}).`);
    console.warn('To prevent unauthorized admin account injection, multiple bootstrap administrators are blocked.');
    console.warn('If you are performing disaster recovery, pass --force explicitly.');
    process.exit(1);
  }

  // Retrieve credentials from environment or interactive input
  let email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  let password = (process.env.BOOTSTRAP_ADMIN_PASSWORD || '').trim();
  let firstName = (process.env.BOOTSTRAP_ADMIN_FIRST_NAME || 'Campus').trim();
  let lastName = (process.env.BOOTSTRAP_ADMIN_LAST_NAME || 'Administrator').trim();

  if (!email) {
    email = (await prompt('Enter Administrator Email: ')).toLowerCase();
  }
  if (!password) {
    password = await prompt('Enter Administrator Password (min 8 characters): ', true);
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    console.error('[ERROR] A valid email address is required.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('[ERROR] Password must be at least 8 characters long.');
    process.exit(1);
  }

  // Check if target email already belongs to a user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error(`[ERROR] A user with email ${email} already exists.`);
    process.exit(1);
  }

  // Hash password using bcrypt
  const passwordHash = await bcrypt.hash(password, 10);

  // Clear plaintext password from memory
  password = null;

  // Persist administrator with audited metadata and recovery policy
  const adminUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'ADMIN',
        status: 'ACTIVE',
        tokenVersion: 1,
        emailVerified: false, // Per legacy-admin-recovery-policy.md, emailVerified must be verified through token or manual verification
        department: 'Facilities & Campus IT',
        isActive: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ADMIN_BOOTSTRAP_PROVISIONED',
        entity: 'USER',
        entityId: user.id,
        metadata: {
          email: user.email,
          role: 'ADMIN',
          status: 'ACTIVE',
          source: 'CLI_BOOTSTRAP',
          timestamp: new Date().toISOString(),
        },
      },
    });

    return user;
  });

  console.log('\n[SUCCESS] Administrator successfully provisioned:');
  console.log(`  User ID:       ${adminUser.id}`);
  console.log(`  Email:         ${adminUser.email}`);
  console.log(`  Name:          ${adminUser.firstName} ${adminUser.lastName}`);
  console.log(`  Role:          ${adminUser.role}`);
  console.log(`  Status:        ${adminUser.status}`);
  console.log(`  Token Version: ${adminUser.tokenVersion}`);
  console.log('  Password:      [SECURELY HASHED WITH BCRYPT - NOT DISPLAYED]');
  console.log('  Audit Event:   Recorded (ADMIN_BOOTSTRAP_PROVISIONED)\n');
}

main()
  .catch((err) => {
    console.error('[FATAL] Administrator provisioning failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
