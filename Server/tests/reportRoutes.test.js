// tests/reportRoutes.test.js
const request = require("supertest");
const app = require("../app");

describe("Report Routes – require auth", () => {
  test("GET /reports/volunteers requires auth", async () => {
    const res = await request(app).get("/reports/volunteers");
    expect(res.status).toBe(401);
    // body is currently {}, so don't expect a specific message
    expect(typeof res.body).toBe("object");
  });

  test("GET /reports/events requires auth", async () => {
    const res = await request(app).get("/reports/events");
    expect(res.status).toBe(401);
    expect(typeof res.body).toBe("object");
  });

  test("GET /reports/volunteers.csv requires auth", async () => {
    const res = await request(app).get("/reports/volunteers.csv");
    expect(res.status).toBe(401);
    expect(typeof res.body).toBe("object");
  });

  test("GET /reports/events.csv requires auth", async () => {
    const res = await request(app).get("/reports/events.csv");
    expect(res.status).toBe(401);
    expect(typeof res.body).toBe("object");
  });
});

describe("Report Routes – my-events auth behavior", () => {
  test("GET /reports/my-events without auth returns 401", async () => {
    const res = await request(app).get("/reports/my-events");
    expect(res.status).toBe(401);
    // don't assert on res.body.message because the middleware returns {}
    expect(typeof res.body).toBe("object");
  });
});
