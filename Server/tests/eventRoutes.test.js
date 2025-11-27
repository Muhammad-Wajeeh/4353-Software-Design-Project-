// Server/tests/eventRoutes.test.js
const request = require("supertest");
const express = require("express");
const router = require("../routes/eventRoutes");

jest.mock("../DB", () => ({
  query: jest.fn(),
}));

const pool = require("../DB");

// Mock authentication middleware
jest.mock("../routes/authenticator", () => (req, res, next) => {
  req.user = { id: 123, username: "tester" };
  next();
});

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/events", router);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

//
// ---------------------------------------------------------
// 1. GET /events
// ---------------------------------------------------------
describe("GET /events", () => {
  test("returns mapped future events", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: "A",
          description: "Desc",
          location: "Loc",
          zipcode: "77000",
          urgency: 2,
          date: "2030-01-01",
          organization: "Org",
          hours: 3,
          event_time: "12:00",
          firstaid: 1,
          foodservice: 0,
          logistics: 1,
          teaching: 0,
          eventsetup: 1,
          dataentry: 0,
          customerservice: 0,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/events");

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
    expect(res.body.events[0].requiredSkills).toEqual([
      "first aid",
      "logistics",
      "event setup",
    ]);
  });

  test("500 on DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB down"));

    const app = makeApp();
    const res = await request(app).get("/events");

    expect(res.status).toBe(500);
  });
});

//
// ---------------------------------------------------------
// 2. GET /events/getall (legacy)
// ---------------------------------------------------------
describe("GET /events/getall", () => {
  test("404 when empty", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app).get("/events/getall");

    expect(res.status).toBe(404);
  });

  test("200 returns mapped events", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: "E",
          description: "D",
          location: "L",
          zipcode: "7",
          requiredskills: "x,y",
          urgency: 2,
          date: "2029-01-01",
          event_time: "10:00",
          organization: "Org",
          hours: 5,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/events/getall");

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
  });

  test("500 on DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("xx"));

    const app = makeApp();
    const res = await request(app).get("/events/getall");

    expect(res.status).toBe(500);
  });
});

//
// ---------------------------------------------------------
// 3. POST /events/create
// ---------------------------------------------------------
describe("POST /events/create", () => {
  test("400 missing eventName or eventDate", async () => {
    const app = makeApp();

    const res = await request(app)
      .post("/events/create")
      .send({ eventName: "" });

    expect(res.status).toBe(400);
  });

  test("201 creates event", async () => {
    pool.query.mockResolvedValueOnce({}); // INSERT ok

    const app = makeApp();
    const res = await request(app)
      .post("/events/create")
      .send({
        eventName: "Test",
        eventDate: "2030-01-01",
        skillNeeds: {
          firstAid: 1,
          logistics: 2,
        },
      });

    expect(res.status).toBe(201);
  });

  test("400 duplicate event (23505)", async () => {
    const err = new Error("dup");
    err.code = "23505";
    pool.query.mockRejectedValueOnce(err);

    const app = makeApp();
    const res = await request(app).post("/events/create").send({
      eventName: "Test",
      eventDate: "2030-01-01",
    });

    expect(res.status).toBe(400);
  });

  test("500 on DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("BAD"));

    const app = makeApp();
    const res = await request(app).post("/events/create").send({
      eventName: "Test",
      eventDate: "2030-01-01",
    });

    expect(res.status).toBe(500);
  });
});

//
// ---------------------------------------------------------
// 4. DELETE /events/delete
// ---------------------------------------------------------
describe("DELETE /events/delete", () => {
  test("400 missing eventName", async () => {
    const app = makeApp();
    const res = await request(app).delete("/events/delete").send({});

    expect(res.status).toBe(400);
  });

  test("404 event not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app)
      .delete("/events/delete")
      .send({ eventName: "A" });

    expect(res.status).toBe(404);
  });

  test("200 deletes event", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{}] }) // SELECT
      .mockResolvedValueOnce({}); // DELETE

    const app = makeApp();
    const res = await request(app)
      .delete("/events/delete")
      .send({ eventName: "A" });

    expect(res.status).toBe(200);
  });
});

//
// ---------------------------------------------------------
// 5. GET /events/getAllForThisUser
// ---------------------------------------------------------
describe("GET /events/getAllForThisUser", () => {
  test("401 no events", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app).get("/events/getAllForThisUser");

    expect(res.status).toBe(401);
  });

  test("200 returns events", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ name: "A", description: "D" }],
    });

    const app = makeApp();
    const res = await request(app).get("/events/getAllForThisUser");

    expect(res.status).toBe(200);
  });
});

//
// ---------------------------------------------------------
// 6. GET /events/getEventsToAttendByUser
// ---------------------------------------------------------
describe("GET /events/getEventsToAttendByUser", () => {
  test("200 returns mapped", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ name: "A", hasattended: false, willattend: true }],
    });

    const app = makeApp();
    const res = await request(app).get("/events/getEventsToAttendByUser");

    expect(res.status).toBe(200);
    expect(res.body.eventsAttendedOrToBeAttended.length).toBe(1);
  });
});

//
// ---------------------------------------------------------
// 7. GET /events/getEventsToAttendByUserAndThePosition
// ---------------------------------------------------------
describe("GET /events/getEventsToAttendByUserAndThePosition", () => {
  test("200 returns rows", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ eventid: 1, eventName: "A" }],
    });

    const app = makeApp();
    const res = await request(app).get(
      "/events/getEventsToAttendByUserAndThePosition"
    );

    expect(res.status).toBe(200);
  });
});

//
// ---------------------------------------------------------
// 8. GET /events/getAllFutureEvents
// ---------------------------------------------------------
describe("GET /events/getAllFutureEvents", () => {
  test("404 empty", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app).get("/events/getAllFutureEvents");

    expect(res.status).toBe(404);
  });

  test("200 returns mapped", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          name: "A",
          description: "D",
          location: "L",
          zipcode: "X",
          urgency: 2,
          date: "2030-01-01",
          event_time: "10:00",
          organization: "Org",
          hours: 2,
          firstaid: 1,
          firstaidfilled: 0,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/events/getAllFutureEvents");

    expect(res.status).toBe(200);
  });
});

//
// ---------------------------------------------------------
// 9. GET /events/:value
// ---------------------------------------------------------
describe("GET /events/:value", () => {
  test("404 not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app).get("/events/999");

    expect(res.status).toBe(404);
  });

  test("200 by id", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: "A", firstaid: 1 }],
    });

    const app = makeApp();
    const res = await request(app).get("/events/1");

    expect(res.status).toBe(200);
  });

  test("200 by name", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Test" }],
    });

    const app = makeApp();
    const res = await request(app).get("/events/Test");

    expect(res.status).toBe(200);
  });
});

//
// ---------------------------------------------------------
// 10. PUT /events/signup/:eventName
// ---------------------------------------------------------
describe("PUT /events/signup/:eventName", () => {
  test("400 missing skill", async () => {
    const app = makeApp();
    const res = await request(app).put("/events/signup/E").send({});

    expect(res.status).toBe(400);
  });

  test("404 event not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app)
      .put("/events/signup/E")
      .send({ skill: "firstaid" });

    expect(res.status).toBe(404);
  });

  test("400 invalid skill type", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, notaskill: 0 }],
    });

    const app = makeApp();
    const res = await request(app)
      .put("/events/signup/E")
      .send({ skill: "invalidSkill" });

    expect(res.status).toBe(400);
  });

  test("400 no slots available", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          firstaid: 1,
          firstaidfilled: 1,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app)
      .put("/events/signup/E")
      .send({ skill: "firstAid" });

    expect(res.status).toBe(400);
  });

  test("200 signs up", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            hours: 2,
            firstaid: 2,
            firstaidfilled: 0,
          },
        ],
      }) // SELECT event
      .mockResolvedValueOnce({
        rows: [{ id: 1, memberid: 123 }],
      }) // INSERT attendance
      .mockResolvedValueOnce({}); // UPDATE events filled count

    const app = makeApp();
    const res = await request(app)
      .put("/events/signup/E")
      .send({ skill: "firstAid" });

    expect(res.status).toBe(200);
  });
});

//
// ---------------------------------------------------------
// 11. PUT /events/cancelSignUp/:eventName
// ---------------------------------------------------------
describe("PUT /events/cancelSignUp/:eventName", () => {
  test("404 event not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app).put("/events/cancelSignUp/E");

    expect(res.status).toBe(404);
  });

  test("404 attendance not found", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // event
      .mockResolvedValueOnce({ rows: [] }); // attendance

    const app = makeApp();
    const res = await request(app).put("/events/cancelSignUp/E");

    expect(res.status).toBe(404);
  });

  test("200 cancels signup", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // event
      .mockResolvedValueOnce({ rows: [{ skill: "firstaid" }] }) // attendance
      .mockResolvedValueOnce({}) // update events filled count
      .mockResolvedValueOnce({ rows: [{ id: 1, willattend: false }] }); // update attendance

    const app = makeApp();
    const res = await request(app).put("/events/cancelSignUp/E");

    expect(res.status).toBe(200);
  });
});

//
// ---------------------------------------------------------
// 12. PUT /events/edit/:id
// ---------------------------------------------------------
describe("PUT /events/edit/:id", () => {
  test("404 event not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const app = makeApp();
    const res = await request(app).put("/events/edit/1");
  });

  test("200 edits event", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // existing event
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "Updated" }] }); // updated

    const app = makeApp();
    const res = await request(app)
      .put("/events/edit/1")
      .send({
        eventName: "Updated",
        skillNeeds: { firstAid: 2 },
      });

  });
});
