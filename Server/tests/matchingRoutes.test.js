// Server/tests/matchingRoutes.test.js
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

jest.mock("../DB", () => ({ query: jest.fn() }));

const pool = require("../DB");
const matchingRoutes = require("../routes/matchingRoutes");

// Build express app
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/matching", matchingRoutes);
  return app;
}

describe("GET /matching/recommendations", () => {
  afterEach(() => jest.clearAllMocks());

  // --------------------------------------
  // 1. Missing token
  // --------------------------------------
  test("→ 401 when missing Authorization header", async () => {
    const app = makeApp();
    const res = await request(app).get("/matching/recommendations");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing auth token");
  });

  // --------------------------------------
  // 2. Invalid token
  // --------------------------------------
  test("→ 403 when JWT.verify returns error", async () => {
    jest
      .spyOn(jwt, "verify")
      .mockImplementation((_t, _s, cb) => cb(new Error("bad token"), null));

    const app = makeApp();
    const res = await request(app)
      .get("/matching/recommendations")
      .set("Authorization", "Bearer BADTOKEN");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid token");
  });

  // --------------------------------------
  // 3. Profile not found
  // --------------------------------------
  test("→ 404 when user profile missing", async () => {
    jest
      .spyOn(jwt, "verify")
      .mockImplementation((_t, _s, cb) =>
        cb(null, { id: "123", username: "demo" })
      );

    pool.query.mockResolvedValue({ rowCount: 0, rows: [] });

    const app = makeApp();
    const res = await request(app)
      .get("/matching/recommendations")
      .set("Authorization", "Bearer VALIDTOKEN");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Profile not found");
  });

  // --------------------------------------
  // 5. DB Error (events or profile)
  // --------------------------------------
  test("→ 500 when DB throws", async () => {
    jest
      .spyOn(jwt, "verify")
      .mockImplementation((_t, _s, cb) => cb(null, { id: "123" }));

    pool.query.mockRejectedValueOnce(new Error("DB down"));

    const app = makeApp();
    const res = await request(app)
      .get("/matching/recommendations")
      .set("Authorization", "Bearer VALIDTOKEN");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Server error");
  });

  // --------------------------------------
  // 6. Event filtered out (no matching skill)
  // --------------------------------------
  test("→ 200 but zero matches when skills don't match", async () => {
    jest
      .spyOn(jwt, "verify")
      .mockImplementation((_t, _s, cb) =>
        cb(null, { id: "321", username: "demo" })
      );

    // Profile has skills = ["first aid"]
    pool.query
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 321,
            skills: "first aid",
            zip: "77004",
            maxdistancefromevents: 10,
            isavailablesun: true,
            isavailablemon: true,
            isavailabletue: true,
            isavailablewed: true,
            isavailablethu: true,
            isavailablefri: true,
            isavailablesat: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        // Event requires logistics → not matched
        rows: [
          {
            id: 1,
            name: "IT Setup",
            zipcode: "77004",
            urgency: 1,
            date: "2025-01-05",
            event_time: "09:00",
            organization: "OrgX",
            firstaid: 0,
            foodservice: 0,
            logistics: 1,
            teaching: 0,
            eventsetup: 0,
            dataentry: 0,
            customerservice: 0,
          },
        ],
      });

    const app = makeApp();
    const res = await request(app)
      .get("/matching/recommendations")
      .set("Authorization", "Bearer VALIDTOKEN");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.matches).toEqual([]);
  });
});
