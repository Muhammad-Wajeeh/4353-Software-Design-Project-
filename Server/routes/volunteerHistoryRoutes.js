const express = require("express");
const router = express.Router();
const pool = require("../DB");
const authenticateToken = require("./authenticator");

router.get("/getVolunteerHistory", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // comes from the JWT payload
    // Query attendance records joined with events
    const queryResult = await pool.query(
      "SELECT e.name, e.date, e.organization FROM attendance AS a JOIN events as e ON a.eventid = e.id where a.memberid = $1 and a.hasattended = true",
      [userId]
    );

    return res.status(200).json({ pastEvents: queryResult.rows });
  } catch (e) {
    console.error("GET /history/:userId error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch(
  "/updateAttendanceHistory",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id; // comes from JWT payload

      const queryResult = await pool.query(
        `UPDATE attendance AS a
       SET hasattended = true,
           willattend = false
       FROM events AS e
       WHERE a.eventid = e.id
         AND a.memberid = $1
         AND (e.date + e.event_time) < NOW()
       RETURNING a.*`,
        [userId]
      );

      res.status(200).json({
        message: "Attendance updated successfully",
        updatedRecords: queryResult.rows,
      });
    } catch (e) {
      console.error("PATCH /updateAttendanceHistory error:", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
