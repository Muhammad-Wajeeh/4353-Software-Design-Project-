const request = require("supertest");
const app = require("../app");
const { __resetAll, events } = require("../data/mockData");

beforeEach(() => __resetAll());

describe("Events", () => {
  test("GET /events returns list", async () => {
    const res = await request(app).get("/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);
  });

  test("GET /events/:id returns event", async () => {
    const id = events[0].id;
    const res = await request(app).get(`/events/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.id).toBe(id);
  });

  test("GET /events/bad returns 404", async () => {
    const res = await request(app).get("/events/does-not-exist");
    expect(res.status).toBe(404);
  });
});
