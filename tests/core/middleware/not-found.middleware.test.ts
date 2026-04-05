import request from "supertest";
import express from "express";
import { notFoundHandler } from "../../../src/core/middleware/not-found.middleware";

describe("Not Found Middleware", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(notFoundHandler);
  });

  it("should return a beautiful 404 payload with quote for missing endpoint", async () => {
    const res = await request(app).get("/missing-endpoint").expect(404);

    expect(res.body).toHaveProperty("status", "error");
    expect(res.body).toHaveProperty("code", 404);
    expect(res.body).toHaveProperty("title", "Lost In The API");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("quote");
    expect(typeof res.body.quote).toBe("string");
    expect(res.body.quote.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty("suggestions");
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty("requested");
    expect(res.body.requested).toMatchObject({
      method: "GET",
      path: "/missing-endpoint",
    });
    expect(res.body).toHaveProperty("timestamp");
  });
});
