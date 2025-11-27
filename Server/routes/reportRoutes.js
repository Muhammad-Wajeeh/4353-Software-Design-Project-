// Server/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../DB");

/**
 * 1) VOLUNTEER PARTICIPATION SUMMARY
 *    - One row per volunteer
 *    - How many events they have entries for in the attendance table
 */

// JSON version
router.get("/volunteers", async (req, res) => {
  try {
    const q = await pool.query(
      `
      SELECT
        u.id,
        COALESCE(
          u.fullname,
          TRIM(COALESCE(u.firstname, '') || ' ' || COALESCE(u.lastname, ''))
        ) AS fullname,
        u.username,
        u.emailaddress AS email,
        COUNT(a.eventid) AS events_attended
      FROM userprofiles u
      LEFT JOIN attendance a
        ON a.memberid = u.id
      GROUP BY u.id, fullname, u.username, u.emailaddress
      ORDER BY fullname ASC;
      `
    );

    res.status(200).json({ volunteers: q.rows });
  } catch (err) {
    console.error("GET /reports/volunteers error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CSV download
router.get("/volunteers.csv", async (req, res) => {
  try {
    const q = await pool.query(
      `
      SELECT
        u.id,
        COALESCE(
          u.fullname,
          TRIM(COALESCE(u.firstname, '') || ' ' || COALESCE(u.lastname, ''))
        ) AS fullname,
        u.username,
        u.emailaddress AS email,
        COUNT(a.eventid) AS events_attended
      FROM userprofiles u
      LEFT JOIN attendance a
        ON a.memberid = u.id
      GROUP BY u.id, fullname, u.username, u.emailaddress
      ORDER BY fullname ASC;
      `
    );

    const header = ["id", "fullname", "username", "email", "events_attended"];
    const lines = [
      header.join(","), // header row
      ...q.rows.map((r) =>
        [
          r.id,
          JSON.stringify(r.fullname ?? ""),
          JSON.stringify(r.username ?? ""),
          JSON.stringify(r.email ?? ""),
          r.events_attended ?? 0,
        ].join(",")
      ),
    ];

    const csv = lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=volunteers_report.csv"
    );
    res.send(csv);
  } catch (err) {
    console.error("GET /reports/volunteers.csv error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 2) EVENT DETAILS + VOLUNTEER ASSIGNMENTS (summary)
 *    - One row per event
 *    - How many volunteers assigned (attendance rows)
 */

// JSON version
router.get("/events", async (req, res) => {
  try {
    const q = await pool.query(
      `
      SELECT
        e.id,
        e.name,
        e.date,
        e.location,
        e.description,
        COUNT(a.memberid) AS volunteers_assigned
      FROM events e
      LEFT JOIN attendance a
        ON a.eventid = e.id
      GROUP BY e.id, e.name, e.date, e.location, e.description
      ORDER BY e.date ASC, e.name ASC;
      `
    );

    res.status(200).json({ events: q.rows });
  } catch (err) {
    console.error("GET /reports/events error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CSV download
router.get("/events.csv", async (req, res) => {
  try {
    const q = await pool.query(
      `
      SELECT
        e.id,
        e.name,
        e.date,
        e.location,
        e.description,
        COUNT(a.memberid) AS volunteers_assigned
      FROM events e
      LEFT JOIN attendance a
        ON a.eventid = e.id
      GROUP BY e.id, e.name, e.date, e.location, e.description
      ORDER BY e.date ASC, e.name ASC;
      `
    );

    const header = [
      "id",
      "name",
      "date",
      "location",
      "description",
      "volunteers_assigned",
    ];

    const lines = [
      header.join(","),
      ...q.rows.map((r) =>
        [
          r.id,
          JSON.stringify(r.name ?? ""),
          JSON.stringify(
            r.date ? new Date(r.date).toISOString().slice(0, 10) : ""
          ),
          JSON.stringify(r.location ?? ""),
          JSON.stringify(r.description ?? ""),
          r.volunteers_assigned ?? 0,
        ].join(",")
      ),
    ];

    const csv = lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=events_report.csv"
    );
    res.send(csv);
  } catch (err) {
    console.error("GET /reports/events.csv error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
