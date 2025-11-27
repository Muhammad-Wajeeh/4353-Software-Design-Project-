const express = require("express");
const router = express.Router();
const pool = require("../DB");

// ============================================================
// Helpers
// ============================================================

const ROLE_GROUPS = {
  physical: [
    { key: "firstaid", label: "First Aid" },
    { key: "foodservice", label: "Food Service" },
    { key: "logistics", label: "Logistics" },
    { key: "eventsetup", label: "Event Setup" },
  ],
  admin: [
    { key: "teaching", label: "Teaching" },
    { key: "dataentry", label: "Data Entry" },
    { key: "customerservice", label: "Customer Service" },
  ],
};

function labelForKey(key) {
  for (const group of Object.values(ROLE_GROUPS)) {
    const found = group.find((r) => r.key === key);
    if (found) return found.label;
  }
  return key;
}

function buildEventRoleSummary(eventRow) {
  const formatted = [];

  Object.values(ROLE_GROUPS).forEach((group) => {
    group.forEach(({ key, label }) => {
      const total = Number(eventRow[key]) || 0;
      const filled = Number(eventRow[`${key}filled`]) || 0;
      const remaining = total - filled;

      formatted.push({
        role: label,
        total,
        filled,
        remaining,
      });
    });
  });

  return formatted;
}

// ============================================================
// 1) VOLUNTEER PARTICIPATION SUMMARY (GLOBAL)
// ============================================================

router.get("/volunteers", async (req, res) => {
  try {
    const q = await pool.query(
      `
      SELECT
        u.id,
        COALESCE(u.fullname,
          TRIM(COALESCE(u.firstname,'') || ' ' || COALESCE(u.lastname,''))) AS fullname,
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
    res.json({ volunteers: q.rows });
  } catch (err) {
    console.error("Error /reports/volunteers:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CSV export (global volunteers)
router.get("/volunteers.csv", async (req, res) => {
  try {
    const q = await pool.query(
      `
      SELECT
        u.id,
        COALESCE(u.fullname,
          TRIM(COALESCE(u.firstname,'') || ' ' || COALESCE(u.lastname,''))) AS fullname,
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
      header.join(","),
      ...q.rows.map((v) =>
        [
          v.id,
          JSON.stringify(v.fullname || ""),
          JSON.stringify(v.username || ""),
          JSON.stringify(v.email || ""),
          v.events_attended || 0,
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
    console.error("Error /reports/volunteers.csv:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 2) ALL EVENT ASSIGNMENTS (GLOBAL)
// ============================================================

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

    res.json({ events: q.rows });
  } catch (err) {
    console.error("Error /reports/events:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CSV export (global events)
router.get("/events.csv", async (req, res) => {
  try {
    const q = await pool.query(`
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
    `);

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
      ...q.rows.map((e) =>
        [
          e.id,
          JSON.stringify(e.name),
          JSON.stringify(
            e.date ? new Date(e.date).toISOString().slice(0, 10) : ""
          ),
          JSON.stringify(e.location),
          JSON.stringify(e.description),
          e.volunteers_assigned || 0,
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
    console.error("Error /reports/events.csv:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 3) YOUR EVENTS (for dropdown list)
// ============================================================

router.get("/my-events", async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const q = await pool.query(
      `
      SELECT id, name, date
      FROM events
      WHERE creatorid = $1
      ORDER BY date ASC, name ASC;
      `,
      [userId]
    );

    res.json({ events: q.rows });
  } catch (err) {
    console.error("Error /reports/my-events:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 4) PER-EVENT VOLUNTEERS + HISTORY (only for your events)
// ============================================================

router.get("/my-events/:eventId/volunteers", async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Make sure the event belongs to this user
    const evQ = await pool.query(
      `
      SELECT id, name, date, location, description
      FROM events
      WHERE id = $1 AND creatorid = $2
      `,
      [eventId, userId]
    );

    if (!evQ.rows.length) {
      return res
        .status(404)
        .json({ message: "Event not found or not created by you" });
    }

    const event = evQ.rows[0];

    // Volunteers at this event + their overall history
    const vQ = await pool.query(
      `
      SELECT
        u.id,
        COALESCE(u.fullname,
          TRIM(COALESCE(u.firstname,'') || ' ' || COALESCE(u.lastname,''))) AS fullname,
        u.username,
        u.emailaddress AS email,
        COUNT(a_all.eventid)                                  AS total_events,
        COALESCE(SUM(a_all.hoursvolunteered), 0)              AS total_hours,
        a_this.skill                                          AS skill_this_event,
        a_this.hoursvolunteered                               AS hours_this_event,
        CASE
          WHEN a_this.hasattended THEN 'Attended'
          WHEN a_this.willattend  THEN 'Registered'
          ELSE 'Not attending'
        END                                                   AS status_this_event
      FROM attendance a_this
      JOIN userprofiles u
        ON u.id = a_this.memberid
      LEFT JOIN attendance a_all
        ON a_all.memberid = u.id
      WHERE a_this.eventid = $1
      GROUP BY
        u.id, fullname, u.username, u.emailaddress,
        a_this.skill, a_this.hoursvolunteered,
        a_this.hasattended, a_this.willattend
      ORDER BY fullname ASC;
      `,
      [eventId]
    );

    res.json({
      event,
      volunteers: vQ.rows,
    });
  } catch (err) {
    console.error("Error /reports/my-events/:eventId/volunteers:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 5) PER-EVENT ASSIGNMENTS (positions + who is in them)
//     NOW COUNTS "FILLED" FROM ATTENDANCE
// ============================================================

router.get("/my-events/:eventId/assignments", async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const evQ = await pool.query(
      `
      SELECT *
      FROM events
      WHERE id = $1 AND creatorid = $2
      `,
      [eventId, userId]
    );

    if (!evQ.rows.length) {
      return res
        .status(404)
        .json({ message: "Event not found or not created by you" });
    }

    const event = evQ.rows[0];

    const aQ = await pool.query(
      `
      SELECT
        u.id,
        COALESCE(u.fullname,
          TRIM(COALESCE(u.firstname,'') || ' ' || COALESCE(u.lastname,''))) AS fullname,
        u.username,
        u.emailaddress AS email,
        a.skill,
        a.hoursvolunteered AS hours,
        CASE
          WHEN a.hasattended THEN 'Attended'
          WHEN a.willattend  THEN 'Registered'
          ELSE 'Not attending'
        END AS status
      FROM attendance a
      JOIN userprofiles u
        ON u.id = a.memberid
      WHERE a.eventid = $1
      ORDER BY a.skill, fullname;
      `,
      [eventId]
    );

    const assignments = aQ.rows;

    // Count how many volunteers per role based on assignments
    const filledByLabel = {};
    assignments.forEach((a) => {
      const label = labelForKey(a.skill);
      if (!label) return;
      filledByLabel[label] = (filledByLabel[label] || 0) + 1;
    });

    // Start from event's configured totals, then override "filled" from counts
    let rolesSummary = buildEventRoleSummary(event).map((r) => {
      const filled = filledByLabel[r.role] || 0;
      const total = r.total || 0;
      return {
        ...r,
        filled,
        remaining: total - filled,
      };
    });

    res.json({
      event,
      rolesSummary,
      assignments,
    });
  } catch (err) {
    console.error("Error /reports/my-events/:eventId/assignments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================
// 6) INDIVIDUAL EVENT SUMMARY (role counts) – KEEPING FOR OTHER PAGES
// ============================================================

router.get("/event/:eventId", async (req, res) => {
  const { eventId } = req.params;

  try {
    const q = await pool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);

    if (!q.rows.length) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = q.rows[0];
    const roles = buildEventRoleSummary(event);

    res.json({ event, roles });
  } catch (err) {
    console.error("Error /reports/event/:eventId:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
