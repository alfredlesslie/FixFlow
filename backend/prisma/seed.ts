import { PrismaClient, Role, AssetStatus, Criticality } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FixFlow database seeding...');

  // 1. Seed Users (Representing all 4 roles with hashed passwords)
  const passwordHash = await bcrypt.hash('FixFlow@2026', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const managerPasswordHash = await bcrypt.hash('Manager@123', 10);
  const techPasswordHash = await bcrypt.hash('Tech@123', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);
  const facultyPasswordHash = await bcrypt.hash('Faculty@123', 10);

  const usersData = [
    {
      email: 'admin@fixflow.edu',
      passwordHash: adminPasswordHash,
      firstName: 'Vikram',
      lastName: 'Singhania',
      role: Role.ADMIN,
      department: 'Campus Administration & IT',
      phone: '+91 98765 43210',
    },
    {
      email: 'manager@fixflow.edu',
      passwordHash: managerPasswordHash,
      firstName: 'Sunil',
      lastName: 'Mehta',
      role: Role.FACILITY_MANAGER,
      department: 'Estate & Facilities Management',
      phone: '+91 98765 43211',
    },
    {
      email: 'tech.rahul@fixflow.edu',
      passwordHash: techPasswordHash,
      firstName: 'Rahul',
      lastName: 'Verma',
      role: Role.TECHNICIAN,
      department: 'HVAC & Electrical Maintenance',
      phone: '+91 98765 43212',
    },
    {
      email: 'tech.arun@fixflow.edu',
      passwordHash: techPasswordHash,
      firstName: 'Arun',
      lastName: 'Kumar',
      role: Role.TECHNICIAN,
      department: 'IT Hardware & Lab Support',
      phone: '+91 98765 43213',
    },
    {
      email: 'student.riya@fixflow.edu',
      passwordHash: studentPasswordHash,
      firstName: 'Riya',
      lastName: 'Sharma',
      role: Role.REQUESTER,
      department: 'Computer Science & Engineering',
      phone: '+91 98765 43214',
    },
    {
      email: 'prof.sharma@fixflow.edu',
      passwordHash: facultyPasswordHash,
      firstName: 'Dr. Ramesh',
      lastName: 'Sharma',
      role: Role.REQUESTER,
      department: 'Mechanical Engineering Department',
      phone: '+91 98765 43215',
    },
  ];

  const seededUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        department: u.department,
        phone: u.phone,
      },
      create: u,
    });
    seededUsers.push(user);
    console.log(`  👤 Seeded User: ${user.email} (${user.role})`);
  }

  // 2. Seed Campus Locations
  const locationsData = [
    {
      code: 'ENG-BLD-101',
      name: 'Engineering Block - Room 101 (Lecture Hall)',
      building: 'Engineering Block',
      floor: '1st Floor',
      roomNumber: '101',
      description: 'Smart Lecture Hall with interactive projector and dual HVAC units',
    },
    {
      code: 'ENG-LAB-204',
      name: 'Advanced Computing Lab 2',
      building: 'Engineering Block',
      floor: '2nd Floor',
      roomNumber: '204',
      description: 'High-performance computing laboratory with 60 workstations',
    },
    {
      code: 'ADM-BLD-G01',
      name: 'Administrative Reception & Office',
      building: 'Administration Block',
      floor: 'Ground Floor',
      roomNumber: 'G01',
      description: 'Central administrative office and registrar inquiry',
    },
    {
      code: 'LIB-BLD-301',
      name: 'Central University Library - Reading Wing',
      building: 'Central Library',
      floor: '3rd Floor',
      roomNumber: '301',
      description: 'Quiet study hall with central climate control and ambient lighting',
    },
    {
      code: 'HST-BLK-B2',
      name: 'Boys Hostel B - Common Study Room',
      building: 'Hostel Block B',
      floor: '2nd Floor',
      roomNumber: '204',
      description: 'Hostel recreational and study lounge with split AC unit',
    },
    {
      code: 'PWR-YRD-01',
      name: 'Main Campus Power Substation & Generator Yard',
      building: 'Utility Yard',
      floor: 'Ground',
      roomNumber: 'GEN-YARD',
      description: 'Primary diesel generator and electrical distribution panel',
    },
  ];

  const seededLocations: Record<string, any> = {};
  for (const loc of locationsData) {
    const location = await prisma.location.upsert({
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
    seededLocations[loc.code] = location;
    console.log(`  📍 Seeded Location: ${location.code} - ${location.name}`);
  }

  // 3. Seed Asset Categories
  const categoriesData = [
    {
      code: 'HVAC',
      name: 'Heating, Ventilation & Air Conditioning',
      description: 'Air conditioners, chillers, AHUs, and exhaust systems',
      defaultMaintenanceIntervalDays: 90,
    },
    {
      code: 'ELECTRICAL',
      name: 'Electrical Infrastructure',
      description: 'Generators, UPS, distribution boards, transformers, and switchgear',
      defaultMaintenanceIntervalDays: 60,
    },
    {
      code: 'IT_HARDWARE',
      name: 'IT & AV Equipment',
      description: 'Projectors, digital podiums, servers, switches, and workstations',
      defaultMaintenanceIntervalDays: 120,
    },
    {
      code: 'LAB_EQUIP',
      name: 'Laboratory Equipment',
      description: 'Oscilloscopes, microscopes, hydraulic test rigs, and centrifuges',
      defaultMaintenanceIntervalDays: 90,
    },
    {
      code: 'PLUMBING',
      name: 'Plumbing & Water Systems',
      description: 'Submersible water pumps, RO purifiers, and pipeline manifolds',
      defaultMaintenanceIntervalDays: 45,
    },
  ];

  const seededCategories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const category = await prisma.assetCategory.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        description: cat.description,
        defaultMaintenanceIntervalDays: cat.defaultMaintenanceIntervalDays,
      },
      create: cat,
    });
    seededCategories[cat.code] = category;
    console.log(`  🏷️ Seeded Category: ${category.code} - ${category.name}`);
  }

  // 4. Seed Campus Assets (18 comprehensive assets)
  const assetsData = [
    {
      assetTag: 'AST-AC-ENG-101',
      name: 'Daikin 2.0 Ton Inverter Split AC',
      description: 'Primary cooling unit in Lecture Hall 101',
      categoryCode: 'HVAC',
      locationCode: 'ENG-BLD-101',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.HIGH,
      conditionRating: 4,
      serialNumber: 'DK-2024-88412',
      manufacturer: 'Daikin',
      model: 'FTKF60TV16U',
      installationDate: new Date('2024-03-15'),
      warrantyExpiry: new Date('2027-03-15'),
      qrIdentifier: 'fixflow://assets/AST-AC-ENG-101',
    },
    {
      assetTag: 'AST-PRJ-ENG-101',
      name: 'Epson EB-2250U WUXGA Projector',
      description: 'Ceiling-mounted 5000 Lumens classroom projector',
      categoryCode: 'IT_HARDWARE',
      locationCode: 'ENG-BLD-101',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.MEDIUM,
      conditionRating: 5,
      serialNumber: 'EPS-2023-99411',
      manufacturer: 'Epson',
      model: 'EB-2250U',
      installationDate: new Date('2023-08-10'),
      warrantyExpiry: new Date('2026-08-10'),
      qrIdentifier: 'fixflow://assets/AST-PRJ-ENG-101',
    },
    {
      assetTag: 'AST-AC-LAB-204',
      name: 'Carrier 3.0 Ton Cassette Air Conditioner',
      description: 'Central cassette unit for Computing Lab 2 server cluster',
      categoryCode: 'HVAC',
      locationCode: 'ENG-LAB-204',
      status: AssetStatus.UNDER_MAINTENANCE,
      criticality: Criticality.CRITICAL,
      conditionRating: 3,
      serialNumber: 'CAR-2022-77140',
      manufacturer: 'Carrier',
      model: '40KMC036',
      installationDate: new Date('2022-06-20'),
      warrantyExpiry: new Date('2025-06-20'),
      qrIdentifier: 'fixflow://assets/AST-AC-LAB-204',
    },
    {
      assetTag: 'AST-SW-LAB-204',
      name: 'Cisco Catalyst 3850 48-Port PoE Switch',
      description: 'Core aggregation network switch rack for Lab 2',
      categoryCode: 'IT_HARDWARE',
      locationCode: 'ENG-LAB-204',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.CRITICAL,
      conditionRating: 5,
      serialNumber: 'CSCO-2023-44129',
      manufacturer: 'Cisco Systems',
      model: 'WS-C3850-48P-L',
      installationDate: new Date('2023-01-14'),
      warrantyExpiry: new Date('2028-01-14'),
      qrIdentifier: 'fixflow://assets/AST-SW-LAB-204',
    },
    {
      assetTag: 'AST-GEN-YRD-01',
      name: 'Cummins 250 kVA Silent Diesel Generator',
      description: 'Campus emergency backup power generation unit',
      categoryCode: 'ELECTRICAL',
      locationCode: 'PWR-YRD-01',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.CRITICAL,
      conditionRating: 5,
      serialNumber: 'CUM-2021-00412',
      manufacturer: 'Cummins India',
      model: 'C250D5P',
      installationDate: new Date('2021-11-05'),
      warrantyExpiry: new Date('2026-11-05'),
      qrIdentifier: 'fixflow://assets/AST-GEN-YRD-01',
    },
    {
      assetTag: 'AST-UPS-ADM-G01',
      name: 'APC Smart-UPS RT 10kVA On-Line UPS',
      description: 'Administration server and inquiry terminal backup',
      categoryCode: 'ELECTRICAL',
      locationCode: 'ADM-BLD-G01',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.HIGH,
      conditionRating: 4,
      serialNumber: 'APC-2023-33120',
      manufacturer: 'Schneider Electric',
      model: 'SURT10000UXI',
      installationDate: new Date('2023-04-12'),
      warrantyExpiry: new Date('2026-04-12'),
      qrIdentifier: 'fixflow://assets/AST-UPS-ADM-G01',
    },
    {
      assetTag: 'AST-AC-LIB-301',
      name: 'Voltas 2.0 Ton Ductable Split AC Unit',
      description: 'Quiet library reading wing climate control unit A',
      categoryCode: 'HVAC',
      locationCode: 'LIB-BLD-301',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.MEDIUM,
      conditionRating: 4,
      serialNumber: 'VOLT-2023-66231',
      manufacturer: 'Voltas',
      model: 'VDS-242',
      installationDate: new Date('2023-09-01'),
      warrantyExpiry: new Date('2026-09-01'),
      qrIdentifier: 'fixflow://assets/AST-AC-LIB-301',
    },
    {
      assetTag: 'AST-AC-HST-B204',
      name: 'Voltas 1.5 Ton Split AC Unit',
      description: 'Hostel Block B room 204 study lounge unit',
      categoryCode: 'HVAC',
      locationCode: 'HST-BLK-B2',
      status: AssetStatus.OUT_OF_SERVICE,
      criticality: Criticality.MEDIUM,
      conditionRating: 2,
      serialNumber: 'VOLT-2022-55102',
      manufacturer: 'Voltas',
      model: '183V-CZQ',
      installationDate: new Date('2022-02-18'),
      warrantyExpiry: new Date('2025-02-18'),
      qrIdentifier: 'fixflow://assets/AST-AC-HST-B204',
    },
    {
      assetTag: 'AST-PMP-PWR-01',
      name: 'Kirloskar 15 HP Multistage Water Pump',
      description: 'Main campus overhead water reservoir lifting pump',
      categoryCode: 'PLUMBING',
      locationCode: 'PWR-YRD-01',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.CRITICAL,
      conditionRating: 4,
      serialNumber: 'KIRL-2022-88129',
      manufacturer: 'Kirloskar Brothers',
      model: 'CH-15',
      installationDate: new Date('2022-05-15'),
      warrantyExpiry: new Date('2025-05-15'),
      qrIdentifier: 'fixflow://assets/AST-PMP-PWR-01',
    },
    {
      assetTag: 'AST-OSC-LAB-204',
      name: 'Tektronix 200MHz 4-Channel Digital Oscilloscope',
      description: 'Hardware debugging and signal testing workstation',
      categoryCode: 'LAB_EQUIP',
      locationCode: 'ENG-LAB-204',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.MEDIUM,
      conditionRating: 5,
      serialNumber: 'TEK-2024-11029',
      manufacturer: 'Tektronix',
      model: 'TBS2204B',
      installationDate: new Date('2024-01-20'),
      warrantyExpiry: new Date('2027-01-20'),
      qrIdentifier: 'fixflow://assets/AST-OSC-LAB-204',
    },
    {
      assetTag: 'AST-RO-ENG-101',
      name: 'Kent Commercial 50 LPH RO Water Purifier',
      description: 'Drinking water dispenser unit on Engineering Block 1st floor',
      categoryCode: 'PLUMBING',
      locationCode: 'ENG-BLD-101',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.HIGH,
      conditionRating: 4,
      serialNumber: 'KENT-2023-44910',
      manufacturer: 'Kent RO Systems',
      model: 'Elite Plus 50L',
      installationDate: new Date('2023-10-12'),
      warrantyExpiry: new Date('2025-10-12'),
      qrIdentifier: 'fixflow://assets/AST-RO-ENG-101',
    },
    {
      assetTag: 'AST-RO-HST-B2',
      name: 'Commercial RO Drinking Water Unit (Hostel)',
      description: 'Hostel Block B residential drinking water plant',
      categoryCode: 'PLUMBING',
      locationCode: 'HST-BLK-B2',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.HIGH,
      conditionRating: 4,
      serialNumber: 'KENT-2023-44919',
      manufacturer: 'Kent RO Systems',
      model: 'Elite Plus 50L',
      installationDate: new Date('2023-11-01'),
      warrantyExpiry: new Date('2025-11-01'),
      qrIdentifier: 'fixflow://assets/AST-RO-HST-B2',
    },
    {
      assetTag: 'AST-POD-ENG-101',
      name: 'AHA Smart Interactive Digital Podium',
      description: 'Integrated touch display, microphone, and controller for Room 101',
      categoryCode: 'IT_HARDWARE',
      locationCode: 'ENG-BLD-101',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.LOW,
      conditionRating: 5,
      serialNumber: 'AHA-2024-11822',
      manufacturer: 'AHA Information & Telecom',
      model: 'ELF-72D',
      installationDate: new Date('2024-02-14'),
      warrantyExpiry: new Date('2026-02-14'),
      qrIdentifier: 'fixflow://assets/AST-POD-ENG-101',
    },
    {
      assetTag: 'AST-DB-ENG-101',
      name: 'Siemens 8-Way Three Phase Distribution Board',
      description: 'Floor sub-distribution panel for lighting and auxiliary power',
      categoryCode: 'ELECTRICAL',
      locationCode: 'ENG-BLD-101',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.CRITICAL,
      conditionRating: 4,
      serialNumber: 'SIEM-2022-99120',
      manufacturer: 'Siemens',
      model: 'Betagard 8W',
      installationDate: new Date('2022-04-10'),
      warrantyExpiry: new Date('2027-04-10'),
      qrIdentifier: 'fixflow://assets/AST-DB-ENG-101',
    },
    {
      assetTag: 'AST-PRJ-LIB-301',
      name: 'BenQ Presentation Projector (Library Seminar Room)',
      description: 'Short throw seminar room projection system',
      categoryCode: 'IT_HARDWARE',
      locationCode: 'LIB-BLD-301',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.MEDIUM,
      conditionRating: 4,
      serialNumber: 'BNQ-2023-77291',
      manufacturer: 'BenQ',
      model: 'MW855UST+',
      installationDate: new Date('2023-07-22'),
      warrantyExpiry: new Date('2026-07-22'),
      qrIdentifier: 'fixflow://assets/AST-PRJ-LIB-301',
    },
  ];

  for (const a of assetsData) {
    const category = seededCategories[a.categoryCode];
    const location = seededLocations[a.locationCode];

    const asset = await prisma.asset.upsert({
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
        installationDate: a.installationDate,
        warrantyExpiry: a.warrantyExpiry,
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
        installationDate: a.installationDate,
        warrantyExpiry: a.warrantyExpiry,
        qrIdentifier: a.qrIdentifier,
        categoryId: category.id,
        locationId: location.id,
      },
    });
    console.log(`  📦 Seeded Asset: ${asset.assetTag} - ${asset.name}`);
  }

  // 5. Initial Seed Audit Log
  const adminUser = seededUsers.find((u) => u.role === Role.ADMIN);
  await prisma.auditLog.create({
    data: {
      actorId: adminUser?.id,
      action: 'SYSTEM_SEEDED',
      entity: 'SYSTEM',
      entityId: 'ROOT',
      metadata: {
        message: 'FixFlow initial institutional dataset seeded successfully.',
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('✅ FixFlow database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
