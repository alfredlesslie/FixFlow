const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const assets = await prisma.asset.count();
  const locations = await prisma.location.count();
  console.log(`[FixFlow DB Success] Connected! Users: ${users}, Assets: ${assets}, Locations: ${locations}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
