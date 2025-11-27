// tests/authenticator.test.js
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../routes/authenticator.js");

const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";

// build a minimal test app using the middleware
function makeApp() {
  const app = express();
  app.get("/protected", authenticateToken, (req, res) => {
    res.status(200).json({ message: "ok", user: req.user });
  });
  return app;
}

describe("authenticateToken middleware", () => {
  test("no Authorization header -> 401", async () => {
    const app = makeApp();
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  test("invalid token -> 403", async () => {
    const app = makeApp();
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer WRONGTOKEN");

    expect(res.status).toBe(403);
  });

  test("valid token -> 200 and user decoded", async () => {
    const app = makeApp();
    const payload = { id: "u123", role: "member" };
    const token = jwt.sign(payload, JWT_SECRET);

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("ok");
    expect(res.body.user.id).toBe("u123");
  });
});
