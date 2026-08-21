jest.mock("../src/config/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        // Simulate a successful Cloudinary upload without any network call
        const fakeResult = {
          secure_url: `https://res.cloudinary.com/devflow/devflow/attachments/${options.public_id}.pdf`,
          public_id: `devflow/attachments/${options.public_id}`,
        };
        return {
          end: () => callback(null, fakeResult),
        };
      }),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/config/prisma");
const { cloudinary } = require("../src/config/cloudinary");

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

  const taskRes = await ownerAgent.post("/api/tasks").send({ projectId, title: "Design Homepage" });
  const taskId = taskRes.body.data.task.id;

  const devAgent = await registerAndLogin(developer);
  await ownerAgent
    .post(`/api/organizations/${organizationId}/members`)
    .send({ email: developer.email, role: "DEVELOPER" });

  return { ownerAgent, devAgent, organizationId, projectId, taskId };
}

describe("Attachment flow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/attachments", () => {
    it("uploads a file and attaches it to a task", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      const res = await ownerAgent
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("fake pdf content"), {
          filename: "requirements.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.attachment.fileName).toBe("requirements.pdf");
      expect(res.body.data.attachment.fileType).toBe("application/pdf");
      expect(res.body.data.attachment.url).toContain("cloudinary.com");
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(1);
    });

    it("rejects an unsupported file type", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      const res = await ownerAgent
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("#!/bin/sh\necho hi"), {
          filename: "script.sh",
          contentType: "application/x-sh",
        });

      expect(res.status).toBe(400);
      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it("rejects an upload with no file attached", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      const res = await ownerAgent.post("/api/attachments").field("taskId", taskId);

      expect(res.status).toBe(400);
    });

    it("rejects an upload from a non-org-member", async () => {
      const { taskId } = await setupOrgProjectTask();
      const outsider = await registerAndLogin({
        email: "outsider@devflow.test",
        password: "StrongPass123",
        firstName: "Out",
        lastName: "Sider",
      });

      const res = await outsider
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("data"), { filename: "sneaky.png", contentType: "image/png" });

      expect(res.status).toBe(403);
    });

    it("logs an activity entry when a file is uploaded", async () => {
      const { ownerAgent, taskId, organizationId } = await setupOrgProjectTask();

      await ownerAgent
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("data"), { filename: "design.png", contentType: "image/png" });

      const activity = await prisma.activity.findFirst({
        where: { organizationId, action: "ATTACHMENT_UPLOADED" },
      });
      expect(activity).not.toBeNull();
      expect(activity.metadata.fileName).toBe("design.png");
    });
  });

  describe("GET /api/attachments", () => {
    it("lists attachments for a task", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      await ownerAgent
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("data"), { filename: "one.pdf", contentType: "application/pdf" });
      await ownerAgent
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("data"), { filename: "two.png", contentType: "image/png" });

      const res = await ownerAgent.get("/api/attachments").query({ taskId });

      expect(res.status).toBe(200);
      expect(res.body.data.attachments).toHaveLength(2);
    });
  });

  describe("DELETE /api/attachments/:attachmentId", () => {
    it("the uploader can delete their own attachment", async () => {
      const { ownerAgent, taskId } = await setupOrgProjectTask();

      const uploadRes = await ownerAgent
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("data"), { filename: "temp.pdf", contentType: "application/pdf" });

      const res = await ownerAgent.delete(`/api/attachments/${uploadRes.body.data.attachment.id}`);

      expect(res.status).toBe(200);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);

      const gone = await prisma.attachment.findUnique({
        where: { id: uploadRes.body.data.attachment.id },
      });
      expect(gone).toBeNull();
    });

    it("a DEVELOPER cannot delete someone else's attachment", async () => {
      const { ownerAgent, devAgent, taskId } = await setupOrgProjectTask();

      const uploadRes = await ownerAgent
        .post("/api/attachments")
        .field("taskId", taskId)
        .attach("file", Buffer.from("data"), { filename: "owners.pdf", contentType: "application/pdf" });

      const res = await devAgent.delete(`/api/attachments/${uploadRes.body.data.attachment.id}`);

      expect(res.status).toBe(403);
    });
  });
});