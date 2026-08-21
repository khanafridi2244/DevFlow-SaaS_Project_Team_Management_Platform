jest.mock("../src/config/anthropic", () => ({
  getClient: jest.fn(),
}));

const request = require("supertest");
const { app } = require("../src/app");
const { getClient } = require("../src/config/anthropic");

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

async function setupOrgAndProject() {
  const ownerAgent = await registerAndLogin(owner);
  const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
  const organizationId = orgRes.body.data.organization.id;
  const projectRes = await ownerAgent
    .post("/api/projects")
    .send({ organizationId, name: "E-Commerce Website" });
  return { ownerAgent, organizationId, projectId: projectRes.body.data.project.id };
}

function mockClaudeResponse(jsonPayload) {
  getClient.mockReturnValue({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(jsonPayload) }],
      }),
    },
  });
}

describe("AI Assistant", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/ai/generate-plan", () => {
    it("returns a structured project plan", async () => {
      const { ownerAgent, organizationId } = await setupOrgAndProject();
      mockClaudeResponse({
        phases: [
          { name: "Requirements", tasks: ["Gather requirements", "Define user roles"] },
          { name: "Backend", tasks: ["Auth API", "Product API"] },
        ],
      });

      const res = await ownerAgent
        .post("/api/ai/generate-plan")
        .send({ organizationId, description: "Build an e-commerce website" });

      expect(res.status).toBe(200);
      expect(res.body.data.phases).toHaveLength(2);
      expect(res.body.data.phases[0].name).toBe("Requirements");
    });

    it("returns a clear error when AI is not configured", async () => {
      getClient.mockReturnValue(null);
      const { ownerAgent, organizationId } = await setupOrgAndProject();

      const res = await ownerAgent
        .post("/api/ai/generate-plan")
        .send({ organizationId, description: "Build an e-commerce website" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not configured/);
    });

    it("rejects a non-member of the organization", async () => {
      const { organizationId } = await setupOrgAndProject();
      mockClaudeResponse({ phases: [] });
      const outsider = await registerAndLogin({
        email: "outsider@devflow.test",
        password: "StrongPass123",
        firstName: "Out",
        lastName: "Sider",
      });

      const res = await outsider
        .post("/api/ai/generate-plan")
        .send({ organizationId, description: "Build something" });

      expect(res.status).toBe(403);
    });

    it("handles a malformed AI response gracefully", async () => {
      const { ownerAgent, organizationId } = await setupOrgAndProject();
      getClient.mockReturnValue({
        messages: {
          create: jest
            .fn()
            .mockResolvedValue({ content: [{ type: "text", text: "not valid json at all" }] }),
        },
      });

      const res = await ownerAgent
        .post("/api/ai/generate-plan")
        .send({ organizationId, description: "Build an e-commerce website" });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/unexpected response format/);
    });
  });

  describe("POST /api/ai/generate-tasks", () => {
    it("generates tasks for a project", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();
      mockClaudeResponse({
        tasks: [
          { title: "Create Product API", description: "REST endpoints for products", priority: "HIGH" },
          { title: "Create Cart API", description: "Cart CRUD operations", priority: "MEDIUM" },
        ],
      });

      const res = await ownerAgent
        .post("/api/ai/generate-tasks")
        .send({ projectId, instruction: "Create 2 backend tasks" });

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(2);
    });
  });

  describe("GET /api/ai/tasks/:taskId/summarize", () => {
    it("returns a placeholder when the task has no comments", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();
      const taskRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Empty Task" });

      const res = await ownerAgent.get(`/api/ai/tasks/${taskRes.body.data.task.id}/summarize`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toMatch(/No comments yet/);
    });

    it("summarizes a task's comment thread", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();
      const taskRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Product API" });
      const taskId = taskRes.body.data.task.id;
      await ownerAgent.post("/api/comments").send({ taskId, body: "API is almost complete." });

      mockClaudeResponse({ summary: "The API is nearly finished." });

      const res = await ownerAgent.get(`/api/ai/tasks/${taskId}/summarize`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBe("The API is nearly finished.");
    });
  });

  describe("POST /api/ai/generate-description", () => {
    it("generates a task description from a title", async () => {
      const { ownerAgent } = await setupOrgAndProject();
      mockClaudeResponse({ description: "Implement secure checkout flow with payment validation." });

      const res = await ownerAgent
        .post("/api/ai/generate-description")
        .send({ title: "Implement Checkout" });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toContain("checkout");
    });
  });

  describe("GET /api/ai/projects/:projectId/risk", () => {
    it("grounds the risk analysis in real overdue/unassigned task data", async () => {
      const { ownerAgent, projectId } = await setupOrgAndProject();

      const overdueTask = await ownerAgent
        .post("/api/tasks")
        .send({ projectId, title: "Late Task", priority: "URGENT" });
      await ownerAgent
        .patch(`/api/tasks/${overdueTask.body.data.task.id}`)
        .send({ dueDate: "2020-01-01T00:00:00.000Z" });

      mockClaudeResponse({
        risks: [
          {
            risk: "One task is significantly overdue",
            severity: "HIGH",
            suggestedAction: "Reassign or reprioritize immediately",
          },
        ],
      });

      const res = await ownerAgent.get(`/api/ai/projects/${projectId}/risk`);

      expect(res.status).toBe(200);
      expect(res.body.data.risks).toHaveLength(1);
      expect(res.body.data.risks[0].severity).toBe("HIGH");
    });
  });
});