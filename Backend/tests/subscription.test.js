const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/config/prisma");

const owner = {
  email: "owner@devflow.test",
  password: "StrongPass123",
  firstName: "Sikandar",
  lastName: "Owner",
};

async function registerAndLogin(user) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send(user);
  return agent;
}

async function setupOrg() {
  const ownerAgent = await registerAndLogin(owner);
  const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
  return { ownerAgent, organizationId: orgRes.body.data.organization.id };
}

describe("Subscriptions", () => {
  describe("GET /api/subscriptions/:organizationId", () => {
    it("returns FREE plan by default for a new org", async () => {
      const { ownerAgent, organizationId } = await setupOrg();

      const res = await ownerAgent.get(`/api/subscriptions/${organizationId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.plan).toBe("FREE");
      expect(res.body.data.subscription.seats).toBe(5);
      expect(res.body.data.limits).toEqual({ maxProjects: 2, maxMembers: 5, maxTasks: 100 });
    });
  });

  describe("Plan limit enforcement", () => {
    it("blocks creating a 3rd project on FREE plan", async () => {
      const { ownerAgent, organizationId } = await setupOrg();

      await ownerAgent.post("/api/projects").send({ organizationId, name: "Project One" });
      await ownerAgent.post("/api/projects").send({ organizationId, name: "Project Two" });

      const res = await ownerAgent
        .post("/api/projects")
        .send({ organizationId, name: "Project Three" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/FREE plan allows up to 2 projects/);
    });

    it("allows unlimited projects on PRO plan", async () => {
      const { ownerAgent, organizationId } = await setupOrg();

      await ownerAgent.patch(`/api/subscriptions/${organizationId}`).send({ plan: "PRO" });

      await ownerAgent.post("/api/projects").send({ organizationId, name: "Project One" });
      await ownerAgent.post("/api/projects").send({ organizationId, name: "Project Two" });
      const res = await ownerAgent
        .post("/api/projects")
        .send({ organizationId, name: "Project Three" });

      expect(res.status).toBe(201);
    });

    it("blocks inviting a 6th member on FREE plan", async () => {
      const { ownerAgent, organizationId } = await setupOrg();

      // Owner counts as member #1, so 4 more invites hits the 5-seat limit
      for (let i = 1; i <= 4; i++) {
        const invitee = {
          email: `member${i}@devflow.test`,
          password: "StrongPass123",
          firstName: `Member${i}`,
          lastName: "Test",
        };
        await registerAndLogin(invitee);
        await ownerAgent
          .post(`/api/organizations/${organizationId}/members`)
          .send({ email: invitee.email, role: "DEVELOPER" });
      }

      const sixthUser = {
        email: "member5@devflow.test",
        password: "StrongPass123",
        firstName: "Member5",
        lastName: "Test",
      };
      await registerAndLogin(sixthUser);

      const res = await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: sixthUser.email, role: "DEVELOPER" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/FREE plan allows up to 5 members/);
    });

    it("blocks creating a 101st task on FREE plan", async () => {
      const { ownerAgent, organizationId } = await setupOrg();
      const projectRes = await ownerAgent
        .post("/api/projects")
        .send({ organizationId, name: "Task Farm" });
      const projectId = projectRes.body.data.project.id;

      // Directly seed 100 tasks via Prisma rather than 100 HTTP calls —
      // this test is about the limit check, not re-testing task creation
      // itself, so skipping straight to "the DB already has 100" keeps
      // this fast without weakening what it verifies.
      const meRes = await ownerAgent.get("/api/auth/me");
      const userId = meRes.body.data.user.id;

      await prisma.task.createMany({
        data: Array.from({ length: 100 }, (_, i) => ({
          projectId,
          title: `Task ${i}`,
          createdById: userId,
        })),
      });

      const res = await ownerAgent
        .post("/api/tasks")
        .send({ projectId, title: "One Too Many" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/FREE plan allows up to 100 tasks/);
    }, 15000);
  });

  describe("PATCH /api/subscriptions/:organizationId", () => {
    it("OWNER can change the plan", async () => {
      const { ownerAgent, organizationId } = await setupOrg();

      const res = await ownerAgent.patch(`/api/subscriptions/${organizationId}`).send({ plan: "PRO" });

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.plan).toBe("PRO");
    });

    it("a non-OWNER cannot change the plan", async () => {
      const { ownerAgent, organizationId } = await setupOrg();
      const developer = {
        email: "ali@devflow.test",
        password: "StrongPass123",
        firstName: "Ali",
        lastName: "Developer",
      };
      const devAgent = await registerAndLogin(developer);
      await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: developer.email, role: "ADMIN" });

      const res = await devAgent.patch(`/api/subscriptions/${organizationId}`).send({ plan: "PRO" });

      expect(res.status).toBe(403);
    });

    it("rejects an invalid plan value", async () => {
      const { ownerAgent, organizationId } = await setupOrg();

      const res = await ownerAgent
        .patch(`/api/subscriptions/${organizationId}`)
        .send({ plan: "SUPER_DELUXE" });

      expect(res.status).toBe(400);
    });
  });
});