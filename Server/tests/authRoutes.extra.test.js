// tests/authRoutes.extra.test.js
const request = require("supertest");
const app = require("../app");

describe("Auth (extra)", () => {
  test("POST /auth/login bad password -> 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "any", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/wrong password/i);
  });

  test("DELETE /auth/logout without Authorization header -> 400", async () => {
    const res = await request(app).delete("/auth/logout");
    expect(res.status).toBe(400);
  });

  test("DELETE /auth/logout with token -> 200", async () => {
    // first login with the hard-coded password to get a token
    const login = await request(app)
      .post("/auth/login")
      .send({ username: "demo", password: "ILoveFoodAndNoobs" });
    expect(login.status).toBe(200);
    const token = login.body.token;
    expect(typeof token).toBe("string");

    const res = await request(app)
      .delete("/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
