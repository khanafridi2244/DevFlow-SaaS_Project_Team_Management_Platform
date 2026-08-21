const { prisma } = require("../src/config/prisma");

async function cleanDatabase() {
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
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