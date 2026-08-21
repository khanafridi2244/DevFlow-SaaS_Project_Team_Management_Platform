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

async function setupOrgWithProjects() {
  const ownerAgent = await registerAndLogin(owner);
  const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
  const organizationId = orgRes.body.data.organization.id;

  const projectA = await ownerAgent
    .post("/api/projects")
    .send({ organizationId, name: "E-Commerce Website" });
  const projectB = await ownerAgent
    .post("/api/projects")
    .send({ organizationId, name: "Mobile App" });

  const devAgent = await registerAndLogin(developer);
  const devMeRes = await devAgent.get("/api/auth/me");
  const devUserId = devMeRes.body.data.user.id;

  await ownerAgent
    .post(`/api/organizations/${organizationId}/members`)
    .send({ email: developer.email, role: "DEVELOPER" });
  await ownerAgent
    .post(`/api/projects/${projectA.body.data.project.id}/members`)
    .send({ userId: devUserId });
  await ownerAgent
    .post(`/api/projects/${projectB.body.data.project.id}/members`)
    .send({ userId: devUserId });

  return {
    ownerAgent,
    devAgent,
    organizationId,
    projectAId: projectA.body.data.project.id,
    projectBId: projectB.body.data.project.id,
    devUserId,
  };
}

describe("Calendar", () => {
  it("returns tasks due within the requested month, across all projects", async () => {
    const { ownerAgent, organizationId, projectAId, projectBId } = await setupOrgWithProjects();

    const inMonth = await ownerAgent
      .post("/api/tasks")
      .send({ projectId: projectAId, title: "Design Homepage", dueDate: "2026-09-15T00:00:00.000Z" });
    await ownerAgent
      .post("/api/tasks")
      .send({ projectId: projectBId, title: "Login Screen", dueDate: "2026-09-28T00:00:00.000Z" });
    await ownerAgent
      .post("/api/tasks")
      .send({ projectId: projectAId, title: "Outside Month", dueDate: "2026-10-01T00:00:00.000Z" });
    await ownerAgent.post("/api/tasks").send({ projectId: projectAId, title: "No Due Date" });

    const res = await ownerAgent
      .get("/api/tasks/calendar")
      .query({ organizationId, month: "2026-09" });

    expect(res.status).toBe(200);
    expect(res.body.data.tasks).toHaveLength(2);
    const titles = res.body.data.tasks.map((t) => t.title);
    expect(titles).toEqual(expect.arrayContaining(["Design Homepage", "Login Screen"]));
    expect(titles).not.toContain("Outside Month");
    expect(titles).not.toContain("No Due Date");
  });

  it("orders tasks by due date ascending", async () => {
    const { ownerAgent, organizationId, projectAId } = await setupOrgWithProjects();

    await ownerAgent
      .post("/api/tasks")
      .send({ projectId: projectAId, title: "Later Task", dueDate: "2026-09-25T00:00:00.000Z" });
    await ownerAgent
      .post("/api/tasks")
      .send({ projectId: projectAId, title: "Earlier Task", dueDate: "2026-09-05T00:00:00.000Z" });

    const res = await ownerAgent
      .get("/api/tasks/calendar")
      .query({ organizationId, month: "2026-09" });

    expect(res.body.data.tasks[0].title).toBe("Earlier Task");
    expect(res.body.data.tasks[1].title).toBe("Later Task");
  });

  it("rejects an invalid month format", async () => {
    const { ownerAgent, organizationId } = await setupOrgWithProjects();

    const res = await ownerAgent
      .get("/api/tasks/calendar")
      .query({ organizationId, month: "September-2026" });

    expect(res.status).toBe(400);
  });

  it("rejects a non-member of the organization", async () => {
    const { organizationId } = await setupOrgWithProjects();
    const outsider = await registerAndLogin({
      email: "outsider@devflow.test",
      password: "StrongPass123",
      firstName: "Out",
      lastName: "Sider",
    });

    const res = await outsider.get("/api/tasks/calendar").query({ organizationId, month: "2026-09" });
    expect(res.status).toBe(403);
  });
});

describe("Org-wide search", () => {
  it("finds tasks across multiple projects matching status + priority", async () => {
    const { ownerAgent, devAgent, organizationId, projectAId, projectBId, devUserId } =
      await setupOrgWithProjects();

    const t1 = await ownerAgent
      .post("/api/tasks")
      .send({ projectId: projectAId, title: "Product API", priority: "HIGH", assigneeId: devUserId });
    await ownerAgent.patch(`/api/tasks/${t1.body.data.task.id}/status`).send({ status: "IN_PROGRESS" });

    await ownerAgent
      .post("/api/tasks")
      .send({ projectId: projectBId, title: "Cart API", priority: "LOW", assigneeId: devUserId });

    const res = await ownerAgent.get("/api/tasks/search").query({
      organizationId,
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: devUserId,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.tasks[0].title).toBe("Product API");
  });

  it("searches across projects by text", async () => {
    const { ownerAgent, organizationId, projectAId, projectBId } = await setupOrgWithProjects();

    await ownerAgent.post("/api/tasks").send({ projectId: projectAId, title: "Implement Checkout" });
    await ownerAgent.post("/api/tasks").send({ projectId: projectBId, title: "Design Homepage" });

    const res = await ownerAgent.get("/api/tasks/search").query({ organizationId, search: "checkout" });

    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.tasks[0].title).toBe("Implement Checkout");
  });

  it("rejects a search request missing organizationId", async () => {
    const { ownerAgent } = await setupOrgWithProjects();

    const res = await ownerAgent.get("/api/tasks/search").query({ status: "TODO" });

    expect(res.status).toBe(400);
  });

  it("rejects search from a non-org-member", async () => {
    const { organizationId } = await setupOrgWithProjects();
    const outsider = await registerAndLogin({
      email: "outsider2@devflow.test",
      password: "StrongPass123",
      firstName: "Out",
      lastName: "Sider",
    });

    const res = await outsider.get("/api/tasks/search").query({ organizationId });
    expect(res.status).toBe(403);
  });
});