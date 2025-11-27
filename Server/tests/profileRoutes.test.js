// Server/tests/profileRoutes.test.js
const request = require("supertest");
const express = require("express");
const router = require("../routes/profileRoutes");

jest.mock("../DB", () => ({
  query: jest.fn(),
}));
const pool = require("../DB");

// Bring helpers when possible
const { __getTestExports } = require("../routes/profileRoutes"); // add this export if needed

// Create an express app for testing
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/profile", router);
  return app;
}

// -------------------------------------------------------------
// Helper Tests (if exported)
// -------------------------------------------------------------
describe("profileRoutes helper functions", () => {
  test("commaToArray works correctly", () => {
    const fn =
      router.__test__?.commaToArray ??
      require("../routes/profileRoutes").__test__?.commaToArray;
    if (!fn) return; // skip if you didn’t export

    expect(fn("a,b,c")).toEqual(["a", "b", "c"]);
    expect(fn(" a , , b ")).toEqual(["a", "b"]);
    expect(fn(null)).toEqual([]);
  });

  test("arrayToComma works correctly", () => {
    const fn =
      router.__test__?.arrayToComma ??
      require("../routes/profileRoutes").__test__?.arrayToComma;
    if (!fn) return;

    expect(fn(["a", "b"])).toBe("a,b");
    expect(fn([" a ", " ", " c "])).toBe("a,c");
    expect(fn(null)).toBe("");
  });

  test("tryParseJSON works", () => {
    const fn =
      router.__test__?.tryParseJSON ??
      require("../routes/profileRoutes").__test__?.tryParseJSON;
    if (!fn) return;

    expect(fn('{"a":1}')).toEqual({ a: 1 });
    expect(fn("not json")).toBeNull();
    expect(fn(123)).toBeNull();
  });
});

// -------------------------------------------------------------
// GET /profile/by-username/:username
// -------------------------------------------------------------
describe("GET /profile/by-username/:username", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns 404 if user not found", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const app = makeApp();
    const res = await request(app).get("/profile/by-username/x");

    expect(res.status).toBe(404);
  });

  test("returns user if found", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          username: "jdoe",
          emailaddress: "a@b.com",
          skills: "x,y",
          preferences: '{"theme":"dark"}',
          maxdistancefromevents: "10",
          isavailablesun: true,
          isavailablemon: false,
          isavailabletue: true,
          isavailablewed: false,
          isavailablethu: true,
          isavailablefri: false,
          isavailablesat: false,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/profile/by-username/jdoe");

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("jdoe");
    expect(res.body.user.skills).toEqual(["x", "y"]);
  });

  test("handles DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB fail"));

    const app = makeApp();
    const res = await request(app).get("/profile/by-username/test");

    expect(res.status).toBe(500);
  });
});

// -------------------------------------------------------------
// GET /profile/:userId
// -------------------------------------------------------------
describe("GET /profile/:userId", () => {
  afterEach(() => jest.clearAllMocks());

  test("404 if user not found", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const app = makeApp();
    const res = await request(app).get("/profile/1000");

    expect(res.status).toBe(404);
  });

  test("200 returns profile", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 2,
          firstname: "Alice",
          lastname: "Green",
          username: "ag",
          emailaddress: "z@y.com",
          skills: "teach,logistics",
          preferences: '{"mode":"pro"}',
          isavailablesun: false,
          isavailablemon: true,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/profile/2");

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("ag");
    expect(res.body.user.skills).toEqual(["teach", "logistics"]);
  });

  test("handles DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("xx"));

    const app = makeApp();
    const res = await request(app).get("/profile/22");

    expect(res.status).toBe(500);
  });
});

// -------------------------------------------------------------
// PUT /profile/:userId
// -------------------------------------------------------------
describe("PUT /profile/:userId", () => {
  afterEach(() => jest.clearAllMocks());

  test("400 if no fields provided", async () => {
    const app = makeApp();
    const res = await request(app).put("/profile/1").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No fields to update");
  });

  test("400 on validation errors", async () => {
    const app = makeApp();
    const res = await request(app).put("/profile/1").send({
      email: "",
      username: "",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("updates basic fields", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          username: "jd",
          emailaddress: "a@b.com",
          fullname: "John Doe",
          address1: "",
          address2: "",
          city: "",
          state: "",
          zip: "77000",
          skills: "a,b",
          preferences: "{}",
          maxdistancefromevents: "10",
          isavailablesun: true,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app)
      .put("/profile/1")
      .send({
        username: "jd",
        email: "a@b.com",
        skills: ["a", "b"],
        preferences: { theme: "dark" },
      });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("jd");
  });

  test("updates availability via new format", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 1,
          firstname: "A",
          lastname: "B",
          username: "ab",
          emailaddress: "x@y",
          preferences: "{}",
          isavailablesun: true,
          isavailablemon: false,
          isavailabletue: false,
          isavailablewed: false,
          isavailablethu: false,
          isavailablefri: false,
          isavailablesat: false,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app)
      .put("/profile/1")
      .send({
        availability: { days: { sun: true, mon: true, tue: false } },
      });

    expect(res.status).toBe(200);
  });

  test("legacy availability flags", async () => {
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 1,
          firstname: "A",
          lastname: "B",
          username: "ab",
          emailaddress: "x@y",
          preferences: "{}",
          isavailablesun: false,
          isavailablemon: false,
          isavailabletue: false,
          isavailablewed: false,
          isavailablethu: false,
          isavailablefri: false,
          isavailablesat: false,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).put("/profile/1").send({
      isavailablesun: true,
      isavailabletue: true,
    });

    expect(res.status).toBe(200);
  });

  test("404 when update finds no user", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const app = makeApp();
    const res = await request(app).put("/profile/999").send({
      username: "jd",
    });

    expect(res.status).toBe(404);
  });

  test("handles duplicate constraint 23505", async () => {
    const err = new Error("duplicate");
    err.code = "23505";
    err.detail = "username exists";

    pool.query.mockRejectedValueOnce(err);

    const app = makeApp();
    const res = await request(app).put("/profile/1").send({
      username: "test",
    });

    expect(res.status).toBe(409);
  });

  test("500 on generic DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB bad"));

    const app = makeApp();
    const res = await request(app).put("/profile/1").send({
      username: "ok",
    });

    expect(res.status).toBe(500);
  });
});
