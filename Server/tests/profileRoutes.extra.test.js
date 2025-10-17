// tests/profileRoutes.extra.test.js
const request = require("supertest");
const app = require("../app");
const { __resetAll, users } = require("../data/mockData");

beforeEach(() => __resetAll());

describe("Profile (extra)", () => {
  test("PUT /profile/:id invalid zip -> 400", async () => {
    const res = await request(app)
      .put("/profile/u1")
      .send({ zip: "12-ABC" });
    expect(res.status).toBe(400);
    expect(res.body.errors.join(" ")).toMatch(/zip must be 5 or 9 digits/i);
  });

  test("PUT /profile/:id invalid state (too short) -> 400", async () => {
    const res = await request(app)
      .put("/profile/u1")
      .send({ state: "T" });
    expect(res.status).toBe(400);
    expect(res.body.errors.join(" ")).toMatch(/state must be a 2–3 letter code/i);
  });

  test("PUT /profile/:id availability malformed -> 400", async () => {
    const res = await request(app)
      .put("/profile/u1")
      .send({ availability: { bad: "shape" } });
    expect(res.status).toBe(400);
    expect(res.body.errors.join(" ")).toMatch(/availability must be an array/i);
  });

  test("PUT /profile/:id availability normalizes array to {dates:[...]}", async () => {
    const res = await request(app)
      .put("/profile/u1")
      .send({ availability: ["2025-10-21", "2025-10-21", "2025-11-02"] });
    expect(res.status).toBe(200);
    expect(res.body.user.availability).toEqual({
      dates: ["2025-10-21", "2025-11-02"]
    });
  });

  test("GET /profile/:id back-compat location string is split", async () => {
    // simulate legacy user with only location
    const u = users.find((x) => x.id === "u1");
    u.address1 = "";
    u.address2 = "";
    u.city = "";
    u.state = "";
    u.zip = "";
    u.location = "Houston, TX, 77001";

    const res = await request(app).get("/profile/u1");
    expect(res.status).toBe(200);
    expect(res.body.user.city).toBe("Houston");
    expect(res.body.user.state).toBe("TX");
    expect(res.body.user.zip).toBe("77001");
  });
});
