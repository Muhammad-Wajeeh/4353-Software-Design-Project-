const express = require("express");
const router = express.Router();
const { authenticate } = require("../authenticator"); // your auth middleware
const pool = require("../index").pool; // adjust if your pool is exported differently

// Helpers to map DB <-> client field names used by your existing pages
function rowToClient(ev) {
  return {
    eventName: ev.name,
    eventDescription: ev.description,
    eventLocation: ev.location,
    eventZipCode: ev.zipcode,
    eventRequiredSkills: ev.requiredskills || [],
    eventUrgency: ev.urgency,
    eventDate: ev.date,
    organization: ev.organization,
    hours: ev.hours,
    creatorId: ev.creatorid,
  };
}

// ---------- NEW: Events for the logged-in user (Home uses this) ----------
router.get("/getAllForThisUser", authenticate, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    // If you track attendance/assignments, join it; otherwise show upcoming global
    const q = `
      SELECT e.*
      FROM events e
      LEFT JOIN attendance a ON a.eventid = e.id AND a.memberid = $1
      WHERE e.date >= CURRENT_DATE
      ORDER BY e.date ASC
      LIMIT 50
    `;
    const { rows } = await pool.query(q, [userId]);
    return res.json({ events: rows.map(rowToClient) });
  } catch (e) {
    console.error("GET /events/getAllForThisUser error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- KEEP FRONTEND API SHAPE (DB-backed) ----------

// GET /event/getall
router.get("/event/getall", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM events ORDER BY date DESC, id DESC LIMIT 200`
    );
    return res.json({ events: rows.map(rowToClient) });
  } catch (e) {
    console.error("GET /event/getall error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /event/create
router.post("/event/create", async (req, res) => {
  try {
    const {
      eventName,
      eventDescription,
      eventLocation,
      eventZipCode,
      eventRequiredSkills = [],
      eventUrgency,
      eventDate,
    } = req.body || {};

    if (!eventName || !eventDate) {
      return res.status(400).json({ message: "eventName and eventDate are required" });
    }

    const q = `
      INSERT INTO events (name, description, location, zipcode, requiredskills, urgency, date, organization, hours, creatorid)
      VALUES ($1,$2,$3,$4,$5::text[], $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const vals = [
      eventName,
      eventDescription || "",
      eventLocation || "",
      eventZipCode || "",
      Array.isArray(eventRequiredSkills) ? eventRequiredSkills : [],
      eventUrgency ?? 0,
      eventDate,                 // 'YYYY-MM-DD'
      "VolunteerHub",
      0,
      null,
    ];
    const { rows } = await pool.query(q, vals);
    return res.status(201).json({ event: rowToClient(rows[0]) });
  } catch (e) {
    console.error("POST /event/create error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /event/delete  (body: { eventName })
router.delete("/event/delete", async (req, res) => {
  try {
    const { eventName } = req.body || {};
    if (!eventName) return res.status(400).json({ message: "eventName required" });

    await pool.query(`DELETE FROM events WHERE name = $1`, [eventName]);
    const { rows } = await pool.query(`SELECT * FROM events ORDER BY date DESC, id DESC LIMIT 200`);
    return res.json({ events: rows.map(rowToClient) });
  } catch (e) {
    console.error("DELETE /event/delete error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /event/get/:name
router.get("/event/get/:name", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM events WHERE name = $1 LIMIT 1`, [
      req.params.name,
    ]);
    if (rows.length === 0) return res.status(404).json({ message: "Event not found" });
    return res.json(rowToClient(rows[0]));
  } catch (e) {
    console.error("GET /event/get/:name error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /event/edit/:name
router.put("/event/edit/:name", async (req, res) => {
  try {
    const p = req.body || {};
    const q = `
      UPDATE events
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             location = COALESCE($3, location),
             zipcode = COALESCE($4, zipcode),
             requiredskills = COALESCE($5::text[], requiredskills),
             urgency = COALESCE($6, urgency),
             date = COALESCE($7, date)
       WHERE name = $8
       RETURNING *;
    `;
    const vals = [
      p.eventName ?? null,
      p.eventDescription ?? null,
      p.eventLocation ?? null,
      p.eventZipCode ?? null,
      Array.isArray(p.eventRequiredSkills) ? p.eventRequiredSkills : null,
      p.eventUrgency ?? null,
      p.eventDate ?? null,
      req.params.name,
    ];
    const { rows } = await pool.query(q, vals);
    if (rows.length === 0) return res.status(404).json({ message: "Event not found" });
    return res.json({ event: rowToClient(rows[0]) });
  } catch (e) {
    console.error("PUT /event/edit/:name error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
