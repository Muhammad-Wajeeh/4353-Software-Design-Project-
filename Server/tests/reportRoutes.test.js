// Server/tests/reportRoutes.test.js
const request = require("supertest");
const express = require("express");
const router = require("../routes/reportRoutes");

// mock DB
jest.mock("../DB", () => ({
  query: jest.fn(),
}));

const pool = require("../DB");

// helper imports
const { ROLE_GROUPS } = require("../routes/reportRoutes"); // if exported
// OR manually re-require helpers if needed...

function makeApp(authUser = null) {
  const app = express();
  app.use(express.json());

  // mock auth: attach req.user
  app.use((req, _, next) => {
    req.user = authUser;
    next();
  });

  app.use("/reports", router);
  return app;
}

describe("reportRoutes", () => {
  afterEach(() => jest.clearAllMocks());

  // ------------------------------------------------------------
  // 1) /reports/volunteers
  // ------------------------------------------------------------
  test("GET /reports/volunteers returns volunteers list", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          fullname: "John Doe",
          username: "jdoe",
          email: "a@b.com",
          events_attended: 3,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/reports/volunteers");

    expect(res.status).toBe(200);
    expect(res.body.volunteers.length).toBe(1);
    expect(res.body.volunteers[0].fullname).toBe("John Doe");
  });

  test("GET /reports/volunteers handles DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB down"));
    const app = makeApp();

    const res = await request(app).get("/reports/volunteers");
    expect(res.status).toBe(500);
  });

  // ------------------------------------------------------------
  // 2) /reports/volunteers.csv
  // ------------------------------------------------------------
  test("GET /reports/volunteers.csv returns CSV", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          fullname: "John Doe",
          username: "jdoe",
          email: "a@b.com",
          events_attended: 5,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/reports/volunteers.csv");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("John Doe");
  });

  // ------------------------------------------------------------
  // 3) /reports/events
  // ------------------------------------------------------------
  test("GET /reports/events returns events summary", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          name: "Food Drive",
          date: "2030-01-01",
          volunteers_assigned: 4,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/reports/events");

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
    expect(res.body.events[0].name).toBe("Food Drive");
  });

  // ------------------------------------------------------------
  // 4) /reports/events.csv
  // ------------------------------------------------------------
  test("GET /reports/events.csv returns CSV", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          name: "Cleanup",
          date: "2035-02-01",
          location: "UH",
          description: "desc",
          volunteers_assigned: 2,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/reports/events.csv");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Cleanup");
    expect(res.headers["content-type"]).toContain("text/csv");
  });

  // ------------------------------------------------------------
  // 5) /reports/my-events (unauthorized)
  // ------------------------------------------------------------
  test("GET /reports/my-events requires auth", async () => {
    const app = makeApp(null);

    const res = await request(app).get("/reports/my-events");
    expect(res.status).toBe(401);
  });

  test("GET /reports/my-events returns user events", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Beach Cleanup", date: "2030-01-03" }],
    });

    const app = makeApp({ id: 123 }); // fake user
    const res = await request(app).get("/reports/my-events");

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
  });

  // ------------------------------------------------------------
  // 6) /reports/my-events/:id/volunteers
  // ------------------------------------------------------------
  test("GET /reports/my-events/:id/volunteers unauthorized", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/reports/my-events/1/volunteers");
    expect(res.status).toBe(401);
  });

  test("GET /reports/my-events/:id/volunteers event not owned", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // event not found

    const app = makeApp({ id: 123 });
    const res = await request(app).get("/reports/my-events/1/volunteers");

    expect(res.status).toBe(404);
  });

  test("GET /reports/my-events/:id/volunteers success", async () => {
    // event
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "Clean",
            date: "2030-02-01",
            location: "",
            description: "",
          },
        ],
      })
      // volunteers + history
      .mockResolvedValueOnce({
        rows: [
          {
            id: 50,
            fullname: "Alice",
            username: "ali",
            email: "x@y.com",
            total_events: 4,
            total_hours: 12,
            skill_this_event: "logistics",
            hours_this_event: 4,
            status_this_event: "Registered",
          },
        ],
      });

    const app = makeApp({ id: 999 });
    const res = await request(app).get("/reports/my-events/1/volunteers");

    expect(res.status).toBe(200);
    expect(res.body.volunteers.length).toBe(1);
  });

  // ------------------------------------------------------------
  // 7) /reports/my-events/:id/assignments
  // ------------------------------------------------------------
  test("GET /reports/my-events/:id/assignments unauthorized", async () => {
    const app = makeApp(null);
    const res = await request(app).get("/reports/my-events/1/assignments");
    expect(res.status).toBe(401);
  });

  test("GET /reports/my-events/:id/assignments returns role summary", async () => {
    // event definition
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "Big Event",
            logistics: 5,
            logisticsfilled: 2,
            teaching: 3,
            teachingfilled: 1,
            firstaid: 0,
            firstaidfilled: 0,
            foodservice: 0,
            foodservicefilled: 0,
            eventsetup: 0,
            eventsetupfilled: 0,
            dataentry: 0,
            dataentryfilled: 0,
            customerservice: 0,
            customerservicefilled: 0,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 44,
            fullname: "Bob",
            username: "bob",
            email: "bob@email",
            skill: "logistics",
            hours: 5,
            status: "Registered",
          },
        ],
      });

    const app = makeApp({ id: 100 });
    const res = await request(app).get("/reports/my-events/1/assignments");

    expect(res.status).toBe(200);
    expect(res.body.rolesSummary.length).toBeGreaterThan(0);

    const logRole = res.body.rolesSummary.find((r) => r.role === "Logistics");
    expect(logRole.total).toBe(5);
    expect(logRole.filled).toBe(1);
  });

  // ------------------------------------------------------------
  // 8) /reports/event/:id
  // ------------------------------------------------------------
  test("GET /reports/event/:id event not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const app = makeApp();

    const res = await request(app).get("/reports/event/999");
    expect(res.status).toBe(404);
  });

  test("GET /reports/event/:id success", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: "Something",
          logistics: 2,
          logisticsfilled: 1,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/reports/event/1");

    expect(res.status).toBe(200);
    expect(res.body.event.name).toBe("Something");
    expect(res.body.roles.length).toBeGreaterThan(0);
  });
});
