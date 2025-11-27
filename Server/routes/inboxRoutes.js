// Server/routes/inboxRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../DB");
const authenticateToken = require("./authenticator");

// 🔹 Utility: Map DB row to API response
function mapNotification(row) {
  return {
    notificationId: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    isReminder: row.isreminder,
    isAssignment: row.isassignment,
    wasRead: row.wasread,
    dateReceived: row.datereceived,
  };
}

/**
 * GET /notifications/getAllForThisUser
 * Uses JWT to figure out the user; optional ?onlyUnread=true
 */
router.get("/getAllForThisUser", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // comes from the JWT payload

    const onlyUnread =
      String(req.query.onlyUnread || "false").toLowerCase() === "true";

    const query = `
      SELECT id, user_id, title, description, isreminder, isassignment, wasread, datereceived
      FROM notifications
      WHERE user_id = $1
      ${onlyUnread ? "AND wasread = FALSE" : ""}
      ORDER BY datereceived DESC
    `;

    const result = await pool.query(query, [userId]);

    const notifications = result.rows.map(mapNotification);
    // ✅ Always 200; empty array is fine
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err.message);
    res
      .status(500)
      .json({ error: "Server error while fetching notifications" });
  }
});

// 🔹 POST /notifications/createNotification
router.post("/createNotification", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // comes from the JWT payload
    const { title, description, isReminder, isAssignment } = req.body;

    if (!userId || !title || !description) {
      return res
        .status(400)
        .json({ message: "userId, title, and description are required" });
    }

    const insertQuery = `
      INSERT INTO notifications
        (user_id, title, description, isreminder, isassignment, wasread)
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING id, user_id, title, description, isreminder, isassignment, wasread, datereceived
    `;

    const values = [
      userId,
      title,
      description,
      Boolean(isReminder),
      Boolean(isAssignment),
    ];

    const result = await pool.query(insertQuery, values);
    const newNotification = mapNotification(result.rows[0]);

    res.status(201).json({
      message: "Notification created successfully",
      notification: newNotification,
    });
  } catch (err) {
    console.error("Error creating notification:", err.message);
    res.status(500).json({ error: "Server error while creating notification" });
  }
});

// 🔹 PUT /notifications/:id/markAsRead
router.put("/:id/markAsRead", async (req, res) => {
  try {
    const { id } = req.params;

    const updateQuery = `
      UPDATE notifications
      SET wasread = TRUE
      WHERE id = $1
      RETURNING id, user_id, title, description, isreminder, isassignment, wasread, datereceived
    `;

    const result = await pool.query(updateQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const updated = mapNotification(result.rows[0]);
    res
      .status(200)
      .json({ message: "Notification marked as read", notification: updated });
  } catch (err) {
    console.error("Error marking notification as read:", err.message);
    res.status(500).json({ error: "Server error while updating notification" });
  }
});

// 🔹 PUT /notifications/markAllAsReadForThisUser
router.put("/markAllAsReadForThisUser", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // comes from the JWT payload

    const result = await pool.query(
      `
      UPDATE notifications
      SET wasread = TRUE
      WHERE user_id = $1 AND wasread = FALSE
    `,
      [userId]
    );

    res.status(200).json({
      message: `Marked ${result.rowCount} notifications as read`,
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err.message);
    res
      .status(500)
      .json({ error: "Server error while updating notifications" });
  }
});

// 🔹 DELETE /notifications/delete/:id
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM notifications
      WHERE id = $1
      RETURNING id, user_id, title, description, isreminder, isassignment, wasread, datereceived
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
      notification: mapNotification(result.rows[0]),
    });
  } catch (err) {
    console.error("Error deleting notification:", err.message);
    res.status(500).json({ error: "Server error while deleting notification" });
  }
});

module.exports = router;
