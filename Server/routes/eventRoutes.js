const express = require("express");
const router = express.Router();
const pool = require("../DB");        // <- Option B: keep DB.js

// --- helpers -------------------------------------------------
const serializeSkills = (arr) =>
  Array.isArray(arr) ? arr.join(",") : (arr ?? "");

const parseSkills = (s) =>
  (s ? String(s).split(",").map(v => v.trim()).filter(Boolean) : []);

const dbRowToEvent = (r) => ({
  id: r.id,
  name: r.name,
  description: r.description || "",
  location: r.location || "",
  zip: r.zipcode || "",
  requiredSkills: parseSkills(r.requiredskills),
  urgency: r.urgency ?? 0,
  date: r.date,                         // keep whatever type your column returns
  status: "Open",                       // not in DB; preserve mock shape
  capacity: 0,                          // not in DB; preserve mock shape
  organization: r.organization || "VolunteerHub",
  hours: r.hours ?? 0,
});

// --- Existing endpoints --------------------------------------

// GET /events -> { events: [...] }
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours
         FROM events
        ORDER BY date DESC, id DESC`
    );
    res.status(200).json({ events: rows.map(dbRowToEvent) });
  } catch (e) {
    console.error("GET /events error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /events/:id -> { event }
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query(
      `SELECT id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours
         FROM events
        WHERE id = $1`,
      [id]
    );
    if (!q.rowCount) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ event: dbRowToEvent(q.rows[0]) });
  } catch (e) {
    console.error("GET /events/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------------------------------
// Aliases to support current frontend client endpoints
// ----------------------------------------------------

// GET /event/getall  -> { events }
router.get("/event/getall", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours
         FROM events
        ORDER BY date DESC, id DESC`
    );
    res.status(200).json({ events: rows.map(dbRowToEvent) });
  } catch (e) {
    console.error("GET /event/getall error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /event/create  (body: client form shape)
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

    const ins = await pool.query(
      `INSERT INTO events (name, description, location, zipcode, requiredskills, urgency, date, organization, hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours`,
      [
        eventName,
        eventDescription || "",
        eventLocation || "",
        eventZipCode || "",
        serializeSkills(eventRequiredSkills),
        eventUrgency ?? 0,
        eventDate,
        "VolunteerHub",
        0,
      ]
    );

    // optional: return refreshed list like your mock did
    const all = await pool.query(
      `SELECT id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours
         FROM events
        ORDER BY date DESC, id DESC`
    );

    return res
      .status(201)
      .json({ event: dbRowToEvent(ins.rows[0]), events: all.rows.map(dbRowToEvent) });
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

    const del = await pool.query(`DELETE FROM events WHERE name = $1`, [eventName]);
    if (!del.rowCount) return res.status(404).json({ message: "Event not found" });

    const all = await pool.query(
      `SELECT id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours
         FROM events
        ORDER BY date DESC, id DESC`
    );
    return res.status(200).json({ events: all.rows.map(dbRowToEvent) });
  } catch (e) {
    console.error("DELETE /event/delete error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /event/get/:name -> client’s expected shape
router.get("/event/get/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const q = await pool.query(
      `SELECT id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours
         FROM events
        WHERE name = $1
        LIMIT 1`,
      [name]
    );
    if (!q.rowCount) return res.status(404).json({ message: "Event not found" });

    const ev = dbRowToEvent(q.rows[0]);
    return res.json({
      eventName: ev.name,
      eventDescription: ev.description,
      eventLocation: ev.location,
      eventZipCode: ev.zip,
      eventRequiredSkills: ev.requiredSkills,
      eventUrgency: ev.urgency,
      eventDate: ev.date,
    });
  } catch (e) {
    console.error("GET /event/get/:name error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /event/edit/:name  (body: client form shape)
router.put("/event/edit/:name", async (req, res) => {
  try {
    const currentName = req.params.name;

    // Map client shape -> DB columns (only set provided fields)
    const p = req.body || {};
    const fields = [];
    const vals = [];
    let i = 1;

    const set = (col, val) => { fields.push(`${col} = $${i++}`); vals.push(val); };

    if (p.eventName            != null) set("name",            p.eventName);
    if (p.eventDescription     != null) set("description",     p.eventDescription);
    if (p.eventLocation        != null) set("location",        p.eventLocation);
    if (p.eventZipCode         != null) set("zipcode",         p.eventZipCode);
    if (p.eventRequiredSkills  != null) set("requiredskills",  serializeSkills(p.eventRequiredSkills));
    if (p.eventUrgency         != null) set("urgency",         p.eventUrgency);
    if (p.eventDate            != null) set("date",            p.eventDate);

    if (!fields.length) return res.status(400).json({ message: "No fields to update" });

    // WHERE name = currentName
    vals.push(currentName);
    const upd = await pool.query(
      `UPDATE events SET ${fields.join(", ")} WHERE name = $${i} RETURNING
         id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours`,
      vals
    );

    if (!upd.rowCount) return res.status(404).json({ message: "Event not found" });

    return res.json({ event: dbRowToEvent(upd.rows[0]) });
  } catch (e) {
    console.error("PUT /event/edit/:name error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
