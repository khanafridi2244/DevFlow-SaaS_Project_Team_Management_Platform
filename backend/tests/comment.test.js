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

async function setupOrgProjectTask() {
  const ownerAgent = await registerAndLogin(owner);
  const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
  const organizationId = orgRes.body.data.organization.id;

  const projectRes = await ownerAgent
    .post("/api/projects")
    .send({ organizationId, name: "E-Commerce Website" });
  const projectId = projectRes.body.data.project.id;

  const taskRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Create Product API" });
  const taskId = taskRes.body.data.task.id;

  const devAgent = await registerAndLogin(developer);
  await ownerAgent
    .post(`/api/organizations/${organizationId}/members`)
    .send({ email: developer.email, role: "DEVELOPER" });

  return { ownerAgent, devAgent, organizationId, projectId, taskId };
}

describe("Comment flow", () => {
  describe("POST /api/comments", () => {
    it("adds a comment to a task", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      const res = await ownerAgent
        .post("/api/comments")
        .send({ taskId, body: "API is almost complete." });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.body).toBe("API is almost complete.");
      expect(res.body.data.comment.author.email).toBe(owner.email);
    });

    it("rejects an empty comment body", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      const res = await ownerAgent.post("/api/comments").send({ taskId, body: "" });

      expect(res.status).toBe(400);
    });

    it("rejects a comment from a non-org-member", async () => {
      const { taskId } = await setupOrgProjectTask();
      const outsider = await registerAndLogin({
        email: "outsider@devflow.test",
        password: "StrongPass123",
        firstName: "Out",
        lastName: "Sider",
      });

      const res = await outsider.post("/api/comments").send({ taskId, body: "Sneaky comment" });

      expect(res.status).toBe(403);
    });

    it("logs an activity entry when a comment is added", async () => {
      const { ownerAgent, taskId, organizationId } = await setupOrgProjectTask();

      await ownerAgent.post("/api/comments").send({ taskId, body: "Please add validation." });

      const activity = await prisma.activity.findFirst({
        where: { organizationId, action: "COMMENT_ADDED" },
      });
      expect(activity).not.toBeNull();
      expect(activity.metadata.taskId).toBe(taskId);
    });

    it("notifies the task assignee when someone else comments", async () => {
      const { ownerAgent, devAgent, taskId, projectId } = await setupOrgProjectTask();
      const meRes = await devAgent.get("/api/auth/me");
      const devUserId = meRes.body.data.user.id;

      await ownerAgent.post(`/api/projects/${projectId}/members`).send({ userId: devUserId });
      await ownerAgent.patch(`/api/tasks/${taskId}`).send({ assigneeId: devUserId });

      await ownerAgent.post("/api/comments").send({ taskId, body: "Please review this." });

      const notifRes = await devAgent.get("/api/notifications");
      expect(notifRes.body.data.notifications.length).toBeGreaterThan(0);
      expect(notifRes.body.data.notifications[0].type).toBe("COMMENT_ADDED");
    });

    it("does NOT notify the comment author about their own comment", async () => {
      const { ownerAgent, taskId, projectId } = await setupOrgProjectTask();
      const meRes = await ownerAgent.get("/api/auth/me");
      const ownerUserId = meRes.body.data.user.id;

      await ownerAgent.patch(`/api/tasks/${taskId}`).send({ assigneeId: ownerUserId });
      await ownerAgent.post("/api/comments").send({ taskId, body: "Note to self." });

      const notifRes = await ownerAgent.get("/api/notifications");
      expect(notifRes.body.data.notifications).toHaveLength(0);
    });
  });

  describe("GET /api/comments", () => {
    it("lists comments for a task in chronological order", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      await ownerAgent.post("/api/comments").send({ taskId, body: "First comment" });
      await ownerAgent.post("/api/comments").send({ taskId, body: "Second comment" });

      const res = await ownerAgent.get("/api/comments").query({ taskId });

      expect(res.body.data.comments).toHaveLength(2);
      expect(res.body.data.comments[0].body).toBe("First comment");
      expect(res.body.data.comments[1].body).toBe("Second comment");
    });
  });

  describe("PATCH /api/comments/:commentId", () => {
    it("the author can edit their own comment", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();
      const createRes = await ownerAgent.post("/api/comments").send({ taskId, body: "Original text" });

      const res = await ownerAgent
        .patch(`/api/comments/${createRes.body.data.comment.id}`)
        .send({ body: "Edited text" });

      expect(res.status).toBe(200);
      expect(res.body.data.comment.body).toBe("Edited text");
    });

    it("a different user cannot edit someone else's comment", async () => {
      const { ownerAgent, devAgent, taskId } = await setupOrgProjectTask();
      const createRes = await ownerAgent.post("/api/comments").send({ taskId, body: "Owner's comment" });

      const res = await devAgent
        .patch(`/api/comments/${createRes.body.data.comment.id}`)
        .send({ body: "Hijacked!" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/comments/:commentId", () => {
    it("the author can delete their own comment", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();
      const createRes = await ownerAgent.post("/api/comments").send({ taskId, body: "Delete me" });

      const res = await ownerAgent.delete(`/api/comments/${createRes.body.data.comment.id}`);
      expect(res.status).toBe(200);

      const gone = await prisma.comment.findUnique({ where: { id: createRes.body.data.comment.id } });
      expect(gone).toBeNull();
    });

    it("a DEVELOPER cannot delete someone else's comment (not author, not admin)", async () => {
      const { ownerAgent, devAgent, taskId } = await setupOrgProjectTask();
      const createRes = await ownerAgent.post("/api/comments").send({ taskId, body: "Owner's comment" });

      const res = await devAgent.delete(`/api/comments/${createRes.body.data.comment.id}`);
      expect(res.status).toBe(403);
    });
  });
});