// tests/authRoutes.test.js
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// mock DB connection
jest.mock("../DB", () => ({
  query: jest.fn(),
}));

// mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const pool = require("../DB");
const bcrypt = require("bcrypt");

const authRoutes = require("../routes/authRoutes");

const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";

// build test app
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);
  return app;
}

describe("Auth Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------
  // REGISTER
  // ---------------------------
  test("POST /auth/register -> success", async () => {
    bcrypt.hash.mockResolvedValue("hashed_pw");
    pool.query.mockResolvedValue({ rows: [] });

    const app = makeApp();

    const res = await request(app).post("/auth/register").send({
      firstName: "John",
      lastName: "Doe",
      username: "johnd",
      email: "john@example.com",
      password: "pass123",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account Created");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO userprofiles"),
      ["John", "Doe", "johnd", "john@example.com", "hashed_pw"]
    );
  });

  test("POST /auth/register -> DB error", async () => {
    bcrypt.hash.mockResolvedValue("hashed_pw");
    pool.query.mockRejectedValue(new Error("DB insert failed"));

    const app = makeApp();

    const res = await request(app).post("/auth/register").send({
      firstName: "John",
      lastName: "Doe",
      username: "johnd",
      email: "john@example.com",
      password: "pass123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Registration failed");
  });

  // ---------------------------
  // LOGIN
  // ---------------------------
  test("POST /auth/login -> user not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const app = makeApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "nouser", password: "pass" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("POST /auth/login -> invalid password", async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1, password: "hashed_pw" }],
    });

    bcrypt.compare.mockResolvedValue(false);

    const app = makeApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "john", password: "wrongpw" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("POST /auth/login -> DB server error", async () => {
    pool.query.mockRejectedValue(new Error("DB down"));

    const app = makeApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "john", password: "testpw" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Server error");
  });

  test("POST /auth/login -> success returns valid JWT", async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 123, password: "hashed_pw" }],
    });

    bcrypt.compare.mockResolvedValue(true);

    const app = makeApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "john", password: "correctpw" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login Successful");

    const token = res.body.token;
    expect(typeof token).toBe("string");

    // decode token to ensure it's valid
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.username).toBe("john");
    expect(decoded.id).toBe(123);
  });
});
