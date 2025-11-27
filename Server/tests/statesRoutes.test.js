// Server/tests/statesRoutes.test.js
const request = require("supertest");
const express = require("express");

const statesRoutes = require("../routes/statesRoutes");

// Build small express app
function makeApp() {
  const app = express();
  app.use("/states", statesRoutes);
  return app;
}

describe("States Routes", () => {
  test("GET /states → returns all US states", async () => {
    const app = makeApp();
    const res = await request(app).get("/states");

    expect(res.status).toBe(200);

    // basic shape check
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(40); // total is 50 states

    // check that a few known states exist
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state_code: "TX", state_name: "Texas" }),
        expect.objectContaining({ state_code: "CA", state_name: "California" }),
        expect.objectContaining({ state_code: "NY", state_name: "New York" }),
      ])
    );
  });
});
