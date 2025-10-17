const request = require("supertest");
const app = require("../app");

describe("Auth", () => {
  test("POST /auth/login succeeds with temp password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "someone", password: "ILoveFoodAndNoobs" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("POST /auth/login fails with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "someone", password: "nope" });
    expect(res.status).toBe(401);
  });
});
