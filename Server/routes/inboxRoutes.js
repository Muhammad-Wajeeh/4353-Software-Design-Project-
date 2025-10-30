// Server/routes/inboxRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Normalize a DB row to API shape
const rowToApi = (r) => ({
  notification_id: r.notification_id,
  user_id: r.user_id,
  title: r.title,
  body: r.body ?? r.message ?? "",
  is_read: r.is_read,
  created_at: r.created_at,
  type: r.type || "general",
  meta: r.meta || {},
});

// GET /notifications/:userId?unreadOnly=1&limit=50
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadOnly = String(req.query.unreadOnly || "0") === "1";
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 200);

    const { rows } = await pool.query(
      `SELECT
          notification_id,
          user_id,
          title,
          message AS body,
          is_read,
          created_at,
          type,
          meta
         FROM notifications
        WHERE user_id = $1 ${unreadOnly ? "AND is_read = false" : ""}
        ORDER BY created_at DESC
        LIMIT $2`,
      [userId, limit]
    );

    res.json({ notifications: rows.map(rowToApi) });
  } catch (e) {
    console.error("GET /notifications/:userId error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /notifications  { user_id, title, body, type?, meta? }
router.post("/", async (req, res) => {
  try {
    const { user_id, title, body, type = "general", meta = {} } = req.body || {};
    if (!user_id || !title || !body) {
      return res.status(400).json({ message: "user_id, title, and body are required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, meta)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING notification_id, user_id, title, message AS body, is_read, created_at, type, meta`,
      [user_id, String(title).trim(), String(body).trim(), String(type).trim(), JSON.stringify(meta)]
    );

    res.status(201).json(rowToApi(rows[0]));
  } catch (e) {
    console.error("POST /notifications error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /notifications/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE notifications
          SET is_read = true
        WHERE notification_id = $1
        RETURNING notification_id, user_id, title, message AS body, is_read, created_at, type, meta`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rowToApi(rows[0]));
  } catch (e) {
    console.error("PUT /notifications/:id/read error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /notifications/:id/unread
router.put("/:id/unread", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE notifications
          SET is_read = false
        WHERE notification_id = $1
        RETURNING notification_id, user_id, title, message AS body, is_read, created_at, type, meta`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rowToApi(rows[0]));
  } catch (e) {
    console.error("PUT /notifications/:id/unread error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      `DELETE FROM notifications WHERE notification_id = $1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /notifications/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
