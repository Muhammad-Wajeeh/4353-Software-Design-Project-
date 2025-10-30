// Server/routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db"); // adjust to ../server/db if needed

// --------------------
// Helpers & validation
// --------------------
const ZIP_RE = /^[0-9]{5}(?:-[0-9]{4})?$/;
const VALID_URGENCY = new Set(["Low", "Medium", "High"]);
const VALID_STATUS = new Set(["Open", "Closed", "Cancelled"]);

function isString(x) { return typeof x === "string"; }
function reqStr(x, name, max = 1000) {
  if (!isString(x) || x.trim().length === 0) throw new Error(`${name} is required`);
  if (x.length > max) throw new Error(`${name} exceeds ${max} chars`);
  return x.trim();
}
function arrOfStr(a) {
  if (!Array.isArray(a)) return [];
  return a
    .filter((s) => typeof s === "string" && s.trim().length)
    .map((s) => s.trim());
}
function validZip(z) { return isString(z) && ZIP_RE.test(z); }
function validUrgency(u) { return isString(u) && VALID_URGENCY.has(u); }
function validStatus(s) { return isString(s) && VALID_STATUS.has(s); }

function rowToModern(e) {
  // Used by GET /events and GET /events/:id
  return {
    event_id: e.event_id,
    event_name: e.event_name,
    description: e.description,
    location: e.location,
    zip: e.zip,
    required_skills: e.required_skills || [],
    urgency: e.urgency,
    event_date: e.event_date,
    status: e.status,
    capacity: e.capacity,
    organization: e.organization,
    created_at: e.created_at,
    updated_at: e.updated_at,
  };
}
function rowToLegacy(e) {
  // Used by /event/* aliases to match your client’s legacy field names
  return {
    eventName: e.event_name,
    eventDescription: e.description,
    eventLocation: e.location,
    eventZipCode: e.zip,
    eventRequiredSkills: e.required_skills || [],
    eventUrgency: e.urgency,
    eventDate: e.event_date,
  };
}

// --------------------
// Existing endpoints
// --------------------

// GET /events -> { events: [...] }
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT event_id, event_name, description, location, zip, required_skills, urgency,
              event_date, status, capacity, organization, created_at, updated_at
         FROM event_details
        ORDER BY event_date DESC
        LIMIT 500`
    );
    return res.status(200).json({ events: rows.map(rowToModern) });
  } catch (err) {
    console.error("GET /events error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /events/:id -> { event }
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT event_id, event_name, description, location, zip, required_skills, urgency,
              event_date, status, capacity, organization, created_at, updated_at
         FROM event_details
        WHERE event_id = $1
        LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Event not found" });
    return res.status(200).json({ event: rowToModern(rows[0]) });
  } catch (err) {
    console.error("GET /events/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------------------------------
// Aliases to support current frontend client endpoints
// (These live under the same router for compatibility.)
// ----------------------------------------------------

// GET /event/getall  -> { events }
router.get("/event/getall", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT event_id, event_name, description, location, zip, required_skills, urgency,
              event_date, status, capacity, organization, created_at, updated_at
         FROM event_details
        ORDER BY event_date DESC
        LIMIT 500`
    );
    // legacy expects simple array (we’ll return legacy field names)
    return res.status(200).json({ events: rows.map(rowToLegacy) });
  } catch (err) {
    console.error("GET /event/getall error:", err);
    return res.status(500).json({ message: "Server error" });
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
      status = "Open",
      capacity = 0,
      organization = "VolunteerHub",
    } = req.body || {};

    // Basic validation to match your previous behavior
    const name = reqStr(eventName, "eventName", 100);
    const desc = reqStr(eventDescription || "", "eventDescription", 5000);
    const loc = reqStr(eventLocation || "", "eventLocation", 2000);
    if (!validZip(eventZipCode || "")) {
      return res.status(400).json({ message: "Invalid eventZipCode (use 5-digit or ZIP+4)" });
    }
    const skills = arrOfStr(eventRequiredSkills);
    if (!validUrgency(eventUrgency || "")) {
      return res.status(400).json({ message: "eventUrgency must be Low, Medium, or High" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(eventDate || ""))) {
      return res.status(400).json({ message: "eventDate must be YYYY-MM-DD" });
    }
    const st = validStatus(status) ? status : "Open";
    const cap = Number.isFinite(Number(capacity)) ? Number(capacity) : 0;

    const { rows } = await pool.query(
      `INSERT INTO event_details
        (event_name, description, location, zip, required_skills, urgency, event_date, status, capacity, organization)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING event_id, event_name, description, location, zip, required_skills, urgency,
                 event_date, status, capacity, organization, created_at, updated_at`,
      [name, desc, loc, eventZipCode, skills, eventUrgency, eventDate, st, cap, organization]
    );

    // Return the newly created event in BOTH shapes the app uses:
    const created = rows[0];
    return res.status(201).json({
      event: rowToModern(created),
      // also include legacy `events` array entry for callers that expect it
      events: [rowToLegacy(created)],
    });
  } catch (err) {
    console.error("POST /event/create error:", err);
    if (String(err.message || "").includes("uq_event_name_per_day")) {
      return res.status(409).json({ message: "An event with that name already exists on that date" });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /event/delete  (body: { eventName })
router.delete("/event/delete", async (req, res) => {
  try {
    const { eventName } = req.body || {};
    if (!isString(eventName) || !eventName.trim()) {
      return res.status(400).json({ message: "eventName required" });
    }

    // delete the most recent event with that name
    const { rows } = await pool.query(
      `WITH target AS (
         SELECT event_id
           FROM event_details
          WHERE event_name = $1
          ORDER BY event_date DESC
          LIMIT 1
       )
       DELETE FROM event_details d
       USING target
       WHERE d.event_id = target.event_id
       RETURNING d.event_id`,
      [eventName.trim()]
    );

    if (!rows.length) return res.status(404).json({ message: "Event not found" });

    // respond with refreshed list (legacy style)
    const all = await pool.query(
      `SELECT event_name, description, location, zip, required_skills, urgency, event_date
         FROM event_details
        ORDER BY event_date DESC
        LIMIT 500`
    );
    return res.status(200).json({ events: all.rows.map(rowToLegacy) });
  } catch (err) {
    console.error("DELETE /event/delete error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /event/get/:name -> legacy shape
router.get("/event/get/:name", async (req, res) => {
  try {
    const name = req.params.name;
    if (!isString(name) || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    const { rows } = await pool.query(
      `SELECT event_id, event_name, description, location, zip, required_skills, urgency,
              event_date, status, capacity, organization, created_at, updated_at
         FROM event_details
        WHERE event_name = $1
        ORDER BY event_date DESC
        LIMIT 1`,
      [name.trim()]
    );

    if (!rows.length) return res.status(404).json({ message: "Event not found" });
    return res.json(rowToLegacy(rows[0]));
  } catch (err) {
    console.error("GET /event/get/:name error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /event/edit/:name  (body: client form shape)
router.put("/event/edit/:name", async (req, res) => {
  try {
    const targetName = req.params.name;
    if (!isString(targetName) || !targetName.trim()) {
      return res.status(400).json({ message: "name param is required" });
    }

    const {
      eventName,
      eventDescription,
      eventLocation,
      eventZipCode,
      eventRequiredSkills,
      eventUrgency,
      eventDate,
      status,
      capacity,
      organization,
    } = req.body || {};

    // Build dynamic UPDATE based on provided fields
    const sets = [];
    const vals = [];
    let i = 1;

    if (isString(eventName) && eventName.trim()) { sets.push(`event_name = $${i++}`); vals.push(eventName.trim()); }
    if (isString(eventDescription) && eventDescription.trim()) { sets.push(`description = $${i++}`); vals.push(eventDescription.trim()); }
    if (isString(eventLocation) && eventLocation.trim()) { sets.push(`location = $${i++}`); vals.push(eventLocation.trim()); }
    if (isString(eventZipCode) && ZIP_RE.test(eventZipCode)) { sets.push(`zip = $${i++}`); vals.push(eventZipCode); }
    if (Array.isArray(eventRequiredSkills)) { sets.push(`required_skills = $${i++}`); vals.push(arrOfStr(eventRequiredSkills)); }
    if (isString(eventUrgency) && VALID_URGENCY.has(eventUrgency)) { sets.push(`urgency = $${i++}`); vals.push(eventUrgency); }
    if (isString(eventDate) && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) { sets.push(`event_date = $${i++}`); vals.push(eventDate); }
    if (isString(status) && VALID_STATUS.has(status)) { sets.push(`status = $${i++}`); vals.push(status); }
    if (Number.isFinite(Number(capacity))) { sets.push(`capacity = $${i++}`); vals.push(Number(capacity)); }
    if (isString(organization) && organization.trim()) { sets.push(`organization = $${i++}`); vals.push(organization.trim()); }

    if (!sets.length) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

    // Update the most recent row with that event_name (matches your prior behavior)
    vals.push(targetName.trim());
    const sql = `
      UPDATE event_details
         SET ${sets.join(", ")}, updated_at = NOW()
       WHERE event_id = (
         SELECT event_id FROM event_details
          WHERE event_name = $${i}
          ORDER BY event_date DESC
          LIMIT 1
       )
       RETURNING event_id, event_name, description, location, zip, required_skills, urgency,
                 event_date, status, capacity, organization, created_at, updated_at
    `;

    const { rows } = await pool.query(sql, vals);
    if (!rows.length) return res.status(404).json({ message: "Event not found" });

    // Return the edited event in the legacy shape (to match your old handler)
    return res.json({ event: rowToLegacy(rows[0]) });
  } catch (err) {
    console.error("PUT /event/edit/:name error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
