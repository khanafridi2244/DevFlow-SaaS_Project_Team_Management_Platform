const { prisma } = require("../src/config/prisma");

// Wipe tables touched by Phase 1 tests before each test, in FK-safe order
async function cleanDatabase() {
  await prisma.organizationMember.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});