// tests/profileRoutes.test.js
const request = require("supertest");
const app = require("../app");
const pool = require("../DB");

let testUser;

beforeAll(async () => {
  // Pick any existing user from userprofiles
  const q = await pool.query(
    `SELECT id, fullname, city, state, zip, address1
       FROM userprofiles
       ORDER BY id
       LIMIT 1`
  );

  if (!q.rowCount) {
    throw new Error(
      "No rows found in userprofiles table. Seed at least one user before running tests."
    );
  }

  testUser = q.rows[0];
});

describe("Profile Routes (Postgres)", () => {
  test("GET /profile/:id returns profile without password", async () => {
    const res = await request(app).get(`/profile/${testUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();

    // id should match and be string in API
    expect(res.body.user.id).toBe(String(testUser.id));

    // rowToUser never exposes password
    expect(res.body.user.password).toBeUndefined();

    // basic sanity on the shape
    expect(typeof res.body.user.name).toBe("string");
  });

  test("PUT /profile/:id validates zip", async () => {
    const res = await request(app)
      .put(`/profile/${testUser.id}`)
      .send({ zip: "abcde" }); // invalid: not digits

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors).toEqual(
      expect.arrayContaining(["zip must be 5 or 9 digits"])
    );
  });

  test("PUT /profile/:id updates name and address", async () => {
    const payload = {
      name: "Updated User Jest",
      address1: "999 New St",
      city: "Katy",
      state: "TX",
      zip: "77449",
    };

    const res = await request(app)
      .put(`/profile/${testUser.id}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();

    expect(res.body.user.name).toBe(payload.name);
    expect(res.body.user.address1).toBe(payload.address1);
    expect(res.body.user.city).toBe(payload.city);
    expect(res.body.user.state).toBe(payload.state);
    expect(res.body.user.zip).toBe(payload.zip);
  });
});
