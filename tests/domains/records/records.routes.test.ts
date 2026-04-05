import request from "supertest";
import express from "express";
import { createTestUser, createAuthHeaders } from "../../helpers/auth.helper";
import { cleanDatabase, createRecord, getRecordCount } from "../../helpers/db.helper";
import { Role } from "../../../generated/prisma/enums";
import { testRecords, batchRecords } from "../../fixtures/record.fixture";
import { prisma } from "../../../src/core/prisma";

describe("Records Routes", () => {
  let app: express.Application;

  beforeAll(async () => {
    // lazy load routers to avoid ESM issues with better-auth
    const { default: recordsRouter } = await import("../../../src/domains/records/records.routes");

    app = express();
    app.use(express.json());
    app.use("/records", recordsRouter);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /records", () => {
    beforeEach(async () => {
      // Create test records
      await createRecord(testRecords.income);
      await createRecord(testRecords.expense);
      await createRecord(testRecords.bonus);
    });

    it("should fetch records for analyst role", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .get("/records")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should reject fetch without proper role", async () => {
      const viewer = await createTestUser({ role: Role.VIEWER });
      const headers = await createAuthHeaders(viewer.id);

      const res = await request(app)
        .get("/records")
        .set("cookie", headers.cookie)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should filter records by category", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .get("/records?category=Salary")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.filters.category).toBe("Salary");
    });

    it("should filter records by type", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .get("/records?type=INCOME")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.filters.type).toBe("INCOME");
    });

    it("should support pagination", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .get("/records?page=1&limit=2")
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });

    it("should exclude soft-deleted records", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const admin = await createTestUser({ role: Role.ADMIN });
      const adminHeaders = await createAuthHeaders(admin.id);
      const analystHeaders = await createAuthHeaders(analyst.id);

      const allRecords = await request(app)
        .get("/records")
        .set("cookie", analystHeaders.cookie)
        .expect(200);

      const initialCount = allRecords.body.count;

      // Soft delete a record
      const firstRecord = allRecords.body.data[0];
      await request(app)
        .delete(`/records/${firstRecord.id}`)
        .set("cookie", adminHeaders.cookie)
        .expect(200);

      // Fetch again
      const filtered = await request(app)
        .get("/records")
        .set("cookie", analystHeaders.cookie)
        .expect(200);

      expect(filtered.body.count).toBe(initialCount - 1);
    });
  });

  describe("POST /records", () => {
    it("should create record for admin role", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .post("/records")
        .set("cookie", headers.cookie)
        .send(testRecords.income)
        .expect(201);

      expect(res.body).toHaveProperty("message", "Record created successfully");
      expect(res.body).toHaveProperty("data");
      expect(res.body.data.category).toBe(testRecords.income.category);
    });

    it("should reject record creation without admin role", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .post("/records")
        .set("cookie", headers.cookie)
        .send(testRecords.income)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject invalid record data", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .post("/records")
        .set("cookie", headers.cookie)
        .send({
          amount: -100,
          type: "INCOME",
          category: "Test",
        })
        .expect(422);

      expect(res.body).toHaveProperty("message", "Validation failed");
    });
  });

  describe("POST /records/batch", () => {
    it("should create multiple records in batch", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const initialCount = await getRecordCount();

      const res = await request(app)
        .post("/records/batch")
        .set("cookie", headers.cookie)
        .send(batchRecords)
        .expect(201);

      expect(res.body).toHaveProperty("message", "Records created successfully");
      expect(res.body).toHaveProperty("count", batchRecords.length);

      const finalCount = await getRecordCount();
      expect(finalCount).toBe(initialCount + batchRecords.length);
    });

    it("should reject batch without admin role", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .post("/records/batch")
        .set("cookie", headers.cookie)
        .send(batchRecords)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject batch with too many records", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const hugeArray = Array(1001).fill(testRecords.income);

      const res = await request(app)
        .post("/records/batch")
        .set("cookie", headers.cookie)
        .send(hugeArray)
        .expect(413);

      expect(res.status).toBe(413);
    });
  });

  describe("PATCH /records/:id", () => {
    it("should update record for admin role", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const record = await createRecord(testRecords.income);
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .patch(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .send({
          category: "Freelance",
          amount: 7500.0,
        })
        .expect(200);

      expect(res.body.record.category).toBe("Freelance");
      expect(Number(res.body.record.amount)).toBe(7500.0);
    });

    it("should reject update without admin role", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const record = await createRecord(testRecords.income);
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .patch(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .send({ category: "Updated" })
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject update of non-existent record", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .patch("/records/99999")
        .set("cookie", headers.cookie)
        .send({ category: "Updated" })
        .expect(404);

      expect(res.body.message).toContain("not found");
    });

    it("should reject update of soft-deleted record", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const record = await createRecord(testRecords.income);
      const headers = await createAuthHeaders(admin.id);

      // Soft delete the record
      await request(app)
        .delete(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .expect(200);

      // Try to update
      const res = await request(app)
        .patch(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .send({ category: "Updated" })
        .expect(404);

      expect(res.body.message).toContain("not found");
    });
  });

  describe("DELETE /records/:id", () => {
    it("should soft delete record for admin role", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const record = await createRecord(testRecords.income);
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .delete(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .expect(200);

      expect(res.body.message).toContain("deletion was successful");

      // Verify soft delete
      const deleted = await prisma.financialRecord.findUnique({
        where: { id: record.id },
      });

      expect(deleted?.deletedAt).not.toBeNull();
      expect(deleted?.deletedBy).toBe(admin.id);
    });

    it("should reject delete without admin role", async () => {
      const analyst = await createTestUser({ role: Role.ANALYST });
      const record = await createRecord(testRecords.income);
      const headers = await createAuthHeaders(analyst.id);

      const res = await request(app)
        .delete(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .expect(403);

      expect(res.body).toHaveProperty("message");
    });

    it("should reject delete of non-existent record", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const headers = await createAuthHeaders(admin.id);

      const res = await request(app)
        .delete("/records/99999")
        .set("cookie", headers.cookie)
        .expect(404);

      expect(res.body.message).toContain("not found");
    });

    it("should reject delete of already soft-deleted record", async () => {
      const admin = await createTestUser({ role: Role.ADMIN });
      const record = await createRecord(testRecords.income);
      const headers = await createAuthHeaders(admin.id);

      // Delete once
      await request(app)
        .delete(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .expect(200);

      // Try to delete again
      const res = await request(app)
        .delete(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .expect(404);

      expect(res.body.message).toContain("not found");
    });

    it("should capture deletedBy from session", async () => {
      const admin = await createTestUser({
        email: "deleter@test.com",
        role: Role.ADMIN,
      });
      const record = await createRecord(testRecords.income);
      const headers = await createAuthHeaders(admin.id);

      await request(app)
        .delete(`/records/${record.id}`)
        .set("cookie", headers.cookie)
        .expect(200);

      const deleted = await prisma.financialRecord.findUnique({
        where: { id: record.id },
      });

      expect(deleted?.deletedBy).toBe(admin.id);
    });
  });
});
