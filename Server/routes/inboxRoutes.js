// Server/routes/inboxRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../DB");

// map DB row → frontend shape
const rowToNotif = (r) => ({
  id: r.id,
  user_id: r.user_id,
  title: r.title,
  description: r.description,
  isreminder: r.isreminder,
  isassignment: r.isassignment,
  wasread: r.wasread,
  datereceived: r.datereceived,
});

// -----------------------------
// GET /notifications/:user_id?onlyUnread=true
// -----------------------------
router.get("/:user_id", async (req, res) => {
  try {
    const onlyUnread = String(req.query.onlyUnread || "false").toLowerCase() === "true";
    const userId = Number(req.params.user_id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user_id" });
    }

    const sql = `
      SELECT id, user_id, title, description, isreminder, isassignment, wasread, datereceived
      FROM notifications
      WHERE user_id = $1
      ${onlyUnread ? "AND wasread = FALSE" : ""}
      ORDER BY datereceived DESC
    `;

    const { rows } = await pool.query(sql, [userId]);
    res.json({ notifications: rows.map(rowToNotif) });
  } catch (err) {
    console.error("GET /notifications/:user_id error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// -----------------------------
// POST /notifications
// -----------------------------
router.post("/", async (req, res) => {
  try {
    const { user_id, title, description, isreminder, isassignment } = req.body || {};
    const userId = Number(user_id);
    if (!userId || !title || !description) {
      return res.status(400).json({ message: "user_id, title, and description required" });
    }

    const insert = `
      INSERT INTO notifications
        (user_id, title, description, isreminder, isassignment, wasread)
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING id, user_id, title, description, isreminder, isassignment, wasread, datereceived
    `;
    const params = [
      userId,
      String(title),
      String(description),
      Boolean(isreminder),
      Boolean(isassignment),
    ];
    const { rows } = await pool.query(insert, params);
    res.status(201).json({ notification: rowToNotif(rows[0]) });
  } catch (err) {
    console.error("POST /notifications error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// -----------------------------
// PUT /notifications/:id/read
// -----------------------------
router.put("/:id/read", async (req, res) => {
  try {
    const notifId = Number(req.params.id);
    const { rows } = await pool.query(
      `UPDATE notifications
       SET wasread = TRUE
       WHERE id = $1
       RETURNING id, user_id, title, description, isreminder, isassignment, wasread, datereceived`,
      [notifId]
    );
    if (!rows.length) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: rowToNotif(rows[0]) });
  } catch (err) {
    console.error("PUT /notifications/:id/read error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// -----------------------------
// PUT /notifications/:user_id/read-all
// -----------------------------
router.put("/:user_id/read-all", async (req, res) => {
  try {
    const userId = Number(req.params.user_id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user_id" });
    }

    const { rowCount } = await pool.query(
      `UPDATE notifications
       SET wasread = TRUE
       WHERE user_id = $1 AND wasread = FALSE`,
      [userId]
    );
    res.json({ message: `Marked ${rowCount} as read` });
  } catch (err) {
    console.error("PUT /notifications/:user_id/read-all error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// -----------------------------
// DELETE /notifications/:id
// -----------------------------
router.delete("/:id", async (req, res) => {
  try {
    const notifId = Number(req.params.id);
    const { rows } = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1
       RETURNING id, user_id, title, description, isreminder, isassignment, wasread, datereceived`,
      [notifId]
    );
    if (!rows.length) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: rowToNotif(rows[0]) });
  } catch (err) {
    console.error("DELETE /notifications/:id error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

module.exports = router;
