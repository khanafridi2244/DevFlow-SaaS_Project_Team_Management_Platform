const http = require("http");
const { io: ioClient } = require("socket.io-client");
const { app } = require("../src/app");
const { initSocket } = require("../src/config/socket");
const { signAccessToken } = require("../src/utils/jwt");
const { env } = require("../src/config/env");
const { prisma } = require("../src/config/prisma");
const request = require("supertest");

let httpServer;
let port;

beforeAll((done) => {
  httpServer = http.createServer(app);
  initSocket(httpServer);
  httpServer.listen(() => {
    port = httpServer.address().port;
    done();
  });
});

afterAll((done) => {
  httpServer.close(done);
});

function connectAsUser(accessToken) {
  return ioClient(`http://localhost:${port}`, {
    transportOptions: {
      polling: {
        extraHeaders: { Cookie: `${env.cookies.accessTokenName}=${accessToken}` },
      },
    },
  });
}

describe("Socket.IO real-time notifications", () => {
  it("rejects a connection with no auth cookie", (done) => {
    const client = ioClient(`http://localhost:${port}`);
    client.on("connect_error", (err) => {
      expect(err.message).toMatch(/Authentication required/);
      client.close();
      done();
    });
  });

  it("rejects a connection with an invalid token", (done) => {
    const client = connectAsUser("this.is.garbage");
    client.on("connect_error", (err) => {
      expect(err.message).toMatch(/Invalid or expired token/);
      client.close();
      done();
    });
  });

  it("accepts a connection with a valid access token", (done) => {
    const accessToken = signAccessToken({ sub: "fake-user-id", email: "test@devflow.test" });
    const client = connectAsUser(accessToken);

    client.on("connect", () => {
      expect(client.connected).toBe(true);
      client.close();
      done();
    });
  });

  it("pushes a live event when a comment triggers a notification", async () => {
    // Real register/login flow via the actual HTTP app, so we have a
    // genuine user + valid access token to authenticate the socket with.
    const ownerAgent = request.agent(app);
    const owner = {
      email: "owner@devflow.test",
      password: "StrongPass123",
      firstName: "Sikandar",
      lastName: "Owner",
    };
    const devAgent = request.agent(app);
    const developer = {
      email: "ali@devflow.test",
      password: "StrongPass123",
      firstName: "Ali",
      lastName: "Developer",
    };

    await ownerAgent.post("/api/auth/register").send(owner);
    const devRegisterRes = await devAgent.post("/api/auth/register").send(developer);
    const devUserId = devRegisterRes.body.data.user.id;
    const devAccessTokenCookie = devRegisterRes.headers["set-cookie"].find((c) =>
      c.startsWith(`${env.cookies.accessTokenName}=`)
    );
    const devAccessToken = devAccessTokenCookie.split(";")[0].split("=")[1];

    const orgRes = await ownerAgent.post("/api/organizations").send({ name: "Brothers Software" });
    const organizationId = orgRes.body.data.organization.id;
    await ownerAgent
      .post(`/api/organizations/${organizationId}/members`)
      .send({ email: developer.email, role: "DEVELOPER" });

    const projectRes = await ownerAgent
      .post("/api/projects")
      .send({ organizationId, name: "E-Commerce Website" });
    const projectId = projectRes.body.data.project.id;
    await ownerAgent.post(`/api/projects/${projectId}/members`).send({ userId: devUserId });

    const taskRes = await ownerAgent
      .post("/api/tasks")
      .send({ projectId, title: "Product API", assigneeId: devUserId });
    const taskId = taskRes.body.data.task.id;

    // Connect the developer's socket BEFORE the owner comments, so
    // there's an active connection listening when the event fires.
    const devSocket = connectAsUser(decodeURIComponent(devAccessToken));

    await new Promise((resolve) => devSocket.on("connect", resolve));

    const notificationPromise = new Promise((resolve) => {
      devSocket.on("notification:new", resolve);
    });

    await ownerAgent.post("/api/comments").send({ taskId, body: "Please review this." });

    const pushedNotification = await notificationPromise;

    expect(pushedNotification.type).toBe("COMMENT_ADDED");
    expect(pushedNotification.userId).toBe(devUserId);

    devSocket.close();
  }, 10000);
});