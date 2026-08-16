const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/config/prisma");

const owner = {
  email: "owner@devflow.test",
  password: "StrongPass123",
  firstName: "Sikandar",
  lastName: "Owner",
};

const otherUser = {
  email: "ali@devflow.test",
  password: "StrongPass123",
  firstName: "Ali",
  lastName: "Developer",
};

// Registers a user and returns an agent with cookies already set
async function registerAndLogin(user) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send(user);
  return agent;
}

describe("Organization flow", () => {
  describe("POST /api/organizations", () => {
    it("creates an organization and makes the creator OWNER", async () => {
      const agent = await registerAndLogin(owner);

      const res = await agent.post("/api/organizations").send({ name: "Brothers Software" });

      expect(res.status).toBe(201);
      expect(res.body.data.organization.name).toBe("Brothers Software");
      expect(res.body.data.organization.slug).toBe("brothers-software");

      const membership = await prisma.organizationMember.findFirst({
        where: { organizationId: res.body.data.organization.id },
      });
      expect(membership.role).toBe("OWNER");
    });

    it("generates a unique slug when names collide", async () => {
      const agent = await registerAndLogin(owner);

      const first = await agent.post("/api/organizations").send({ name: "Acme" });
      const second = await agent.post("/api/organizations").send({ name: "Acme" });

      expect(first.body.data.organization.slug).toBe("acme");
      expect(second.body.data.organization.slug).toBe("acme-2");
    });

    it("rejects an unauthenticated request", async () => {
      const res = await request(app).post("/api/organizations").send({ name: "No Auth Co" });
      expect(res.status).toBe(401);
    });

    it("rejects a name that's too short", async () => {
      const agent = await registerAndLogin(owner);
      const res = await agent.post("/api/organizations").send({ name: "A" });
      expect(res.status).toBe(400);
    });

    it("also creates a FREE subscription for the new organization", async () => {
      const agent = await registerAndLogin(owner);
      const res = await agent.post("/api/organizations").send({ name: "Brothers Clothes" });

      const subscription = await prisma.subscription.findUnique({
        where: { organizationId: res.body.data.organization.id },
      });
      expect(subscription.plan).toBe("FREE");
      expect(subscription.seats).toBe(5);
    });
  });

  describe("GET /api/organizations", () => {
    it("lists only organizations the user belongs to", async () => {
      const agent = await registerAndLogin(owner);
      await agent.post("/api/organizations").send({ name: "Org One" });
      await agent.post("/api/organizations").send({ name: "Org Two" });

      const otherAgent = await registerAndLogin(otherUser);
      await otherAgent.post("/api/organizations").send({ name: "Someone Else's Org" });

      const res = await agent.get("/api/organizations");

      expect(res.status).toBe(200);
      expect(res.body.data.organizations).toHaveLength(2);
      const names = res.body.data.organizations.map((o) => o.name);
      expect(names).not.toContain("Someone Else's Org");
    });
  });

  describe("Member invites and RBAC", () => {
    async function createOrgAsOwner() {
      const ownerAgent = await registerAndLogin(owner);
      const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
      return { ownerAgent, organizationId: orgRes.body.data.organization.id };
    }

    it("OWNER can invite an existing user as DEVELOPER", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();
      await registerAndLogin(otherUser); // must exist first (Phase 1 constraint)

      const res = await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "DEVELOPER" });

      expect(res.status).toBe(201);
      expect(res.body.data.membership.role).toBe("DEVELOPER");
    });

    it("rejects inviting an email with no DevFlow account", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();

      const res = await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: "ghost@devflow.test", role: "DEVELOPER" });

      expect(res.status).toBe(404);
    });

    it("rejects inviting someone who's already a member", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();
      await registerAndLogin(otherUser);

      await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "DEVELOPER" });

      const res = await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "VIEWER" });

      expect(res.status).toBe(409);
    });

    it("a DEVELOPER cannot invite other members (insufficient role)", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();
      const devAgent = await registerAndLogin(otherUser);

      await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "DEVELOPER" });

      const thirdUser = {
        email: "ahmad@devflow.test",
        password: "StrongPass123",
        firstName: "Ahmad",
        lastName: "Usman",
      };
      await registerAndLogin(thirdUser);

      const res = await devAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: thirdUser.email, role: "VIEWER" });

      expect(res.status).toBe(403);
    });

it("a non-member cannot access the organization's member list", async () => {
      const { organizationId } = await createOrgAsOwner();
      const strangerAgent = await registerAndLogin(otherUser);

      const res = await strangerAgent.get(`/api/organizations/${organizationId}`);

      expect(res.status).toBe(403);
    });

    it("a member (even VIEWER) CAN access the organization's member list", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();
      const memberAgent = await registerAndLogin(otherUser);

      await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "VIEWER" });

      const res = await memberAgent.get(`/api/organizations/${organizationId}`);

      expect(res.status).toBe(200);
    });

    it("OWNER can update a member's role", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();
      await registerAndLogin(otherUser);

      const inviteRes = await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "DEVELOPER" });

      const memberId = inviteRes.body.data.membership.id;

      const res = await ownerAgent
        .patch(`/api/organizations/${organizationId}/members/${memberId}`)
        .send({ role: "MANAGER" });

      expect(res.status).toBe(200);
      expect(res.body.data.membership.role).toBe("MANAGER");
    });

    it("cannot promote a member directly to OWNER via this endpoint", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();
      await registerAndLogin(otherUser);

      const inviteRes = await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "DEVELOPER" });

      const res = await ownerAgent
        .patch(`/api/organizations/${organizationId}/members/${inviteRes.body.data.membership.id}`)
        .send({ role: "OWNER" });

      expect(res.status).toBe(400);
    });

    it("cannot remove the organization OWNER", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();

      const ownerMembership = await prisma.organizationMember.findFirst({
        where: { organizationId, role: "OWNER" },
      });

      const res = await ownerAgent.delete(
        `/api/organizations/${organizationId}/members/${ownerMembership.id}`
      );

      expect(res.status).toBe(400);
    });

    it("OWNER can remove a regular member", async () => {
      const { ownerAgent, organizationId } = await createOrgAsOwner();
      await registerAndLogin(otherUser);

      const inviteRes = await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "DEVELOPER" });

      const res = await ownerAgent.delete(
        `/api/organizations/${organizationId}/members/${inviteRes.body.data.membership.id}`
      );

      expect(res.status).toBe(200);

      const stillExists = await prisma.organizationMember.findUnique({
        where: { id: inviteRes.body.data.membership.id },
      });
      expect(stillExists).toBeNull();
    });
  });

  describe("DELETE /api/organizations/:organizationId", () => {
    it("only OWNER can delete the organization", async () => {
      const ownerAgent = await registerAndLogin(owner);
      const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Doomed Org" });
      const organizationId = orgRes.body.data.organization.id;

      const devAgent = await registerAndLogin(otherUser);
      await ownerAgent
        .post(`/api/organizations/${organizationId}/members`)
        .send({ email: otherUser.email, role: "ADMIN" });

      // Even an ADMIN cannot delete — only OWNER
      const deniedRes = await devAgent.delete(`/api/organizations/${organizationId}`);
      expect(deniedRes.status).toBe(403);

      const res = await ownerAgent.delete(`/api/organizations/${organizationId}`);
      expect(res.status).toBe(200);

      const deleted = await prisma.organization.findUnique({ where: { id: organizationId } });
      expect(deleted).toBeNull();
    });
  });
});