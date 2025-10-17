const request = require("supertest");
const app = require("../app");
const { __resetAll, users } = require("../data/mockData");

beforeEach(() => __resetAll());

describe("Profile Routes", () => {
  test("GET /profile/u1 returns profile without password", async () => {
    const res = await request(app).get("/profile/u1");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.name).toBe("Demo User");
  });

  test("PUT /profile/u1 validates zip", async () => {
    const res = await request(app).put("/profile/u1").send({ zip: "abcde" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining(["zip must be 5 or 9 digits"]));
  });

  test("PUT /profile/u1 updates name and address", async () => {
    const payload = {
      name: "Updated User",
      address1: "999 New St",
      city: "Katy",
      state: "TX",
      zip: "77449",
    };
    const res = await request(app).put("/profile/u1").send(payload);
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Updated User");
    expect(res.body.user.address1).toBe("999 New St");
    // live array mutated:
    expect(users[0].city).toBe("Katy");
  });
});
