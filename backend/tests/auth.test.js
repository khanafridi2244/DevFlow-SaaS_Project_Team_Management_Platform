const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/config/prisma");

const testUser = {
  email: "sikandar@devflow.test",
  password: "StrongPass123",
  firstName: "Sikandar",
  lastName: "Ali",
};

describe("Auth flow", () => {
  describe("POST /api/auth/register", () => {
    it("registers a new user and sets auth cookies", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty("passwordHash");

      const cookies = res.headers["set-cookie"];
      expect(cookies.some((c) => c.startsWith("devflow_at="))).toBe(true);
      expect(cookies.some((c) => c.startsWith("devflow_rt="))).toBe(true);
    });

    it("rejects a duplicate email", async () => {
      await request(app).post("/api/auth/register").send(testUser);
      const res = await request(app).post("/api/auth/register").send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("rejects a weak password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "weak@devflow.test", password: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("rejects an invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "not-an-email" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("logs in with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.headers["set-cookie"]).toBeDefined();

      // Guards against the exact bug this test suite missed before:
      // login must never leak passwordHash or verification/reset tokens.
      expect(res.body.data.user).not.toHaveProperty("passwordHash");
      expect(res.body.data.user).not.toHaveProperty("refreshTokenHash");
      expect(res.body.data.user).not.toHaveProperty("emailVerifyToken");
      expect(res.body.data.user).not.toHaveProperty("emailVerifyExpiry");
      expect(res.body.data.user).not.toHaveProperty("resetToken");
      expect(res.body.data.user).not.toHaveProperty("resetTokenExpiry");
    });

    it("rejects an incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: "WrongPassword123" });

      expect(res.status).toBe(401);
    });

    it("rejects a non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@devflow.test", password: testUser.password });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me (protected route)", () => {
    it("rejects a request with no access token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns the current user when authenticated", async () => {
      const agent = request.agent(app); // persists cookies across requests
      await agent.post("/api/auth/register").send(testUser);

      const res = await agent.get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it("rejects a garbage/tampered token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", ["devflow_at=this.is.not.a.valid.jwt"]);

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("logs out and clears the session", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/register").send(testUser);

      const logoutRes = await agent.post("/api/auth/logout");
      expect(logoutRes.status).toBe(200);

      // Confirm refreshTokenHash was actually cleared server-side
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(user.refreshTokenHash).toBeNull();
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("issues a new access token using a valid refresh token", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/register").send(testUser);

      const res = await agent.post("/api/auth/refresh");

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects when no refresh token is present", async () => {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("returns success even for a non-existent email (no enumeration)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nobody@devflow.test" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("returns the same success shape for a real email", async () => {
      await request(app).post("/api/auth/register").send(testUser);

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});