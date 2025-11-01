const express = require("express");
const router = express.Router();
const pool = require("../DB");
const authenticateToken = require("./authenticator");

router.get("/", (req, res) => {
  res.status(200).json({ events });
});

router.get("/getall", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY id ASC");

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }

    const events = result.rows.map((ev) => ({
      eventName: ev.name,
      eventDescription: ev.description,
      eventLocation: ev.location,
      eventZipcode: ev.zipcode,
      eventRequiredSkills: ev.requiredskills,
      eventUrgency: ev.urgency,
      eventDate: ev.date,
      organization: ev.organization,
      hours: ev.hours,
    }));

    res.status(200).json({ events });
  } catch (err) {
    console.error("Error fetching all events:", err.message);
    res.status(500).json({ error: "Server error while fetching events" });
  }
});

router.post("/create", authenticateToken, async (req, res) => {
  try {
    const {
      eventName,
      eventDescription,
      eventLocation,
      eventZipCode,
      eventRequiredSkills,
      eventUrgency,
      eventDate,
    } = req.body || {};

    // Basic validation
    if (!eventName || !eventDate) {
      return res
        .status(400)
        .json({ message: "eventName and eventDate are required" });
    }

    var eventUrgencyNumberForm = 0;

    if (eventUrgency == "Critical") eventUrgencyNumberForm = 3;
    else if (eventUrgency == "High") eventUrgencyNumberForm = 2;
    else if (eventUrgency == "Medium") eventUrgencyNumberForm = 1;
    else if (eventUrgency == "Low") eventUrgencyNumberForm = 0;

    const queryResult = await pool.query(
      `INSERT INTO events (name, description, location, zipcode, requiredskills, urgency, date, creatorid, organization )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventName,
        eventDescription,
        eventLocation,
        eventZipCode,
        eventRequiredSkills,
        eventUrgencyNumberForm,
        eventDate,
        req.user.id, // comes
        req.user.username
      ]
    );
  } catch (err) {
    postgresqlUniqueViolationErrorCode = "23505";
    if (err.code == postgresqlUniqueViolationErrorCode)
      res.status(400).json({ error: "Event name already exists" });

    res.status(500);
    console.log(err);
  }

  return res.status(201).json("Event Created");
});

router.delete("/delete", async (req, res) => {
  try {
    const { eventName } = req.body;

    // Validation
    if (!eventName) {
      return res.status(400).json({ error: "eventName is required" });
    }

    // Check if event exists
    const existingEvent = await pool.query(
      "SELECT * FROM events WHERE name = $1",
      [eventName]
    );

    if (existingEvent.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Delete the event
    await pool.query("DELETE FROM events WHERE name = $1", [eventName]);

    return res.status(200).json({
      message: `Event '${eventName}' deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Server error while deleting event" });
  }
});

// GET /event/getAllForThisUser
router.get("/getAllForThisUser", authenticateToken, async (req, res) => {
  try {
    const creatorId = req.user.id; // comes from the JWT payload

    const result = await pool.query(
      "SELECT * FROM events WHERE CreatorID = $1 ORDER BY id ASC",
      [creatorId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "No events found for this user" });
    }

    const events = result.rows.map((ev) => ({
      eventName: ev.name,
      eventDescription: ev.description,
      eventLocation: ev.location,
      eventZipcode: ev.zipcode,
      eventRequiredSkills: ev.requiredskills,
      eventUrgency: ev.urgency,
      eventDate: ev.date,
      organization: ev.organization,
      hours: ev.hours,
    }));

    res.status(200).json({ events });
  } catch (err) {
    console.error("Error fetching user's events:", err.message);
    res.status(500).json({ error: "Server error while fetching events" });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({ error: "Event name is required" });
    }

    // Query PostgreSQL
    const result = await pool.query("SELECT * FROM events WHERE name = $1", [
      name,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const ev = result.rows[0];

    res.status(200).json({
      eventName: ev.name,
      eventDescription: ev.description,
      eventLocation: ev.location,
      eventZipcode: ev.zipcode,
      eventRequiredSkills: ev.requiredskills,
      eventUrgency: ev.urgency,
      eventDate: ev.date,
      organization: ev.organization,
      hours: ev.hours,
    });
  } catch (err) {
    console.error("Error fetching event:", err.message);
    res.status(500).json({ error: "Server error while fetching event" });
  }
});

// GET /event/id/:name -> returns the event ID and details by name
router.get("/id/:name", async (req, res) => {
  try {
    const { name } = req.params;

    // Query the event by name
    const result = await pool.query(
      "SELECT id, name, description, location, zipcode, requiredskills, urgency, date, organization, hours FROM events WHERE name = $1",
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Return the event details (including id)
    res.status(200).json({
      message: "Event found",
      event: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching event ID:", err.message);
    res.status(500).json({ error: "Server error while fetching event ID" });
  }
});

// PUT /event/edit/:id
router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      eventName,
      eventDescription,
      eventLocation,
      eventZipcode,
      eventRequiredSkills,
      eventUrgency,
      eventDate,
      organization,
      hours,
    } = req.body;

    // Check if event exists
    const existingEvent = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );
    if (existingEvent.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    var eventUrgencyNumberForm = 0;

    if (eventUrgency == "Critical") eventUrgencyNumberForm = 3;
    else if (eventUrgency == "High") eventUrgencyNumberForm = 2;
    else if (eventUrgency == "Medium") eventUrgencyNumberForm = 1;
    else if (eventUrgency == "Low") eventUrgencyNumberForm = 0;

    // Update event by ID
    const updateQuery = `
      UPDATE events
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        zipcode = COALESCE($4, zipcode),
        requiredskills = COALESCE($5, requiredskills),
        urgency = COALESCE($6, urgency),
        date = COALESCE($7, date),
        organization = COALESCE($8, organization),
        hours = COALESCE($9, hours)
      WHERE id = $10
      RETURNING *;
    `;

    const values = [
      eventName,
      eventDescription,
      eventLocation,
      eventZipcode,
      eventRequiredSkills,
      eventUrgencyNumberForm,
      eventDate,
      organization,
      hours,
      id,
    ];

    const result = await pool.query(updateQuery, values);

    res.status(200).json({
      message: "Event updated successfully",
      event: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating event:", err.message);
    res.status(500).json({ error: "Server error while updating event" });
  }
});

module.exports = router;
