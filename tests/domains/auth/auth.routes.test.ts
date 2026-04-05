import request from "supertest";
import express from "express";
import { createTestUser, createAuthHeaders } from "../../helpers/auth.helper";
import { cleanDatabase } from "../../helpers/db.helper";
import { signUpPayload } from "../../fixtures/user.fixture";

describe("Auth Routes", () => {
  let app: express.Application;

  beforeAll(async () =>{
    // Lazy load the router to avoid ESM issues with better-auth
    const { default: authRouter } = await import("../../../src/domains/auth/auth.routes");

    app = express();
    app.use(express.json());
    app.use("/auth", authRouter);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /auth/sign-up", () => {
    it("should create a new user and return user data", async () => {
      const res = await request(app)
        .post("/auth/sign-up")
        .send(signUpPayload)
        .expect(201);

      expect(res.body).toHaveProperty("message", "User successfully created.");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("email", signUpPayload.email);
      expect(res.body.user).toHaveProperty("name", signUpPayload.name);
    });

    it("should reject invalid email", async () => {
      const res = await request(app)
        .post("/auth/sign-up")
        .send({
          ...signUpPayload,
          email: "invalid-email",
        })
        .expect(422);

      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should reject password that is too short", async () => {
      const res = await request(app)
        .post("/auth/sign-up")
        .send({
          ...signUpPayload,
          password: "short",
        })
        .expect(422);

      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should reject name that is too short", async () => {
      const res = await request(app)
        .post("/auth/sign-up")
        .send({
          ...signUpPayload,
          name: "ab",
        })
        .expect(422);

      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should prevent duplicate email registration", async () => {
      // First sign up
      await request(app)
        .post("/auth/sign-up")
        .send(signUpPayload)
        .expect(201);

      // Try to sign up with same email
      const res = await request(app)
        .post("/auth/sign-up")
        .send(signUpPayload)
        .expect(409);

      expect(res.body.message).toContain("already exists");
    });
  });

  describe("POST /auth/sign-in", () => {
    beforeEach(async () => {
      // Create a test user
      await createTestUser({
        email: "signin@test.com",
        name: "Sign In User",
        password: "SignInPassword123!",
      });
    });

    it("should sign in user with valid credentials", async () => {
      const res = await request(app)
        .post("/auth/sign-in")
        .send({
          email: "signin@test.com",
          password: "SignInPassword123!",
        })
        .expect(200);

      expect(res.body).toHaveProperty("message", "User logged in successfully");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe("signin@test.com");
    });

    it("should reject invalid password", async () => {
      const res = await request(app)
        .post("/auth/sign-in")
        .send({
          email: "signin@test.com",
          password: "WrongPassword",
        })
        .expect(401);

      expect(res.body.message).toContain("Invalid");
    });

    it("should reject non-existent user", async () => {
      const res = await request(app)
        .post("/auth/sign-in")
        .send({
          email: "nonexistent@test.com",
          password: "Password123!",
        })
        .expect(401);

      expect(res.body.message).toContain("Invalid");
    });

    it("should reject missing email", async () => {
      const res = await request(app)
        .post("/auth/sign-in")
        .send({
          password: "Password123!",
        })
        .expect(422);

      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should reject missing password", async () => {
      const res = await request(app)
        .post("/auth/sign-in")
        .send({
          email: "test@test.com",
        })
        .expect(422);

      expect(res.body).toHaveProperty("message", "Validation failed");
    });
  });

  describe("POST /auth/sign-out", () => {
    it("should sign out authenticated user", async () => {
      const user = await createTestUser();
      const { "cookie": cookie } = await createAuthHeaders(user.id);

      const res = await request(app)
        .post("/auth/sign-out")
        .set("cookie", cookie)
        .expect(200);

      expect(res.body).toHaveProperty("message", "User logged out successfully");
    });

    it("should reject sign out without authentication", async () => {
      const res = await request(app)
        .post("/auth/sign-out")
        .expect(401);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /auth/me", () => {
    it("should return null currentUser when not authenticated", async () => {
      const res = await request(app)
        .get("/auth/me")
        .expect(200);

      expect(res.body).toEqual({ currentUser: null });
    });

    it("should return only required current user fields", async () => {
      const user = await createTestUser();
      const { cookie } = await createAuthHeaders(user.id);

      const res = await request(app)
        .get("/auth/me")
        .set("cookie", cookie)
        .expect(200);

      expect(res.body).toHaveProperty("currentUser");
      expect(res.body).not.toHaveProperty("session");
      expect(res.body.currentUser).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        image: user.image,
        emailVerified: user.emailVerified,
      });
      expect(res.body.currentUser).not.toHaveProperty("createdAt");
      expect(res.body.currentUser).not.toHaveProperty("updatedAt");
    });
  });
});
