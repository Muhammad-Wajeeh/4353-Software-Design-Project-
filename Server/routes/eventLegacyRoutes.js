// Server/routes/eventLegacyRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

const ZIP_RE = /^[0-9]{5}(?:-[0-9]{4})?$/;
const VALID_URGENCY = new Set(["Low", "Medium", "High"]);
const VALID_STATUS = new Set(["Open", "Closed", "Cancelled"]);

const isStr = (x) => typeof x === "string";
const arrOfStr = (a) =>
  Array.isArray(a) ? a.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim()) : [];

const rowToLegacy = (e) => ({
  eventName: e.event_name,
  eventDescription: e.description,
  eventLocation: e.location,
  eventZipCode: e.zip,
  eventRequiredSkills: e.required_skills || [],
  eventUrgency: e.urgency,
  eventDate: e.event_date,
});

// GET /event/getall
router.get("/getall", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT event_name, description, location, zip, required_skills, urgency, event_date
         FROM event_details
        ORDER BY event_date DESC
        LIMIT 500`
    );
    res.json({ events: rows.map(rowToLegacy) });
  } catch (e) {
    console.error("GET /event/getall error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /event/get/:name
router.get("/get/:name", async (req, res) => {
  try {
    const name = req.params.name?.trim();
    if (!name) return res.status(400).json({ message: "name is required" });
    const { rows } = await pool.query(
      `SELECT event_name, description, location, zip, required_skills, urgency, event_date
         FROM event_details
        WHERE event_name = $1
        ORDER BY event_date DESC
        LIMIT 1`,
      [name]
    );
    if (!rows.length) return res.status(404).json({ message: "Event not found" });
    res.json(rowToLegacy(rows[0]));
  } catch (e) {
    console.error("GET /event/get/:name error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /event/create
router.post("/create", async (req, res) => {
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

    if (!isStr(eventName) || !eventName.trim())
      return res.status(400).json({ message: "eventName is required" });
    if (!isStr(eventDescription))
      return res.status(400).json({ message: "eventDescription is required" });
    if (!isStr(eventLocation) || !eventLocation.trim())
      return res.status(400).json({ message: "eventLocation is required" });
    if (!isStr(eventZipCode) || !ZIP_RE.test(eventZipCode))
      return res.status(400).json({ message: "eventZipCode must be a valid ZIP" });
    if (!isStr(eventUrgency) || !VALID_URGENCY.has(eventUrgency))
      return res.status(400).json({ message: "eventUrgency must be Low, Medium, or High" });
    if (!isStr(eventDate) || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate))
      return res.status(400).json({ message: "eventDate must be YYYY-MM-DD" });

    const { rows } = await pool.query(
      `INSERT INTO event_details
        (event_name, description, location, zip, required_skills, urgency, event_date, status, capacity, organization)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING event_name, description, location, zip, required_skills, urgency, event_date`,
      [
        eventName.trim(),
        eventDescription.trim(),
        eventLocation.trim(),
        eventZipCode,
        arrOfStr(eventRequiredSkills),
        eventUrgency,
        eventDate,
        VALID_STATUS.has(status) ? status : "Open",
        Number.isFinite(Number(capacity)) ? Number(capacity) : 0,
        organization?.trim() || "VolunteerHub",
      ]
    );

    res.status(201).json({ event: rowToLegacy(rows[0]) });
  } catch (e) {
    console.error("POST /event/create error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /event/edit/:name  (partial)
router.put("/edit/:name", async (req, res) => {
  try {
    const target = req.params.name?.trim();
    if (!target) return res.status(400).json({ message: "name param is required" });

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

    const sets = [];
    const vals = [];
    let i = 1;

    if (isStr(eventName) && eventName.trim()) { sets.push(`event_name = $${i++}`); vals.push(eventName.trim()); }
    if (isStr(eventDescription) && eventDescription.trim()) { sets.push(`description = $${i++}`); vals.push(eventDescription.trim()); }
    if (isStr(eventLocation) && eventLocation.trim()) { sets.push(`location = $${i++}`); vals.push(eventLocation.trim()); }
    if (isStr(eventZipCode) && ZIP_RE.test(eventZipCode)) { sets.push(`zip = $${i++}`); vals.push(eventZipCode); }
    if (Array.isArray(eventRequiredSkills)) { sets.push(`required_skills = $${i++}`); vals.push(arrOfStr(eventRequiredSkills)); }
    if (isStr(eventUrgency) && VALID_URGENCY.has(eventUrgency)) { sets.push(`urgency = $${i++}`); vals.push(eventUrgency); }
    if (isStr(eventDate) && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) { sets.push(`event_date = $${i++}`); vals.push(eventDate); }
    if (isStr(status) && VALID_STATUS.has(status)) { sets.push(`status = $${i++}`); vals.push(status); }
    if (Number.isFinite(Number(capacity))) { sets.push(`capacity = $${i++}`); vals.push(Number(capacity)); }
    if (isStr(organization) && organization.trim()) { sets.push(`organization = $${i++}`); vals.push(organization.trim()); }

    if (!sets.length) return res.status(400).json({ message: "No valid fields to update" });

    vals.push(target);
    const sql = `
      UPDATE event_details
         SET ${sets.join(", ")}, updated_at = NOW()
       WHERE event_id = (
         SELECT event_id FROM event_details
          WHERE event_name = $${i}
          ORDER BY event_date DESC
          LIMIT 1
       )
       RETURNING event_name, description, location, zip, required_skills, urgency, event_date
    `;

    const { rows } = await pool.query(sql, vals);
    if (!rows.length) return res.status(404).json({ message: "Event not found" });

    res.json({ event: rowToLegacy(rows[0]) });
  } catch (e) {
    console.error("PUT /event/edit/:name error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
