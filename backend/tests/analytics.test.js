const request = require("supertest");
const { app } = require("../src/app");

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

async function setupOrgWithTasks() {
  const ownerAgent = await registerAndLogin(owner);
  const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
  const organizationId = orgRes.body.data.organization.id;

  const projectRes = await ownerAgent
    .post("/api/projects")
    .send({ organizationId, name: "E-Commerce Website" });
  const projectId = projectRes.body.data.project.id;

  const devAgent = await registerAndLogin(developer);
  const devMeRes = await devAgent.get("/api/auth/me");
  const devUserId = devMeRes.body.data.user.id;

  await ownerAgent
    .post(`/api/organizations/${organizationId}/members`)
    .send({ email: developer.email, role: "DEVELOPER" });
  await ownerAgent.post(`/api/projects/${projectId}/members`).send({ userId: devUserId });

  // Create a spread of tasks: different priorities, statuses, assignees
  const t1 = await ownerAgent
    .post("/api/tasks")
    .send({ projectId, title: "Design Homepage", priority: "HIGH", assigneeId: devUserId });
  const t2 = await ownerAgent
    .post("/api/tasks")
    .send({ projectId, title: "Create Product API", priority: "MEDIUM" });
  const t3 = await ownerAgent
    .post("/api/tasks")
    .send({ projectId, title: "Implement Checkout", priority: "LOW" });
  const t4 = await ownerAgent
    .post("/api/tasks")
    .send({ projectId, title: "Payment API", priority: "URGENT", assigneeId: devUserId });

  // Move some through the pipeline
  await ownerAgent.patch(`/api/tasks/${t1.body.data.task.id}/status`).send({ status: "DONE" });
  await ownerAgent.patch(`/api/tasks/${t2.body.data.task.id}/status`).send({ status: "IN_PROGRESS" });

  // Overdue: due date in the past, not yet done
  await ownerAgent
    .patch(`/api/tasks/${t3.body.data.task.id}`)
    .send({ dueDate: "2020-01-01T00:00:00.000Z" });

  return { ownerAgent, devAgent, organizationId, projectId, devUserId };
}

describe("Analytics", () => {
  describe("GET /api/analytics/:organizationId/overview", () => {
    it("returns correct total/completed/in-progress/overdue counts", async () => {
      const { ownerAgent, organizationId } = await setupOrgWithTasks();

      const res = await ownerAgent.get(`/api/analytics/${organizationId}/overview`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalTasks).toBe(4);
      expect(res.body.data.completedTasks).toBe(1);
      expect(res.body.data.inProgressTasks).toBe(1);
      expect(res.body.data.overdueTasks).toBe(1);
    });

    it("rejects a non-member of the organization", async () => {
      const { organizationId } = await setupOrgWithTasks();
      const outsider = await registerAndLogin({
        email: "outsider@devflow.test",
        password: "StrongPass123",
        firstName: "Out",
        lastName: "Sider",
      });

      const res = await outsider.get(`/api/analytics/${organizationId}/overview`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/analytics/:organizationId/tasks-by-priority", () => {
    it("groups tasks by priority, including zero-count priorities", async () => {
      const { ownerAgent, organizationId } = await setupOrgWithTasks();

      const res = await ownerAgent.get(`/api/analytics/${organizationId}/tasks-by-priority`);

      expect(res.status).toBe(200);
      expect(res.body.data.byPriority).toEqual({
        LOW: 1,
        MEDIUM: 1,
        HIGH: 1,
        URGENT: 1,
      });
    });
  });

  describe("GET /api/analytics/:organizationId/tasks-by-status", () => {
    it("groups tasks by status, including zero-count statuses", async () => {
      const { ownerAgent, organizationId } = await setupOrgWithTasks();

      const res = await ownerAgent.get(`/api/analytics/${organizationId}/tasks-by-status`);

      expect(res.status).toBe(200);
      expect(res.body.data.byStatus).toEqual({
        TODO: 2,
        IN_PROGRESS: 1,
        IN_REVIEW: 0,
        DONE: 1,
      });
    });
  });

  describe("GET /api/analytics/:organizationId/team-workload", () => {
    it("reports active and completed task counts per member", async () => {
      const { ownerAgent, organizationId, devUserId } = await setupOrgWithTasks();

      const res = await ownerAgent.get(`/api/analytics/${organizationId}/team-workload`);

      expect(res.status).toBe(200);
      const devEntry = res.body.data.workload.find((w) => w.user.id === devUserId);
      expect(devEntry.activeTaskCount).toBe(1); // Payment API (URGENT, not done)
      expect(devEntry.completedTaskCount).toBe(1); // Design Homepage (DONE)
    });
  });

  describe("GET /api/analytics/:organizationId/project-progress", () => {
    it("calculates percent complete per project", async () => {
      const { ownerAgent, organizationId } = await setupOrgWithTasks();

      const res = await ownerAgent.get(`/api/analytics/${organizationId}/project-progress`);

      expect(res.status).toBe(200);
      expect(res.body.data.progress).toHaveLength(1);
      expect(res.body.data.progress[0].totalTasks).toBe(4);
      expect(res.body.data.progress[0].completedTasks).toBe(1);
      expect(res.body.data.progress[0].percentComplete).toBe(25); // 1/4 = 25%
    });

    it("returns 0% for a project with no tasks", async () => {
      const { ownerAgent, organizationId } = await setupOrgWithTasks();
      await ownerAgent.post("/api/projects").send({ organizationId, name: "Empty Project" });

      const res = await ownerAgent.get(`/api/analytics/${organizationId}/project-progress`);

      const empty = res.body.data.progress.find((p) => p.projectName === "Empty Project");
      expect(empty.percentComplete).toBe(0);
    });
  });

  describe("GET /api/analytics/:organizationId/completed-per-week", () => {
    it("returns a week-by-week series with zero-filled gaps", async () => {
      const { ownerAgent, organizationId } = await setupOrgWithTasks();

      const res = await ownerAgent
        .get(`/api/analytics/${organizationId}/completed-per-week`)
        .query({ weeks: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.series).toHaveLength(4);
      const totalCompleted = res.body.data.series.reduce((sum, w) => sum + w.count, 0);
      expect(totalCompleted).toBe(1); // the one DONE task, in the current week
    });
  });
});