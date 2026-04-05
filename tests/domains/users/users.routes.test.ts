import request from "supertest";
import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { createTestUser, createAuthHeaders } from "../../helpers/auth.helper";
import { cleanDatabase } from "../../helpers/db.helper";
import { signUpPayload } from "../../fixtures/user.fixture";
import { prisma } from "../../../src/core/prisma";

describe("User Routes", () => {
  let app: express.Application;

  beforeAll(async () => {
    // Lazy load routers to avoid ESM issues with better-auth
    const { default: userRouter } = await import("../../../src/domains/users/users.routes");
    const { authorize } = await import("../../../src/core/middleware/authorize.middleware");

    app = express();
    app.use(express.json());
    app.use("/users", authorize(Role.ADMIN), userRouter);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /users", () => {
    it("should create a new user with admin role", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .post("/users")
        .set("cookie", headers.cookie)
        .send(signUpPayload)
        .expect(201);

      expect(res.body).toHaveProperty("message", "User successfully created.");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(signUpPayload.email);
    });

    it("should reject creation without admin role", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .post("/users")
        .set("cookie", headers.cookie)
        .send(signUpPayload)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject creation without authentication", async () => {
      const res = await request(app)
        .post("/users")
        .send(signUpPayload)
        .expect(401);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject duplicate email", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      // Create first user
      await request(app)
        .post("/users")
        .set("cookie", headers.cookie)
        .send(signUpPayload)
        .expect(201);

      // Try to create with same email
      const res = await request(app)
        .post("/users")
        .set("cookie", headers.cookie)
        .send(signUpPayload)
        .expect(409);

      expect(res.body.message).toContain("already exists");
    });
  });

  describe("GET /users", () => {
    beforeEach(async () => {
      // Create multiple test users
      for (let i = 0; i < 3; i++) {
        await createTestUser({
          email: `user${i}@test.com`,
          name: `User ${i}`,
        });
      }
    });

    it("should fetch all users with pagination", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .get("/users")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toHaveProperty("page", 1);
      expect(res.body.pagination).toHaveProperty("limit");
      expect(res.body.pagination).toHaveProperty("total");
    });

    it("should search users by name", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .get("/users?search=User+0")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.filters.search).toBe("User 0");
    });

    it("should search users by email", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .get("/users?search=user1@test.com")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should support pagination", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .get("/users?page=1&limit=2")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });

    it("should reject invalid pagination", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .get("/users?page=0&limit=-1")
        .set("cookie", headers.cookie)
        .expect(400);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("PATCH /users/:id", () => {
    it("should update user by admin", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const targetUser = await createTestUser({
        email: "target@test.com",
        name: "Target User",
      });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .patch(`/users/${targetUser.id}`)
        .set("cookie", headers.cookie)
        .send({
          name: "Updated Name",
          role: Role.ANALYST,
        })
        .expect(200);

      expect(res.body.user.name).toBe("Updated Name");
      expect(res.body.user.role).toBe(Role.ANALYST);
    });

    it("should reject update without admin role", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const targetUser = await createTestUser();
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .patch(`/users/${targetUser.id}`)
        .set("cookie", headers.cookie)
        .send({ name: "Updated" })
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject update of non-existent user", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .patch("/users/nonexistent-id")
        .set("cookie", headers.cookie)
        .send({ name: "Updated" })
        .expect(404);

      expect(res.body.message).toContain("not found");
    });

    it("should require at least one field for update", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const targetUser = await createTestUser();
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .patch(`/users/${targetUser.id}`)
        .set("cookie", headers.cookie)
        .send({})
        .expect(422);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("DELETE /users/:id", () => {
    it("should soft delete user by admin", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const targetUser = await createTestUser({
        email: "delete@test.com",
      });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .delete(`/users/${targetUser.id}`)
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.message).toContain("deleted");

      // Verify deletion (cascade should delete sessions/accounts)
      const sessions = await prisma.session.findMany({
        where: { userId: targetUser.id },
      });
      expect(sessions.length).toBe(0);
    });

    it("should reject delete without admin role", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const targetUser = await createTestUser();
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .delete(`/users/${targetUser.id}`)
        .set("cookie", headers.cookie)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject delete of non-existent user", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .delete("/users/nonexistent-id")
        .set("cookie", headers.cookie)
        .expect(404);

      expect(res.body.message).toContain("not found");
    });
  });
});
