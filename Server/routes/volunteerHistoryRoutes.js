// Server/routes/volunteerHistoryRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db"); // adjust to ../server/db if your db.js is there

// Shape DB row -> FE event object
function rowToHistoryEvent(r) {
  return {
    eventId: r.event_id,
    eventName: r.event_name,
    organization: r.organization,
    date: r.event_date,           // DATE comes back as 'YYYY-MM-DD' from pg by default
    hours: Number(r.hours || 0),
    status: r.status,             // 'Completed' | 'Upcoming' | 'Cancelled'
  };
}

/**
 * GET /history/:userId
 * Returns the user’s participation joined with event details in the FE shape.
 * If no rows, we return 200 with an empty events array (nicer UX).
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { rows } = await pool.query(
      `SELECT vh.event_id,
              vh.status,
              vh.hours,
              e.event_name,
              e.organization,
              e.event_date
         FROM volunteer_history vh
         JOIN event_details e ON e.event_id = vh.event_id
        WHERE vh.user_id = $1
        ORDER BY e.event_date DESC, vh.recorded_at DESC`,
      [userId]
    );

    const history = {
      userId,
      events: rows.map(rowToHistoryEvent),
    };

    // Keep it simple for the FE: always 200, with an empty list if none.
    return res.status(200).json({ history });
  } catch (err) {
    console.error("GET /history/:userId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
