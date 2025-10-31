const express = require("express");
const router = express.Router();
const pool = require("../DB");

// GET /history/:userId — all completed events for this user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Query attendance records joined with events
    const { rows } = await pool.query(
      `
      SELECT
        a.memberid AS user_id,
        e.id AS event_id,
        e.name AS event_name,
        e.description AS event_description,
        e.location AS event_location,
        e.organization AS organization,
        e.date AS event_date,
        a.hasattended,
        a.hoursvolunteered
      FROM attendance a
      JOIN events e ON e.id = a.eventid
      WHERE a.memberid = $1
        AND a.hasattended = TRUE
      ORDER BY e.date DESC;
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "No volunteer history found for this user" });
    }

    // Map data into a clear shape for your frontend
    const history = {
      userId,
      events: rows.map((r) => ({
        eventId: r.event_id,
        eventName: r.event_name,
        eventDescription: r.event_description,
        eventLocation: r.event_location,
        organization: r.organization,
        date: r.event_date,
        status: r.hasattended ? "Completed" : "Pending",
        hours: r.hoursvolunteered || 0,
      })),
    };

    res.status(200).json({ history });
  } catch (e) {
    console.error("GET /history/:userId error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
