import request from "supertest";
import express from "express";
import welcomeController from "../../../src/domains/welcome/welcome.controller";

describe("Welcome Endpoint", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.get("/", welcomeController);
  });

  describe("GET /", () => {
    it("should return 200 and service info", async () => {
      const res = await request(app)
        .get("/")
        .expect(200);

      expect(res.body).toHaveProperty("status", "ok");
      expect(res.body).toHaveProperty("service");
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("developedBy");
      expect(res.body.developedBy).toHaveProperty("name");
      expect(res.body.developedBy).toHaveProperty("alias");
      expect(res.body.developedBy).toHaveProperty("linkedIn");
      expect(res.body.developedBy).toHaveProperty("github");
    });

    it("should contain developer information", async () => {
      const res = await request(app)
        .get("/")
        .expect(200);

      expect(res.body.developedBy.name).toBe("Ashok Atragadda");
      expect(res.body.developedBy.alias).toBe("cygnuxxs");
    });
  });
});
