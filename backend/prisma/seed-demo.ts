import {
  PrismaClient,
  Role,
  AccountStatus,
  ApplicationStatus,
  AssetStatus,
  Criticality,
  Priority,
  RequestStatus,
  WorkOrderStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic UUIDs for entities without natural unique constraints
const DEMO_UUIDS = {
  APP_MANAGER: '00000000-0000-4000-a000-000000000001',
  APP_TECH_RAHUL: '00000000-0000-4000-a000-000000000002',
  APP_TECH_ARUN: '00000000-0000-4000-a000-000000000003',
  HANDOVER_WO9: '00000000-0000-4000-a000-000000000010',
  ATTACHMENT_LEAK_1: '00000000-0000-4000-a000-000000000021',
  ATTACHMENT_LEAK_2: '00000000-0000-4000-a000-000000000022',
  COMMENT_REQ6: '00000000-0000-4000-a000-000000000031',
  COMMENT_WO9_INTERNAL: '00000000-0000-4000-a000-000000000032',
  COMMENT_REQ12_REOPEN: '00000000-0000-4000-a000-000000000033',
  NOTIFICATION_TECH_ASSIGNED: '00000000-0000-4000-a000-000000000041',
  NOTIFICATION_REQ_RESOLVED: '00000000-0000-4000-a000-000000000042',
  NOTIFICATION_CRITICAL_ALERT: '00000000-0000-4000-a000-000000000043',
  RECORD_GEN_MAINTENANCE: '00000000-0000-4000-a000-000000000051',
  SCHEDULE_AC_SERVICE: '00000000-0000-4000-a000-000000000061',
  SCHEDULE_GEN_TEST: '00000000-0000-4000-a000-000000000062',
  AUDIT_DEMO_SEED: '00000000-0000-4000-a000-000000000099',
  AUDIT_APP_MANAGER: '00000000-0000-4000-a000-000000000101',
  AUDIT_APP_TECH_RAHUL: '00000000-0000-4000-a000-000000000102',
  AUDIT_APP_TECH_ARUN: '00000000-0000-4000-a000-000000000103',
};

/**
 * Sanitizes connection string to display host and database name without exposing credentials.
 */
function sanitizeDatabaseUrl(urlStr: string | undefined): string {
  if (!urlStr) return '[undefined]';
  try {
    const parsed = new URL(urlStr);
    return `${parsed.protocol}//***:***@${parsed.host}${parsed.pathname}`;
  } catch {
    return '[malformed-url]';
  }
}

/**
 * Environment and production safety gate.
 */
function verifyEnvironmentSafety() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbUrl = process.env.DATABASE_URL;

  console.log(`🔍 Environment check: NODE_ENV=${nodeEnv}`);
  console.log(`🔌 Target database: ${sanitizeDatabaseUrl(dbUrl)}`);

  if (!dbUrl) {
    throw new Error('[Safety Exception] DATABASE_URL is not set. Seeder aborted.');
  }

  if (nodeEnv === 'production') {
    if (process.env.ALLOW_PRODUCTION_DEMO_SEED !== 'true') {
      throw new Error(
        '[Safety Exception] Demo seeding in production is disabled by default.\n' +
          'To explicitly authorize this seed, set ALLOW_PRODUCTION_DEMO_SEED=true and CONFIRM_PRODUCTION_DEMO_SEED=I_CONFIRM_DEMO_SEED_ON_PRODUCTION.',
      );
    }
    if (process.env.CONFIRM_PRODUCTION_DEMO_SEED !== 'I_CONFIRM_DEMO_SEED_ON_PRODUCTION') {
      throw new Error(
        '[Safety Exception] Production demo seed confirmation token mismatch.\n' +
          'Set CONFIRM_PRODUCTION_DEMO_SEED=I_CONFIRM_DEMO_SEED_ON_PRODUCTION to proceed.',
      );
    }
    if (!process.env.DEMO_SEED_PASSWORD || process.env.DEMO_SEED_PASSWORD.length < 12) {
      throw new Error(
        '[Safety Exception] In production, DEMO_SEED_PASSWORD must be explicitly provided and be at least 12 characters long.',
      );
    }
    console.log('⚠️ [PRODUCTION DEMO SEED AUTHORIZED] Explicit operator opt-in confirmed.');
  }
}

async function main() {
  console.log('🌱 Starting FixFlow Reusable Idempotent Demo Seeder...');

  // 1. Safety verification
  verifyEnvironmentSafety();

  // 2. Preserve and verify existing administrator
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@fixflow.edu' },
  });

  if (!admin) {
    throw new Error(
      'Initial administrator (admin@fixflow.edu) not found. ' +
        'Please provision the initial administrator first via "npm run bootstrap:admin".',
    );
  }

  if (admin.role !== Role.ADMIN || admin.status !== AccountStatus.ACTIVE) {
    throw new Error(
      `Administrator account (admin@fixflow.edu) has unexpected role (${admin.role}) or status (${admin.status}). Seeder aborted.`,
    );
  }

  console.log(`🛡️ Administrator preserved: ${admin.email} (ID: ${admin.id}, Status: ${admin.status})`);

  // 3. Password hashing
  // Default passwords match login page quick-presets in dev/test, or override via env vars
  const managerPass = process.env.DEMO_PASSWORD_MANAGER || process.env.DEMO_SEED_PASSWORD || 'Manager@123';
  const techPass = process.env.DEMO_PASSWORD_TECH || process.env.DEMO_SEED_PASSWORD || 'Tech@123';
  const studentPass = process.env.DEMO_PASSWORD_REQUESTER || process.env.DEMO_SEED_PASSWORD || 'Student@123';

  const [managerHash, techHash, studentHash] = await Promise.all([
    bcrypt.hash(managerPass, 10),
    bcrypt.hash(techPass, 10),
    bcrypt.hash(studentPass, 10),
  ]);

  // 4. Seed Campus Locations (Idempotent upsert by unique 'code')
  const locationsData = [
    {
      code: 'LOC-ENG-101',
      name: 'Engineering Block - Room 101 (Lecture Hall)',
      building: 'Engineering Block',
      floor: '1st Floor',
      roomNumber: '101',
      description: 'Smart Lecture Hall with interactive projector and dual HVAC units',
    },
    {
      code: 'LOC-ENG-204',
      name: 'Advanced Computing Lab 2',
      building: 'Engineering Block',
      floor: '2nd Floor',
      roomNumber: '204',
      description: 'High-performance computing laboratory with 60 workstations',
    },
    {
      code: 'LOC-LIB-301',
      name: 'Central University Library - Reading Wing',
      building: 'Central Library',
      floor: '3rd Floor',
      roomNumber: '301',
      description: 'Quiet study hall with central climate control and reading carrels',
    },
    {
      code: 'LOC-PWR-YRD',
      name: 'Main Campus Power Substation & Generator Yard',
      building: 'Utility Yard',
      floor: 'Ground',
      roomNumber: 'GEN-YARD',
      description: 'Primary diesel generator and electrical distribution panel',
    },
    {
      code: 'LOC-HST-B204',
      name: 'Boys Hostel Block B - Study Lounge',
      building: 'Hostel Block B',
      floor: '2nd Floor',
      roomNumber: 'B-204',
      description: 'Hostel recreational and study lounge with water dispenser and AC',
    },
  ];

  const seededLocations: Record<string, any> = {};
  for (const loc of locationsData) {
    const res = await prisma.location.upsert({
      where: { code: loc.code },
      update: {
        name: loc.name,
        building: loc.building,
        floor: loc.floor,
        roomNumber: loc.roomNumber,
        description: loc.description,
      },
      create: loc,
    });
    seededLocations[loc.code] = res;
  }
  console.log(`📍 Campus Locations seeded/verified: ${Object.keys(seededLocations).length}`);

  // 5. Seed Asset Categories (Idempotent upsert by unique 'code')
  const categoriesData = [
    {
      code: 'HVAC',
      name: 'Heating, Ventilation & Air Conditioning',
      description: 'Air conditioners, chillers, AHUs, and ventilation systems',
      defaultMaintenanceIntervalDays: 90,
    },
    {
      code: 'ELECTRICAL',
      name: 'Electrical Infrastructure',
      description: 'Generators, distribution boards, transformers, and emergency lighting',
      defaultMaintenanceIntervalDays: 60,
    },
    {
      code: 'IT_HARDWARE',
      name: 'IT & AV Equipment',
      description: 'Projectors, digital podiums, lab workstations, and network racks',
      defaultMaintenanceIntervalDays: 120,
    },
    {
      code: 'PLUMBING',
      name: 'Plumbing & Water Systems',
      description: 'RO purifiers, submersible water pumps, and pipeline manifolds',
      defaultMaintenanceIntervalDays: 45,
    },
  ];

  const seededCategories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const res = await prisma.assetCategory.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        description: cat.description,
        defaultMaintenanceIntervalDays: cat.defaultMaintenanceIntervalDays,
      },
      create: cat,
    });
    seededCategories[cat.code] = res;
  }
  console.log(`🏷️ Asset Categories seeded/verified: ${Object.keys(seededCategories).length}`);

  // 6. Seed Campus Assets (Idempotent upsert by unique 'assetTag')
  const assetsData = [
    {
      assetTag: 'AST-AC-ENG-101',
      name: 'Daikin 2.0 Ton Inverter Split AC',
      description: 'Primary cooling unit in Lecture Hall 101',
      categoryCode: 'HVAC',
      locationCode: 'LOC-ENG-101',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.HIGH,
      conditionRating: 4,
      serialNumber: 'DK-2024-88412',
      manufacturer: 'Daikin',
      model: 'FTKF60TV16U',
      qrIdentifier: 'fixflow://assets/AST-AC-ENG-101',
    },
    {
      assetTag: 'AST-PRJ-ENG-101',
      name: 'Epson EB-2250U Classroom Projector',
      description: 'Ceiling-mounted 5000 Lumens classroom projector',
      categoryCode: 'IT_HARDWARE',
      locationCode: 'LOC-ENG-101',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.MEDIUM,
      conditionRating: 4,
      serialNumber: 'EPS-2023-99411',
      manufacturer: 'Epson',
      model: 'EB-2250U',
      qrIdentifier: 'fixflow://assets/AST-PRJ-ENG-101',
    },
    {
      assetTag: 'AST-AC-LAB-204',
      name: 'Carrier 3.0 Ton Cassette Air Conditioner',
      description: 'Central cassette unit for Computing Lab 2 workstation cluster',
      categoryCode: 'HVAC',
      locationCode: 'LOC-ENG-204',
      status: AssetStatus.UNDER_MAINTENANCE,
      criticality: Criticality.CRITICAL,
      conditionRating: 3,
      serialNumber: 'CAR-2022-77140',
      manufacturer: 'Carrier',
      model: '40KMC036',
      qrIdentifier: 'fixflow://assets/AST-AC-LAB-204',
    },
    {
      assetTag: 'AST-GEN-YRD-01',
      name: 'Cummins 250 kVA Silent Diesel Generator',
      description: 'Campus emergency backup power generation unit',
      categoryCode: 'ELECTRICAL',
      locationCode: 'LOC-PWR-YRD',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.CRITICAL,
      conditionRating: 5,
      serialNumber: 'CUM-2021-00412',
      manufacturer: 'Cummins India',
      model: 'C250D5P',
      qrIdentifier: 'fixflow://assets/AST-GEN-YRD-01',
    },
    {
      assetTag: 'AST-RO-HST-B2',
      name: 'Commercial RO Drinking Water Unit (Hostel)',
      description: 'Hostel Block B residential drinking water plant',
      categoryCode: 'PLUMBING',
      locationCode: 'LOC-HST-B204',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.HIGH,
      conditionRating: 4,
      serialNumber: 'KENT-2023-44919',
      manufacturer: 'Kent RO Systems',
      model: 'Elite Plus 50L',
      qrIdentifier: 'fixflow://assets/AST-RO-HST-B2',
    },
  ];

  const seededAssets: Record<string, any> = {};
  for (const a of assetsData) {
    const category = seededCategories[a.categoryCode];
    const location = seededLocations[a.locationCode];

    const res = await prisma.asset.upsert({
      where: { assetTag: a.assetTag },
      update: {
        name: a.name,
        description: a.description,
        status: a.status,
        criticality: a.criticality,
        conditionRating: a.conditionRating,
        serialNumber: a.serialNumber,
        manufacturer: a.manufacturer,
        model: a.model,
        qrIdentifier: a.qrIdentifier,
        categoryId: category.id,
        locationId: location.id,
      },
      create: {
        assetTag: a.assetTag,
        name: a.name,
        description: a.description,
        status: a.status,
        criticality: a.criticality,
        conditionRating: a.conditionRating,
        serialNumber: a.serialNumber,
        manufacturer: a.manufacturer,
        model: a.model,
        qrIdentifier: a.qrIdentifier,
        categoryId: category.id,
        locationId: location.id,
      },
    });
    seededAssets[a.assetTag] = res;
  }
  console.log(`📦 Campus Assets seeded/verified: ${Object.keys(seededAssets).length}`);

  // 7. Seed Demo Users (Idempotent upsert by unique 'email')
  const usersData = [
    {
      email: 'manager@fixflow.edu',
      passwordHash: managerHash,
      firstName: 'Sunil',
      lastName: 'Mehta',
      role: Role.FACILITY_MANAGER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Estate & Facilities Management',
      phone: '+91 98765 43211',
      appId: DEMO_UUIDS.APP_MANAGER,
      auditId: DEMO_UUIDS.AUDIT_APP_MANAGER,
    },
    {
      email: 'tech.rahul@fixflow.edu',
      passwordHash: techHash,
      firstName: 'Rahul',
      lastName: 'Verma',
      role: Role.TECHNICIAN,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'HVAC & Electrical Maintenance',
      phone: '+91 98765 43212',
      appId: DEMO_UUIDS.APP_TECH_RAHUL,
      auditId: DEMO_UUIDS.AUDIT_APP_TECH_RAHUL,
    },
    {
      email: 'tech.arun@fixflow.edu',
      passwordHash: techHash,
      firstName: 'Arun',
      lastName: 'Kumar',
      role: Role.TECHNICIAN,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'IT Hardware & Lab Support',
      phone: '+91 98765 43213',
      appId: DEMO_UUIDS.APP_TECH_ARUN,
      auditId: DEMO_UUIDS.AUDIT_APP_TECH_ARUN,
    },
    {
      email: 'student.riya@fixflow.edu',
      passwordHash: studentHash,
      firstName: 'Riya',
      lastName: 'Sharma',
      role: Role.REQUESTER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Computer Science & Engineering',
      phone: '+91 98765 43214',
    },
    {
      email: 'prof.sharma@fixflow.edu',
      passwordHash: studentHash,
      firstName: 'Dr. Ramesh',
      lastName: 'Sharma',
      role: Role.REQUESTER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      department: 'Mechanical Engineering Department',
      phone: '+91 98765 43215',
    },
  ];

  const seededUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        department: u.department,
        phone: u.phone,
        passwordHash: u.passwordHash,
      },
      create: {
        email: u.email,
        passwordHash: u.passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        emailVerifiedAt: u.emailVerifiedAt,
        department: u.department,
        phone: u.phone,
      },
    });
    seededUsers[u.email] = user;

    // For staff roles, maintain institutional governance consistency:
    // Upsert approved RegistrationApplication and Admin approval audit event
    if (u.appId && (u.role === Role.TECHNICIAN || u.role === Role.FACILITY_MANAGER)) {
      await prisma.registrationApplication.upsert({
        where: { id: u.appId },
        update: {
          status: ApplicationStatus.APPROVED,
          userId: user.id,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
        create: {
          id: u.appId,
          userId: user.id,
          applicantName: `${u.firstName} ${u.lastName}`,
          applicantEmail: u.email,
          institutionalId: `INST-${user.id.slice(0, 8).toUpperCase()}`,
          department: u.department,
          contactNumber: u.phone,
          requestedRole: u.role,
          status: ApplicationStatus.APPROVED,
          emailVerified: true,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });

      if (u.auditId) {
        await prisma.auditLog.upsert({
          where: { id: u.auditId },
          update: {
            actorId: admin.id,
            action: 'ADMIN_APPROVE_REGISTRATION_APPLICATION',
            entity: 'REGISTRATION_APPLICATION',
            entityId: u.appId,
            metadata: {
              applicantId: user.id,
              approvedRole: u.role,
              reviewerId: admin.id,
              note: 'Demo staff account governance approval state verified',
            },
          },
          create: {
            id: u.auditId,
            actorId: admin.id,
            action: 'ADMIN_APPROVE_REGISTRATION_APPLICATION',
            entity: 'REGISTRATION_APPLICATION',
            entityId: u.appId,
            metadata: {
              applicantId: user.id,
              approvedRole: u.role,
              reviewerId: admin.id,
              note: 'Demo staff account governance approval state verified',
            },
          },
        });
      }
    }
  }
  console.log(`👤 Demo Users seeded/verified: ${Object.keys(seededUsers).length} accounts (Admin preserved separate)`);

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000);

  // 8. Seed Realistic Maintenance Scenarios (12 Distinct Scenarios)
  const requestsData = [
    // 1. Low-priority routine maintenance request (no attachments)
    {
      requestNumber: 'REQ-DEMO-001',
      title: 'Routine filter replacement and airflow balance check',
      description: 'Quarterly routine intake air filter replacement for Lecture Hall 101 split AC unit.',
      requesterEmail: 'prof.sharma@fixflow.edu',
      locationCode: 'LOC-ENG-101',
      assetTag: 'AST-AC-ENG-101',
      priority: Priority.LOW,
      status: RequestStatus.OPEN,
      slaTargetHours: 72,
      slaDeadline: hoursFromNow(70),
      createdAt: hoursAgo(2),
    },
    // 2. Medium-priority repair request (no attachments)
    {
      requestNumber: 'REQ-DEMO-002',
      title: 'Fluorescent ceiling fixture flickering in rear rows',
      description: 'Ballast or bulb flickering persistently in rear seating row of Lecture Hall 101.',
      requesterEmail: 'student.riya@fixflow.edu',
      locationCode: 'LOC-ENG-101',
      assetTag: null,
      priority: Priority.MEDIUM,
      status: RequestStatus.OPEN,
      slaTargetHours: 24,
      slaDeadline: hoursFromNow(20),
      createdAt: hoursAgo(4),
    },
    // 3. High-priority issue awaiting triage
    {
      requestNumber: 'REQ-DEMO-003',
      title: 'Lab 2 Server rack ambient temperature warning (82°F)',
      description: 'Computing Lab 2 climate control underperforming. Thermal alert threshold reached.',
      requesterEmail: 'prof.sharma@fixflow.edu',
      locationCode: 'LOC-ENG-204',
      assetTag: 'AST-AC-LAB-204',
      priority: Priority.HIGH,
      status: RequestStatus.TRIAGED,
      slaTargetHours: 8,
      slaDeadline: hoursFromNow(7),
      createdAt: hoursAgo(1),
    },
    // 4. Safety-critical issue (Safety risk takes precedence over votes)
    {
      requestNumber: 'REQ-DEMO-004',
      title: 'Exposed 415V electrical wiring conduit near generator yard walkway',
      description: 'Physical damage to conduit with exposed energized conductors and ozone odor. Immediate shock and fire hazard.',
      requesterEmail: 'prof.sharma@fixflow.edu',
      locationCode: 'LOC-PWR-YRD',
      assetTag: 'AST-GEN-YRD-01',
      priority: Priority.CRITICAL,
      status: RequestStatus.OPEN,
      slaTargetHours: 2,
      slaDeadline: hoursFromNow(1.5),
      createdAt: hoursAgo(0.5),
    },
    // 5. Request with no image attachments
    {
      requestNumber: 'REQ-DEMO-005',
      title: 'Whiteboard marker tray detached and wall mount loose',
      description: 'Metal marker tray in Room 101 has come loose from anchors. Screws missing.',
      requesterEmail: 'student.riya@fixflow.edu',
      locationCode: 'LOC-ENG-101',
      assetTag: null,
      priority: Priority.LOW,
      status: RequestStatus.OPEN,
      slaTargetHours: 72,
      slaDeadline: hoursFromNow(67),
      createdAt: hoursAgo(5),
    },
    // 6. Request with valid image attachments
    {
      requestNumber: 'REQ-DEMO-006',
      title: 'Ceiling water pipe active leak dripping over reading desks',
      description: 'Continuous dripping from overhead water distribution pipe onto study carrels in Library 3rd floor. Acoustic ceiling tiles saturated.',
      requesterEmail: 'student.riya@fixflow.edu',
      locationCode: 'LOC-LIB-301',
      assetTag: null,
      priority: Priority.HIGH,
      status: RequestStatus.OPEN,
      slaTargetHours: 12,
      slaDeadline: hoursFromNow(9),
      createdAt: hoursAgo(3),
      hasAttachments: true,
    },
    // 7. Request awaiting triage
    {
      requestNumber: 'REQ-DEMO-007',
      title: 'Hostel RO drinking water purifier dispenser low pressure',
      description: 'Water dispenser flow rate severely degraded. Output water temperature is lukewarm.',
      requesterEmail: 'student.riya@fixflow.edu',
      locationCode: 'LOC-HST-B204',
      assetTag: 'AST-RO-HST-B2',
      priority: Priority.MEDIUM,
      status: RequestStatus.OPEN,
      slaTargetHours: 24,
      slaDeadline: hoursFromNow(18),
      createdAt: hoursAgo(6),
    },
    // 8. Assigned request with technician work order (PENDING)
    {
      requestNumber: 'REQ-DEMO-008',
      title: 'Classroom projector optical lamp failure before scheduled lecture',
      description: 'Projector turns on but lamp indicator flashes orange. No projection output.',
      requesterEmail: 'prof.sharma@fixflow.edu',
      locationCode: 'LOC-ENG-101',
      assetTag: 'AST-PRJ-ENG-101',
      priority: Priority.MEDIUM,
      status: RequestStatus.ASSIGNED,
      slaTargetHours: 12,
      slaDeadline: hoursFromNow(4),
      createdAt: hoursAgo(8),
      workOrder: {
        orderNumber: 'WO-DEMO-008',
        techEmail: 'tech.rahul@fixflow.edu',
        status: WorkOrderStatus.PENDING,
        instructions: 'Replace projector lamp module (model ELPLP95) and verify alignment.',
        estimatedCost: 120.0,
      },
    },
    // 9. Request in progress (IN_PROGRESS work order with technician handover)
    {
      requestNumber: 'REQ-DEMO-009',
      title: 'Carrier Cassette AC abnormal vibration and refrigerant hiss',
      description: 'Grinding noise from fan blower motor and noticeable whistling from expansion valve in Lab 2.',
      requesterEmail: 'prof.sharma@fixflow.edu',
      locationCode: 'LOC-ENG-204',
      assetTag: 'AST-AC-LAB-204',
      priority: Priority.HIGH,
      status: RequestStatus.IN_PROGRESS,
      slaTargetHours: 8,
      slaDeadline: hoursFromNow(2),
      createdAt: hoursAgo(10),
      workOrder: {
        orderNumber: 'WO-DEMO-009',
        techEmail: 'tech.arun@fixflow.edu',
        status: WorkOrderStatus.IN_PROGRESS,
        instructions: 'Check refrigerant pressure and isolate fan motor bearing vibration.',
        workNotes: 'Refrigerant R-410A recharged to 115 psi. Fan bearing lubricated.',
        startedAt: hoursAgo(2),
        estimatedCost: 350.0,
        handover: {
          previousTechEmail: 'tech.rahul@fixflow.edu',
          nextTechEmail: 'tech.arun@fixflow.edu',
          notes: 'Shift transition: diagnosed initial refrigerant drop. Handing over to Arun for pressure test.',
        },
      },
    },
    // 10. Resolved request awaiting verification
    {
      requestNumber: 'REQ-DEMO-010',
      title: 'Diesel Generator battery charging alternator belt tensioner slack',
      description: 'Auxiliary alternator belt slipping during weekly diagnostic startup cycle.',
      requesterEmail: 'prof.sharma@fixflow.edu',
      locationCode: 'LOC-PWR-YRD',
      assetTag: 'AST-GEN-YRD-01',
      priority: Priority.MEDIUM,
      status: RequestStatus.RESOLVED,
      slaTargetHours: 24,
      slaDeadline: hoursAgo(2),
      resolvedAt: hoursAgo(3),
      createdAt: hoursAgo(18),
      workOrder: {
        orderNumber: 'WO-DEMO-010',
        techEmail: 'tech.rahul@fixflow.edu',
        status: WorkOrderStatus.COMPLETED,
        instructions: 'Inspect and re-tension alternator serpentine belt or replace if cracked.',
        workNotes: 'Replaced alternator serpentine belt with OEM Cummins part CUM-BT-09.',
        resolutionSummary: 'Alternator belt replaced and tested at 1800 RPM. Charging voltage stable at 27.6V.',
        partsUsed: 'Cummins Serpentine Belt CUM-BT-09',
        actualCost: 85.5,
        startedAt: hoursAgo(5),
        completedAt: hoursAgo(3),
        record: {
          actionTaken: 'Replaced worn serpentine drive belt and adjusted tensioner pulley.',
          repairDetails: 'Alternator output verified under 50kW test load for 30 minutes.',
          partsReplaced: 'Cummins Serpentine Belt #CUM-BT-09',
          cost: 85.5,
        },
      },
    },
    // 11. Verified and closed request
    {
      requestNumber: 'REQ-DEMO-011',
      title: 'Emergency exit sign illumination bulb burned out',
      description: 'Illuminated exit sign above 3rd floor west stairwell dark.',
      requesterEmail: 'student.riya@fixflow.edu',
      locationCode: 'LOC-LIB-301',
      assetTag: null,
      priority: Priority.LOW,
      status: RequestStatus.CLOSED,
      slaTargetHours: 48,
      slaDeadline: hoursAgo(12),
      resolvedAt: hoursAgo(16),
      closedAt: hoursAgo(12),
      verificationNotes: 'Verified by requester: fixture replaced, internal battery backup operational.',
      createdAt: hoursAgo(40),
      workOrder: {
        orderNumber: 'WO-DEMO-011',
        techEmail: 'tech.rahul@fixflow.edu',
        status: WorkOrderStatus.COMPLETED,
        resolutionSummary: 'Replaced LED exit sign driver board and battery pack.',
        actualCost: 45.0,
        startedAt: hoursAgo(18),
        completedAt: hoursAgo(16),
      },
    },
    // 12. Reopened request
    {
      requestNumber: 'REQ-DEMO-012',
      title: 'Roof drainage gutter leak dripping onto Room 101 ceiling',
      description: 'Water staining re-appeared after afternoon thunderstorm despite prior sealant patch.',
      requesterEmail: 'prof.sharma@fixflow.edu',
      locationCode: 'LOC-ENG-101',
      assetTag: null,
      priority: Priority.HIGH,
      status: RequestStatus.REOPENED,
      slaTargetHours: 8,
      slaDeadline: hoursFromNow(5),
      createdAt: hoursAgo(48),
      workOrder: {
        orderNumber: 'WO-DEMO-012',
        techEmail: 'tech.arun@fixflow.edu',
        status: WorkOrderStatus.ACCEPTED,
        instructions: 'Perform waterproof membrane inspection and clear downspout blockage.',
        startedAt: hoursAgo(1),
        estimatedCost: 200.0,
      },
    },
  ];

  const seededRequests: Record<string, any> = {};
  for (const r of requestsData) {
    const requester = seededUsers[r.requesterEmail];
    const location = seededLocations[r.locationCode];
    const asset = r.assetTag ? seededAssets[r.assetTag] : null;

    const request = await prisma.maintenanceRequest.upsert({
      where: { requestNumber: r.requestNumber },
      update: {
        title: r.title,
        description: r.description,
        priority: r.priority,
        status: r.status,
        slaTargetHours: r.slaTargetHours,
        slaDeadline: r.slaDeadline,
        resolvedAt: r.resolvedAt || null,
        closedAt: r.closedAt || null,
        verificationNotes: r.verificationNotes || null,
        requesterId: requester.id,
        locationId: location.id,
        assetId: asset?.id || null,
      },
      create: {
        requestNumber: r.requestNumber,
        title: r.title,
        description: r.description,
        priority: r.priority,
        status: r.status,
        slaTargetHours: r.slaTargetHours,
        slaDeadline: r.slaDeadline,
        resolvedAt: r.resolvedAt || null,
        closedAt: r.closedAt || null,
        verificationNotes: r.verificationNotes || null,
        requesterId: requester.id,
        locationId: location.id,
        assetId: asset?.id || null,
        createdAt: r.createdAt,
      },
    });
    seededRequests[r.requestNumber] = request;

    // Seed Work Order if defined
    if (r.workOrder) {
      const tech = seededUsers[r.workOrder.techEmail];
      const wo = await prisma.workOrder.upsert({
        where: { orderNumber: r.workOrder.orderNumber },
        update: {
          status: r.workOrder.status,
          instructions: r.workOrder.instructions || null,
          workNotes: r.workOrder.workNotes || null,
          resolutionSummary: r.workOrder.resolutionSummary || null,
          partsUsed: r.workOrder.partsUsed || null,
          estimatedCost: r.workOrder.estimatedCost || null,
          actualCost: r.workOrder.actualCost || null,
          startedAt: r.workOrder.startedAt || null,
          completedAt: r.workOrder.completedAt || null,
          technicianId: tech?.id || null,
          assetId: asset?.id || null,
        },
        create: {
          orderNumber: r.workOrder.orderNumber,
          requestId: request.id,
          technicianId: tech?.id || null,
          assetId: asset?.id || null,
          status: r.workOrder.status,
          instructions: r.workOrder.instructions || null,
          workNotes: r.workOrder.workNotes || null,
          resolutionSummary: r.workOrder.resolutionSummary || null,
          partsUsed: r.workOrder.partsUsed || null,
          estimatedCost: r.workOrder.estimatedCost || null,
          actualCost: r.workOrder.actualCost || null,
          startedAt: r.workOrder.startedAt || null,
          completedAt: r.workOrder.completedAt || null,
        },
      });

      // Seed Handover if defined
      if (r.workOrder.handover) {
        const prevTech = seededUsers[r.workOrder.handover.previousTechEmail];
        const nextTech = seededUsers[r.workOrder.handover.nextTechEmail];
        await prisma.workOrderHandover.upsert({
          where: { id: DEMO_UUIDS.HANDOVER_WO9 },
          update: {
            workOrderId: wo.id,
            previousTechId: prevTech.id,
            nextTechId: nextTech.id,
            handoverNotes: r.workOrder.handover.notes,
          },
          create: {
            id: DEMO_UUIDS.HANDOVER_WO9,
            workOrderId: wo.id,
            previousTechId: prevTech.id,
            nextTechId: nextTech.id,
            handoverNotes: r.workOrder.handover.notes,
          },
        });
      }

      // Seed MaintenanceRecord if defined
      if (r.workOrder.record && asset) {
        await prisma.maintenanceRecord.upsert({
          where: { id: DEMO_UUIDS.RECORD_GEN_MAINTENANCE },
          update: {
            assetId: asset.id,
            workOrderId: wo.id,
            technicianId: tech.id,
            actionTaken: r.workOrder.record.actionTaken,
            repairDetails: r.workOrder.record.repairDetails,
            partsReplaced: r.workOrder.record.partsReplaced,
            cost: r.workOrder.record.cost,
            dateCompleted: r.workOrder.completedAt || new Date(),
          },
          create: {
            id: DEMO_UUIDS.RECORD_GEN_MAINTENANCE,
            assetId: asset.id,
            workOrderId: wo.id,
            technicianId: tech.id,
            actionTaken: r.workOrder.record.actionTaken,
            repairDetails: r.workOrder.record.repairDetails,
            partsReplaced: r.workOrder.record.partsReplaced,
            cost: r.workOrder.record.cost,
            dateCompleted: r.workOrder.completedAt || new Date(),
          },
        });
      }
    }
  }
  console.log(`📋 Maintenance Requests seeded/verified: ${Object.keys(seededRequests).length} scenarios`);

  // 9. Seed Image Attachments for REQ-DEMO-006 (Legitimate local demo assets)
  const req6 = seededRequests['REQ-DEMO-006'];
  const studentUser = seededUsers['student.riya@fixflow.edu'];

  await prisma.attachment.upsert({
    where: { id: DEMO_UUIDS.ATTACHMENT_LEAK_1 },
    update: {
      requestId: req6.id,
      uploaderId: studentUser.id,
      fileName: 'water-leak-evidence.png',
      fileUrl: '/demo-assets/water-leak-evidence.png',
      fileType: 'image/png',
      fileSize: 4618,
    },
    create: {
      id: DEMO_UUIDS.ATTACHMENT_LEAK_1,
      requestId: req6.id,
      uploaderId: studentUser.id,
      fileName: 'water-leak-evidence.png',
      fileUrl: '/demo-assets/water-leak-evidence.png',
      fileType: 'image/png',
      fileSize: 4618,
    },
  });

  await prisma.attachment.upsert({
    where: { id: DEMO_UUIDS.ATTACHMENT_LEAK_2 },
    update: {
      requestId: req6.id,
      uploaderId: studentUser.id,
      fileName: 'hvac-compressor-fault.png',
      fileUrl: '/demo-assets/hvac-compressor-fault.png',
      fileType: 'image/png',
      fileSize: 4390,
    },
    create: {
      id: DEMO_UUIDS.ATTACHMENT_LEAK_2,
      requestId: req6.id,
      uploaderId: studentUser.id,
      fileName: 'hvac-compressor-fault.png',
      fileUrl: '/demo-assets/hvac-compressor-fault.png',
      fileType: 'image/png',
      fileSize: 4390,
    },
  });
  console.log('📎 Image Attachments seeded/verified: 2 valid local demo evidence files on REQ-DEMO-006');

  // 10. Seed Comments (User public and internal notes)
  const rahulTech = seededUsers['tech.rahul@fixflow.edu'];
  const profUser = seededUsers['prof.sharma@fixflow.edu'];

  await prisma.comment.upsert({
    where: { id: DEMO_UUIDS.COMMENT_REQ6 },
    update: {
      requestId: req6.id,
      authorId: studentUser.id,
      content: 'Water drip rate has increased significantly over the last hour. Two student study desks have been cordoned off.',
      isInternal: false,
    },
    create: {
      id: DEMO_UUIDS.COMMENT_REQ6,
      requestId: req6.id,
      authorId: studentUser.id,
      content: 'Water drip rate has increased significantly over the last hour. Two student study desks have been cordoned off.',
      isInternal: false,
    },
  });

  const req9 = seededRequests['REQ-DEMO-009'];
  await prisma.comment.upsert({
    where: { id: DEMO_UUIDS.COMMENT_WO9_INTERNAL },
    update: {
      requestId: req9.id,
      authorId: rahulTech.id,
      content: 'Internal technician diagnostic: low side pressure measured at 45 psi. Suspected slow schrader valve leak.',
      isInternal: true,
    },
    create: {
      id: DEMO_UUIDS.COMMENT_WO9_INTERNAL,
      requestId: req9.id,
      authorId: rahulTech.id,
      content: 'Internal technician diagnostic: low side pressure measured at 45 psi. Suspected slow schrader valve leak.',
      isInternal: true,
    },
  });

  const req12 = seededRequests['REQ-DEMO-012'];
  await prisma.comment.upsert({
    where: { id: DEMO_UUIDS.COMMENT_REQ12_REOPEN },
    update: {
      requestId: req12.id,
      authorId: profUser.id,
      content: 'Reopening issue: Water stains expanded after today 3 PM rainstorm. Perimeter flashing appears unseated.',
      isInternal: false,
    },
    create: {
      id: DEMO_UUIDS.COMMENT_REQ12_REOPEN,
      requestId: req12.id,
      authorId: profUser.id,
      content: 'Reopening issue: Water stains expanded after today 3 PM rainstorm. Perimeter flashing appears unseated.',
      isInternal: false,
    },
  });
  console.log('💬 Comments seeded/verified: 3 interactive comments (public & internal)');

  // 11. Seed Notifications
  await prisma.notification.upsert({
    where: { id: DEMO_UUIDS.NOTIFICATION_TECH_ASSIGNED },
    update: {
      userId: rahulTech.id,
      title: 'Work Order Assigned: WO-DEMO-008',
      message: 'You have been assigned to replace classroom projector lamp in Room 101.',
      type: 'WORK_ORDER_ASSIGNED',
      link: '/technician',
      isRead: false,
    },
    create: {
      id: DEMO_UUIDS.NOTIFICATION_TECH_ASSIGNED,
      userId: rahulTech.id,
      title: 'Work Order Assigned: WO-DEMO-008',
      message: 'You have been assigned to replace classroom projector lamp in Room 101.',
      type: 'WORK_ORDER_ASSIGNED',
      link: '/technician',
      isRead: false,
    },
  });

  await prisma.notification.upsert({
    where: { id: DEMO_UUIDS.NOTIFICATION_REQ_RESOLVED },
    update: {
      userId: studentUser.id,
      title: 'Maintenance Request Resolved: REQ-DEMO-010',
      message: 'Diesel Generator alternator belt tensioner slack issue has been resolved by technician Rahul Verma.',
      type: 'REQUEST_RESOLVED',
      link: '/requester',
      isRead: true,
    },
    create: {
      id: DEMO_UUIDS.NOTIFICATION_REQ_RESOLVED,
      userId: studentUser.id,
      title: 'Maintenance Request Resolved: REQ-DEMO-010',
      message: 'Diesel Generator alternator belt tensioner slack issue has been resolved by technician Rahul Verma.',
      type: 'REQUEST_RESOLVED',
      link: '/requester',
      isRead: true,
    },
  });
  console.log('🔔 Notifications seeded/verified: 2 notifications');

  // 12. Seed Maintenance Schedules for Assets
  const acAsset = seededAssets['AST-AC-ENG-101'];
  const genAsset = seededAssets['AST-GEN-YRD-01'];

  await prisma.maintenanceSchedule.upsert({
    where: { id: DEMO_UUIDS.SCHEDULE_AC_SERVICE },
    update: {
      assetId: acAsset.id,
      title: 'Quarterly Inverter AC Preventive Maintenance',
      description: 'Comprehensive coil wash, filter replacement, electrical connection check, and cooling performance test.',
      frequencyDays: 90,
      nextDueDate: hoursFromNow(24 * 45),
      isEnabled: true,
    },
    create: {
      id: DEMO_UUIDS.SCHEDULE_AC_SERVICE,
      assetId: acAsset.id,
      title: 'Quarterly Inverter AC Preventive Maintenance',
      description: 'Comprehensive coil wash, filter replacement, electrical connection check, and cooling performance test.',
      frequencyDays: 90,
      nextDueDate: hoursFromNow(24 * 45),
      isEnabled: true,
    },
  });

  await prisma.maintenanceSchedule.upsert({
    where: { id: DEMO_UUIDS.SCHEDULE_GEN_TEST },
    update: {
      assetId: genAsset.id,
      title: 'Monthly Standby Diesel Generator Load Bank Testing',
      description: 'Inspect starter batteries, oil level, coolant level, fuel filters, and run 30-min full load test.',
      frequencyDays: 30,
      nextDueDate: hoursFromNow(24 * 12),
      isEnabled: true,
    },
    create: {
      id: DEMO_UUIDS.SCHEDULE_GEN_TEST,
      assetId: genAsset.id,
      title: 'Monthly Standby Diesel Generator Load Bank Testing',
      description: 'Inspect starter batteries, oil level, coolant level, fuel filters, and run 30-min full load test.',
      frequencyDays: 30,
      nextDueDate: hoursFromNow(24 * 12),
      isEnabled: true,
    },
  });
  console.log('📅 Maintenance Schedules seeded/verified: 2 preventive maintenance schedules');

  // 13. Seed Audit Record for Demonstration Dataset
  await prisma.auditLog.upsert({
    where: { id: DEMO_UUIDS.AUDIT_DEMO_SEED },
    update: {
      actorId: admin.id,
      action: 'DEMO_DATA_SEEDED',
      entity: 'SYSTEM',
      entityId: 'DEMO_ROOT',
      metadata: {
        note: 'FixFlow standard multi-role demonstration dataset seeded',
        timestamp: new Date().toISOString(),
        requestsCount: Object.keys(seededRequests).length,
      },
    },
    create: {
      id: DEMO_UUIDS.AUDIT_DEMO_SEED,
      actorId: admin.id,
      action: 'DEMO_DATA_SEEDED',
      entity: 'SYSTEM',
      entityId: 'DEMO_ROOT',
      metadata: {
        note: 'FixFlow standard multi-role demonstration dataset seeded',
        timestamp: new Date().toISOString(),
        requestsCount: Object.keys(seededRequests).length,
      },
    },
  });

  console.log('✅ FixFlow reusable demo seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Demo seeding failed:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
