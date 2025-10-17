// tests/notificationRoutes.extra.test.js
const request = require("supertest");
const app = require("../app");
const { __resetAll } = require("../data/mockData");

beforeEach(() => __resetAll());

describe("Notifications (extra)", () => {
  test("POST /notifications missing required fields -> 400", async () => {
    const res = await request(app).post("/notifications").send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test("POST /notifications type=assignment without meta.eventId -> 400", async () => {
    const res = await request(app).post("/notifications").send({
      userId: "u1",
      type: "assignment",
      title: "Join event",
      message: "Please join",
      meta: {} // missing eventId
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.join(" ")).toMatch(/meta\.eventId/i);
  });

  test("POST /notifications type=assignment duplicate -> 409", async () => {
    // first create
    const first = await request(app).post("/notifications").send({
      userId: "u1",
      type: "assignment",
      title: "First",
      message: "First request",
      meta: { eventId: "e1" }
    });
    expect(first.status).toBe(201);

    // duplicate for same user + event
    const dup = await request(app).post("/notifications").send({
      userId: "u1",
      type: "assignment",
      title: "Dup",
      message: "Dup request",
      meta: { eventId: "e1" }
    });
    expect(dup.status).toBe(409);
    expect(dup.body.message).toMatch(/already requested/i);
  });

  test("PATCH /notifications/:userId/read-all marks unread as read", async () => {
    const getUnread = await request(app).get("/notifications/u1?onlyUnread=true");
    expect(getUnread.status).toBe(200);
    const before = getUnread.body.notifications.length;
    expect(before).toBeGreaterThan(0);

    const readAll = await request(app).patch("/notifications/u1/read-all");
    expect(readAll.status).toBe(200);

    const getUnreadAfter = await request(app).get("/notifications/u1?onlyUnread=true");
    expect(getUnreadAfter.status).toBe(200);
    expect(getUnreadAfter.body.notifications.length).toBe(0);
  });
});
