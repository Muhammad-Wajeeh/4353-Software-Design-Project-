// tests/inboxRoutes.test.js
const request = require("supertest");
const app = require("../app");
const pool = require("../DB");
const jwt = require("jsonwebtoken");

let testUserId;
let jwtSecret;

// Helper: make a valid token for the test user
const makeToken = () =>
  jwt.sign({ id: testUserId }, jwtSecret, { expiresIn: "1h" });

beforeAll(async () => {
  jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET must be set in the environment for notification tests"
    );
  }

  // Grab any existing user from userprofiles
  const q = await pool.query(
    `SELECT id
       FROM userprofiles
       ORDER BY id
       LIMIT 1`
  );

  if (!q.rowCount) {
    throw new Error(
      "No rows found in userprofiles table. Seed at least one user before running tests."
    );
  }

  testUserId = q.rows[0].id;
});

// Clean up only JEST_TEST_* notifications for this user before each test
beforeEach(async () => {
  await pool.query(
    `DELETE FROM notifications
      WHERE user_id = $1
        AND title LIKE 'JEST_TEST_%'`,
    [testUserId]
  );
});

describe("Notifications (inboxRoutes + Postgres)", () => {
  test("GET /notifications/getAllForThisUser returns only unread when ?onlyUnread=true", async () => {
    // Insert 2 unread + 1 read notification for this user
    await pool.query(
      `INSERT INTO notifications
         (user_id, title, description, isreminder, isassignment, wasread)
       VALUES
         ($1, 'JEST_TEST_unread1', 'msg', FALSE, FALSE, FALSE),
         ($1, 'JEST_TEST_unread2', 'msg', FALSE, FALSE, FALSE),
         ($1, 'JEST_TEST_read',    'msg', FALSE, FALSE, TRUE)`,
      [testUserId]
    );

    const token = makeToken();
    const res = await request(app)
      .get("/notifications/getAllForThisUser")
      .set("Authorization", `Bearer ${token}`)
      .query({ onlyUnread: true });

    expect(res.status).toBe(200);
    const list = res.body.notifications;
    expect(Array.isArray(list)).toBe(true);
    // Only the 2 unread ones
    expect(list.length).toBe(2);
    expect(list.every((n) => n.wasRead === false)).toBe(true);
  });

  test("POST /notifications/createNotification creates a new notification for current user", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/notifications/createNotification")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "JEST_TEST_new",
        description: "Test description",
        isReminder: false,
        isAssignment: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.notification).toMatchObject({
      userId: testUserId,
      title: "JEST_TEST_new",
      description: "Test description",
      isReminder: false,
      isAssignment: true,
      wasRead: false,
    });

    // Verify that it actually exists in the DB
    const check = await pool.query(
      `SELECT *
         FROM notifications
        WHERE id = $1`,
      [res.body.notification.notificationId]
    );
    expect(check.rowCount).toBe(1);
  });

  test("PUT /notifications/:id/markAsRead marks one as read", async () => {
    const insert = await pool.query(
      `INSERT INTO notifications
         (user_id, title, description, isreminder, isassignment, wasread)
       VALUES
         ($1, 'JEST_TEST_mark', 'msg', FALSE, FALSE, FALSE)
       RETURNING id`,
      [testUserId]
    );
    const id = insert.rows[0].id;

    const res = await request(app).put(
      `/notifications/${id}/markAsRead`
    );

    expect(res.status).toBe(200);
    expect(res.body.notification.wasRead).toBe(true);

    const check = await pool.query(
      `SELECT wasread
         FROM notifications
        WHERE id = $1`,
      [id]
    );
    expect(check.rows[0].wasread).toBe(true);
  });

  test("PUT /notifications/markAllAsReadForThisUser marks all unread as read", async () => {
    // 2 unread + 1 already read
    await pool.query(
      `INSERT INTO notifications
         (user_id, title, description, isreminder, isassignment, wasread)
       VALUES
         ($1, 'JEST_TEST_unread1', 'msg', FALSE, FALSE, FALSE),
         ($1, 'JEST_TEST_unread2', 'msg', FALSE, FALSE, FALSE),
         ($1, 'JEST_TEST_already', 'msg', FALSE, FALSE, TRUE)`,
      [testUserId]
    );

    const token = makeToken();
    const res = await request(app)
      .put("/notifications/markAllAsReadForThisUser")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const check = await pool.query(
      `SELECT wasread
         FROM notifications
        WHERE user_id = $1
          AND title LIKE 'JEST_TEST_%'`,
      [testUserId]
    );

    expect(check.rows.length).toBe(3);
    expect(check.rows.every((r) => r.wasread === true)).toBe(true);
  });

  test("DELETE /notifications/delete/:id removes notification", async () => {
    const insert = await pool.query(
      `INSERT INTO notifications
         (user_id, title, description, isreminder, isassignment, wasread)
       VALUES
         ($1, 'JEST_TEST_delete', 'msg', FALSE, FALSE, FALSE)
       RETURNING id`,
      [testUserId]
    );
    const id = insert.rows[0].id;

    const res = await request(app).delete(
      `/notifications/delete/${id}`
    );

    expect(res.status).toBe(200);

    const check = await pool.query(
      `SELECT id
         FROM notifications
        WHERE id = $1`,
      [id]
    );
    expect(check.rowCount).toBe(0);
  });
});
