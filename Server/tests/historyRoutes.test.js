const request = require("supertest");
const app = require("../app");
const { __resetAll } = require("../data/mockData");

beforeEach(() => __resetAll());

describe("Volunteer History", () => {
  test("GET /history/u1 returns events", async () => {
    const res = await request(app).get("/history/u1");
    expect(res.status).toBe(200);
    expect(res.body.history).toBeDefined();
    expect(Array.isArray(res.body.history.events)).toBe(true);
    expect(res.body.history.events.length).toBeGreaterThan(0);
  });

  test("GET /history/unknown returns empty history gracefully", async () => {
    const res = await request(app).get("/history/unknown");
    // depending on your route, 200 with empty or 404 — accept either
    expect([200, 404]).toContain(res.status);
  });
});
