import request from "supertest";
import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { createTestUser, createAuthHeaders } from "../../helpers/auth.helper";
import { cleanDatabase } from "../../helpers/db.helper";

describe("Dashboard Routes", () => {
  let app: express.Application;

  beforeAll(async () => {
    // Lazy load routers to avoid ESM issues with better-auth
    const { default: dashboardRouter } = await import("../../../src/domains/dashboard/dashboard.routes");
    const { authorize } = await import("../../../src/core/middleware/authorize.middleware");

    app = express();
    app.use(express.json());
    app.use("/dashboard", authorize(Role.VIEWER), dashboardRouter);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /dashboard/summary", () => {
    it("should allow viewer to access summary", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .get("/dashboard/summary")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body).toHaveProperty("totalIncome");
      expect(res.body).toHaveProperty("totalExpense");
      expect(res.body).toHaveProperty("netBalance");
    });

    it("should reject summary request without authentication", async () => {
      const res = await request(app).get("/dashboard/summary").expect(401);

      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /dashboard/trends", () => {
    it("should allow viewer to access trends", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .get("/dashboard/trends")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body).toHaveProperty("weeklyTrends");
      expect(res.body).toHaveProperty("monthlyTrends");
    });
  });

  describe("GET /dashboard/recent-activity", () => {
    it("should allow viewer to access recent activity", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .get("/dashboard/recent-activity")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body).toHaveProperty("recentActivity");
    });
  });

  describe("GET /dashboard/category-wise-totals", () => {
    it("should reject viewer from accessing category-wise totals", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .get("/dashboard/category-wise-totals")
        .set("cookie", headers.cookie)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should allow analyst to access category-wise totals", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .get("/dashboard/category-wise-totals")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body).toHaveProperty("categoryWiseTotals");
    });

    it("should allow admin to access category-wise totals", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .get("/dashboard/category-wise-totals")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body).toHaveProperty("categoryWiseTotals");
    });
  });
});
