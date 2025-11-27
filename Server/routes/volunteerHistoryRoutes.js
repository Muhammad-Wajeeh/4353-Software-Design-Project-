const express = require("express");
const router = express.Router();
const pool = require("../DB");
const authenticateToken = require("./authenticator");

// ✅ UPDATED: return full event info for history
router.get("/getVolunteerHistory", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // from JWT

    const sql = `
      SELECT
        e.id,

        -- names / dates (both plain + aliases so frontend is happy)
        e.name              AS name,
        e.name              AS "eventName",
        e.date              AS date,
        e.date              AS "eventDate",

        e.organization,
        e.location,
        e.description,
        e.event_time,
        e.hours,

        -- slot counts
        e.firstaid,
        e.foodservice,
        e.logistics,
        e.teaching,
        e.eventsetup,
        e.dataentry,
        e.customerservice,

        -- filled counts
        e.firstaidfilled,
        e.foodservicefilled,
        e.logisticsfilled,
        e.teachingfilled,
        e.eventsetupfilled,
        e.dataentryfilled,
        e.customerservicefilled

        -- you CAN also return a.hoursvolunteered, a.skill if you want
      FROM attendance AS a
      JOIN events     AS e ON a.eventid = e.id
      WHERE a.memberid   = $1
        AND a.hasattended = true
      ORDER BY e.date DESC, e.event_time ASC;
    `;

    const result = await pool.query(sql, [userId]);
    const rows = result.rows;

    // Support both shapes the frontend looks for
    return res.status(200).json({
      pastEvents: rows,
      history: { events: rows },
    });
  } catch (e) {
    console.error("GET /history/getVolunteerHistory error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// leave this route exactly as you had it
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
