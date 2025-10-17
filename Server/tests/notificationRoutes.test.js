const request = require("supertest");
const app = require("../app");
const { __resetAll, notifications } = require("../data/mockData");

beforeEach(() => __resetAll());

describe("Notifications", () => {
  test("GET /notifications/u1 returns unread when ?onlyUnread=true", async () => {
    const res = await request(app).get("/notifications/u1").query({ onlyUnread: true });
    expect(res.status).toBe(200);
    const list = res.body.notifications;
    expect(Array.isArray(list)).toBe(true);
    expect(list.every(n => n.read === false)).toBe(true);
  });

  test("POST /notifications creates a new notification", async () => {
    const res = await request(app).post("/notifications").send({
      userId: "u1",
      type: "update",
      title: "New update",
      message: "Test message",
    });
    expect(res.status).toBe(201);
    expect(res.body.notification).toMatchObject({
      userId: "u1",
      type: "update",
      title: "New update",
      message: "Test message",
      read: false,
    });
    expect(notifications.find(n => n.id === res.body.notification.id)).toBeTruthy();
  });

  test("PATCH /notifications/:id/read marks one as read", async () => {
    const id = notifications[0].id;
    const res = await request(app).patch(`/notifications/${id}/read`);
    expect(res.status).toBe(200);
    expect(res.body.notification.read).toBe(true);
  });

  test("PATCH /notifications/u1/read-all marks all as read", async () => {
    const res = await request(app).patch("/notifications/u1/read-all");
    expect(res.status).toBe(200);
    expect(notifications.filter(n => n.userId === "u1").every(n => n.read)).toBe(true);
  });

  test("DELETE /notifications/:id removes notification", async () => {
    const id = notifications[0].id;
    const res = await request(app).delete(`/notifications/${id}`);
    expect(res.status).toBe(200);
    expect(notifications.find(n => n.id === id)).toBeFalsy();
  });
});
