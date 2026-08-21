const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/config/prisma");

const owner = {
  email: "owner@devflow.test",
  password: "StrongPass123",
  firstName: "Sikandar",
  lastName: "Owner",
};

const developer = {
  email: "ali@devflow.test",
  password: "StrongPass123",
  firstName: "Ali",
  lastName: "Developer",
};

async function registerAndLogin(user) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send(user);
  return agent;
}

// Sets up: an org (owner), a project inside it, and a second user
// who is an org member but NOT yet a project member — useful for
// testing the "assignee must be a project member" rule.
async function setupOrgAndProject() {
  const ownerAgent = await registerAndLogin(owner);
  const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
  const organizationId = orgRes.body.data.organization.id;

  const projectRes = await ownerAgent
    .post("/api/projects")
    .send({ organizationId, name: "E-Commerce Website" });
  const projectId = projectRes.body.data.project.id;

  const devAgent = await registerAndLogin(developer);
  await ownerAgent
    .post(`/api/organizations/${organizationId}/members`)
    .send({ email: developer.email, role: "DEVELOPER" });

  return { ownerAgent, devAgent, organizationId, projectId };
}

describe("Task flow", () => {
  describe("POST /api/tasks", () => {
    it("creates a task in a project", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();

      const res = await ownerAgent.post("/api/tasks").send({
        projectId,
        title: "Design Homepage",
        priority: "HIGH",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.task.title).toBe("Design Homepage");
      expect(res.body.data.task.status).toBe("TODO"); // default
      expect(res.body.data.task.priority).toBe("HIGH");
    });

    it("defaults priority to MEDIUM when not provided", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();

      const res = await ownerAgent.post("/api/tasks").send({ projectId, title: "Create Navbar" });

      expect(res.body.data.task.priority).toBe("MEDIUM");
    });

    it("rejects a task for a non-member of the project's organization", async () => {
      const { projectId } = await setupOrgAndProject();
      const outsider = await registerAndLogin({
        email: "outsider@devflow.test",
        password: "StrongPass123",
        firstName: "Out",
        lastName: "Sider",
      });

      const res = await outsider.post("/api/tasks").send({ projectId, title: "Sneaky Task" });

      expect(res.status).toBe(403);
    });

    it("rejects assigning a task to someone who isn't a project member yet", async () => {
      const { ownerAgent, devAgent, projectId } = await setupOrgAndProject();
      const meRes = await devAgent.get("/api/auth/me");
      const devUserId = meRes.body.data.user.id;

      // devAgent is an ORG member but was never added to the PROJECT
      const res = await ownerAgent
        .post("/api/tasks")
        .send({ projectId, title: "Product API", assigneeId: devUserId });

      expect(res.status).toBe(400);
    });

    it("allows assigning a task once the assignee is a project member", async () => {
      const { ownerAgent, devAgent, projectId } = await setupOrgAndProject();
      const meRes = await devAgent.get("/api/auth/me");
      const devUserId = meRes.body.data.user.id;

      await ownerAgent.post(`/api/projects/${projectId}/members`).send({ userId: devUserId });

      const res = await ownerAgent
        .post("/api/tasks")
        .send({ projectId, title: "Product API", assigneeId: devUserId });

      expect(res.status).toBe(201);
      expect(res.body.data.task.assignee.id).toBe(devUserId);
    });

    it("creates a task with labels", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();

      const res = await ownerAgent
        .post("/api/tasks")
        .send({ projectId, title: "Cart API", labels: ["Backend", "API"] });

      expect(res.status).toBe(201);
      expect(res.body.data.task.labels).toHaveLength(2);
      const labelNames = res.body.data.task.labels.map((l) => l.name);
      expect(labelNames).toEqual(expect.arrayContaining(["Backend", "API"]));
    });
  });

  describe("GET /api/tasks (filtering)", () => {
    it("filters tasks by status and priority", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();

      const t1 = await ownerAgent
        .post("/api/tasks")
        .send({ projectId, title: "Login API", priority: "HIGH" });
      await ownerAgent.post("/api/tasks").send({ projectId, title: "Register API", priority: "LOW" });

      await ownerAgent.patch(`/api/tasks/${t1.body.data.task.id}/status`).send({ status: "IN_PROGRESS" });

      const res = await ownerAgent
        .get("/api/tasks")
        .query({ projectId, status: "IN_PROGRESS", priority: "HIGH" });

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].title).toBe("Login API");
    });

    it("filters tasks by search text", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();

      await ownerAgent.post("/api/tasks").send({ projectId, title: "Implement Checkout" });
      await ownerAgent.post("/api/tasks").send({ projectId, title: "Design Homepage" });

      const res = await ownerAgent.get("/api/tasks").query({ projectId, search: "checkout" });

      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].title).toBe("Implement Checkout");
    });
  });

  describe("PATCH /api/tasks/:taskId/status (Kanban)", () => {
    it("moves a task through TODO -> IN_PROGRESS -> DONE", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();
      const createRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Login" });
      const taskId = createRes.body.data.task.id;

      const step1 = await ownerAgent.patch(`/api/tasks/${taskId}/status`).send({ status: "IN_PROGRESS" });
      expect(step1.body.data.task.status).toBe("IN_PROGRESS");

      const step2 = await ownerAgent.patch(`/api/tasks/${taskId}/status`).send({ status: "DONE" });
      expect(step2.body.data.task.status).toBe("DONE");
    });

    it("rejects an invalid status value", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();
      const createRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Login" });

      const res = await ownerAgent
        .patch(`/api/tasks/${createRes.body.data.task.id}/status`)
        .send({ status: "NOT_A_REAL_STATUS" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/tasks/:taskId", () => {
    it("the task creator can delete their own task", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();
      const createRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Temp Task" });

      const res = await ownerAgent.delete(`/api/tasks/${createRes.body.data.task.id}`);
      expect(res.status).toBe(200);

      const gone = await prisma.task.findUnique({ where: { id: createRes.body.data.task.id } });
      expect(gone).toBeNull();
    });

    it("a DEVELOPER cannot delete someone else's task", async () => {
      const { ownerAgent, devAgent, projectId } = await setupOrgAndProject();
      const createRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Owner's Task" });

      const res = await devAgent.delete(`/api/tasks/${createRes.body.data.task.id}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Labels", () => {
    it("adds and removes a label from a task", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();
      const createRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Checkout Flow" });
      const taskId = createRes.body.data.task.id;

      const addRes = await ownerAgent
        .post(`/api/tasks/${taskId}/labels`)
        .send({ name: "MongoDB", color: "#47A248" });
      expect(addRes.status).toBe(201);

      const removeRes = await ownerAgent.delete(`/api/tasks/${taskId}/labels/${addRes.body.data.label.id}`);
      expect(removeRes.status).toBe(200);

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { labels: true },
      });
      expect(task.labels).toHaveLength(0);
    });
  });
});