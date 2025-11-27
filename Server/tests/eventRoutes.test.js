// Server/tests/eventRoutes.test.js
const request = require("supertest");
const express = require("express");

jest.mock("../DB", () => ({ query: jest.fn() }));
jest.mock("../routes/authenticator", () =>
  jest.fn((req, res, next) => {
    req.user = { id: 1, username: "demo" }; // mock authenticated user
    next();
  })
);

const pool = require("../DB");
const eventRoutes = require("../routes/eventRoutes");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/events", eventRoutes);
  return app;
}

describe("Event Routes", () => {
  afterEach(() => jest.clearAllMocks());

  // -----------------------------------------
  // GET /events (Volunteer matching)
  // -----------------------------------------
  test("GET /events → returns normalized events", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          id: 1,
          name: "Food Drive",
          description: "Help pack meals",
          location: "UH",
          zipcode: "77004",
          urgency: 2,
          date: "2025-12-01",
          organization: "SASE",
          hours: 3,
          event_time: "10:00",
          firstaid: 1,
          foodservice: 0,
          logistics: 1,
          teaching: 0,
          eventsetup: 0,
          dataentry: 0,
          customerservice: 1,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/events");

    expect(res.status).toBe(200);
    expect(res.body.events[0]).toMatchObject({
      id: "1",
      name: "Food Drive",
      requiredSkills: ["first aid", "logistics", "customer service"],
    });
  });

  test("GET /events → DB error", async () => {
    pool.query.mockRejectedValue(new Error("DB fail"));

    const app = makeApp();
    const res = await request(app).get("/events");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Server error while fetching events");
  });

  // -----------------------------------------
  // GET /events/getall
  // -----------------------------------------
  test("GET /events/getall → empty", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const app = makeApp();
    const res = await request(app).get("/events/getall");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No events found");
  });

  test("GET /events/getall → success", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          name: "Food Drive",
          description: "desc",
          location: "UH",
          zipcode: "77004",
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/events/getall");

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
  });

  // -----------------------------------------
  // POST /events/create
  // -----------------------------------------
  test("POST /events/create → missing fields", async () => {
    const app = makeApp();
    const res = await request(app).post("/events/create").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/eventName and eventDate/);
  });

  test("POST /events/create → success", async () => {
    pool.query.mockResolvedValue({});

    const app = makeApp();
    const res = await request(app)
      .post("/events/create")
      .send({
        eventName: "Cleanup",
        eventDescription: "desc",
        eventLocation: "UH",
        eventZipCode: "77004",
        eventUrgency: "High",
        eventDate: "2025-12-01",
        eventTime: "10:00",
        skillNeeds: { firstAid: 1 },
      });

    expect(res.status).toBe(201);
    expect(res.body).toBe("Event Created");
  });

  test("POST /events/create → duplicate name (23505)", async () => {
    pool.query.mockRejectedValue({ code: "23505" });

    const app = makeApp();
    const res = await request(app).post("/events/create").send({
      eventName: "Dup",
      eventDescription: "x",
      eventLocation: "x",
      eventDate: "2025-11-01",
      skillNeeds: {},
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Event name already exists");
  });

  // -----------------------------------------
  // DELETE /events/delete
  // -----------------------------------------
  test("DELETE /events/delete → missing name", async () => {
    const app = makeApp();
    const res = await request(app).delete("/events/delete").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("eventName is required");
  });

  test("DELETE /events/delete → success", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ name: "Cleanup" }] }) // existing
      .mockResolvedValueOnce({}); // deletion

    const app = makeApp();
    const res = await request(app)
      .delete("/events/delete")
      .send({ eventName: "Cleanup" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/);
  });

  // -----------------------------------------
  // GET /events/getAllForThisUser
  // -----------------------------------------
  test("GET /events/getAllForThisUser → no events", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const app = makeApp();
    const res = await request(app).get("/events/getAllForThisUser");

    expect(res.status).toBe(401);
  });

  test("GET /events/getAllForThisUser → success", async () => {
    pool.query.mockResolvedValue({
      rows: [{ name: "Cleanup", location: "UH", zipcode: "77004" }],
    });

    const app = makeApp();
    const res = await request(app).get("/events/getAllForThisUser");

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
  });

  // -----------------------------------------
  // PUT /events/signup/:eventName
  // -----------------------------------------
  test("PUT /signup/:ev → invalid skill", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, logistics: 1, logisticsfilled: 0 }],
    });

    const app = makeApp();
    const res = await request(app)
      .put("/events/signup/FoodDrive")
      .send({ skill: "WRONGSKILL" });

    expect(res.status).toBe(400);
  });

  test("PUT /signup/:ev → success", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            logistics: 3,
            logisticsfilled: 1,
            hours: 3,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // attendance insert
      .mockResolvedValueOnce({}); // event update

    const app = makeApp();
    const res = await request(app)
      .put("/events/signup/FoodDrive")
      .send({ skill: "logistics" });

    expect(res.status).toBe(200);
  });

  // -----------------------------------------
  // PUT /cancelSignUp/:eventName
  // -----------------------------------------
  test("PUT /cancelSignUp/:ev → event not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app).put("/events/cancelSignUp/BadEvent");

    expect(res.status).toBe(404);
  });

  // -----------------------------------------
  // GET /events/:value (numeric or string)
  // -----------------------------------------
  test("GET /events/:value → not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const app = makeApp();
    const res = await request(app).get("/events/9999");

    expect(res.status).toBe(404);
  });

  test("GET /events/:value → returns event", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          id: 1,
          name: "Cleanup",
          description: "desc",
          location: "UH",
          zipcode: "77004",
          urgency: 2,
          date: "2025-12-01",
          event_time: "10:00",
          organization: "SASE",
          hours: 3,
          firstaid: 1,
          foodservice: 0,
          logistics: 1,
          teaching: 0,
          eventsetup: 0,
          dataentry: 0,
          customerservice: 0,
          firstaidfilled: 0,
          foodservicefilled: 0,
          logisticsfilled: 0,
          teachingfilled: 0,
          eventsetupfilled: 0,
          dataentryfilled: 0,
          customerservicefilled: 0,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/events/Cleanup");

    expect(res.status).toBe(200);
    expect(res.body.eventName).toBe("Cleanup");
  });
});
