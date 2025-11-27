// Server/tests/historyRoutes.test.js
const request = require("supertest");
const express = require("express");

jest.mock("../DB", () => ({ query: jest.fn() }));
jest.mock("../routes/authenticator", () =>
  jest.fn((req, res, next) => {
    req.user = { id: 123, username: "demoUser" }; // mock JWT user
    next();
  })
);

const pool = require("../DB");
const historyRoutes = require("../routes/volunteerHistoryRoutes");

// build small express app for testing
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/history", historyRoutes);
  return app;
}

describe("History Routes", () => {
  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------
  // GET /history/getVolunteerHistory
  // ---------------------------------------------------
  test("GET /getVolunteerHistory → returns past events", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          id: 1,
          name: "Food Drive",
          eventName: "Food Drive",
          date: "2025-01-01",
          eventDate: "2025-01-01",
          organization: "SASE",
          location: "UH",
          description: "desc",
          event_time: "10:00",
          hours: 3,
          firstaid: 1,
          foodservice: 0,
          logistics: 1,
          teaching: 0,
          eventsetup: 0,
          dataentry: 0,
          customerservice: 0,
          firstaidfilled: 1,
          foodservicefilled: 0,
          logisticsfilled: 1,
          teachingfilled: 0,
          eventsetupfilled: 0,
          dataentryfilled: 0,
          customerservicefilled: 0,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get("/history/getVolunteerHistory");

    expect(res.status).toBe(200);
    expect(res.body.pastEvents.length).toBe(1);
    expect(res.body.history.events.length).toBe(1);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [123]);
  });

  test("GET /getVolunteerHistory → DB error", async () => {
    pool.query.mockRejectedValue(new Error("DB failure"));

    const app = makeApp();
    const res = await request(app).get("/history/getVolunteerHistory");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Server error");
  });

  // ---------------------------------------------------
  // PATCH /history/updateAttendanceHistory
  // ---------------------------------------------------
  test("PATCH /updateAttendanceHistory → success", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          eventid: 1,
          memberid: 123,
          hasattended: true,
          willattend: false,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).patch("/history/updateAttendanceHistory");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Attendance updated successfully");
    expect(res.body.updatedRecords.length).toBe(1);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [123]);
  });

  test("PATCH /updateAttendanceHistory → DB error", async () => {
    pool.query.mockRejectedValue(new Error("SQL fail"));

    const app = makeApp();
    const res = await request(app).patch("/history/updateAttendanceHistory");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Server error");
  });
});
