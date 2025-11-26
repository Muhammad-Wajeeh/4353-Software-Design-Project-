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
      eventTime: ev.event_time,
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
      skillNeeds,
      eventUrgency,
      eventDate,
      eventTime,
    } = req.body || {};

    const {
      firstAid,
      foodService,
      logistics,
      teaching,
      eventSetup,
      dataEntry,
      customerService,
    } = skillNeeds;

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
      `INSERT INTO events (name, description, location, zipcode, urgency, date, creatorid, organization, event_time, firstaid, foodservice, logistics, teaching, eventsetup, dataentry, customerservice )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        eventName,
        eventDescription,
        eventLocation,
        eventZipCode,
        eventUrgencyNumberForm,
        eventDate,
        req.user.id,
        req.user.username,
        eventTime,
        firstAid,
        foodService,
        logistics,
        teaching,
        eventSetup,
        dataEntry,
        customerService,
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
      eventTime: ev.event_time,
      organization: ev.organization,
      hours: ev.hours,
    }));

    res.status(200).json({ events });
  } catch (err) {
    console.error("Error fetching user's events:", err.message);
    res.status(500).json({ error: "Server error while fetching events" });
  }
});

router.get("/getEventsToAttendByUser", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // comes from the JWT payload

    const queryResult = await pool.query(
      "SELECT e.name FROM attendance as a JOIN events as e on a.eventid = e.id WHERE a.memberid = $1 AND a.willattend = true",
      [userId]
    );

    const eventsAttendedOrToBeAttended = queryResult.rows.map((ev) => ({
      eventName: ev.name,
      hasAttended: ev.hasattended,
      willAttend: ev.willattend,
    }));

    res.status(200).json({ eventsAttendedOrToBeAttended });
  } catch (err) {
    console.error("Error fetching user's events:", err.message);
    res.status(500).json({ error: "Server error while fetching events" });
  }
});

router.get(
  "/getEventsToAttendByUserAndThePosition",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          e.id AS eventID,
          e.name AS eventName,
          e.date AS eventDate,
          e.location AS eventLocation,
          a.skill AS skill,
          a.willattend AS willAttend,
          a.hasattended AS hasAttended
        FROM attendance a
        JOIN events e ON a.eventid = e.id
        WHERE a.memberid = $1 AND a.willattend = true;
      `;

      const result = await pool.query(query, [userId]);

      return res.status(200).json({
        events: result.rows,
      });
    } catch (err) {
      console.error("Error fetching user assignments:", err.message);
      return res.status(500).json({
        error: "Server error while fetching assignments",
      });
    }
  }
);

router.get("/getAllFutureEvents", async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT *
    FROM events
    WHERE (date + event_time) > NOW()
    ORDER BY date ASC, event_time ASC
  `);

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

router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) return res.status(400).json({ error: "Event name is required" });

    const result = await pool.query("SELECT * FROM events WHERE name = $1", [
      name,
    ]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Event not found" });

    const ev = result.rows[0];

    res.status(200).json({
      eventID: ev.id,
      eventName: ev.name,
      eventDescription: ev.description,
      eventLocation: ev.location,
      eventZipCode: ev.zipcode,

      eventUrgency: ev.urgency,
      eventDate: ev.date,
      eventTime: ev.event_time,
      organization: ev.organization,
      hours: ev.hours,

      // --- SKILL NEEDS ---
      firstAid: ev.firstaid,
      foodService: ev.foodservice,
      logistics: ev.logistics,
      teaching: ev.teaching,
      eventSetup: ev.eventsetup,
      dataEntry: ev.dataentry,
      customerService: ev.customerservice,

      // --- SKILL FILLED ---
      firstAidFilled: ev.firstaidfilled,
      foodServiceFilled: ev.foodservicefilled,
      logisticsFilled: ev.logisticsfilled,
      teachingFilled: ev.teachingfilled,
      eventSetupFilled: ev.eventsetupfilled,
      dataEntryFilled: ev.dataentryfilled,
      customerServiceFilled: ev.customerservicefilled,
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

router.put("/signup/:eventName", authenticateToken, async (req, res) => {
  try {
    const { eventName } = req.params;
    const { skill } = req.body;
    const userId = req.user.id;

    if (!skill) {
      return res.status(400).json({ error: "Skill is required to sign up" });
    }

    const skillColumn = skill.toLowerCase(); // e.g. foodService → foodservice
    const filledColumn = skillColumn + "filled"; // e.g. foodservicefilled

    // 1️⃣ Get event row
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE name = $1",
      [eventName]
    );

    if (eventResult.rows.length === 0)
      return res.status(404).json({ error: "Event not found" });

    const ev = eventResult.rows[0];

    const totalNeeded = ev[skillColumn];
    const alreadyFilled = ev[filledColumn];

    if (totalNeeded === undefined) {
      return res.status(400).json({ error: "Invalid skill type" });
    }

    // 2️⃣ Prevent signing up if full
    if (alreadyFilled >= totalNeeded) {
      return res.status(400).json({
        error: `No available slots left for ${skill}`,
      });
    }

    // 3️⃣ Upsert attendance + store skill
    const attendance = await pool.query(
      `
      INSERT INTO attendance (memberid, eventid, willattend, hasattended, skill)
      VALUES ($1, $2, true, false, $3)
      ON CONFLICT (memberid, eventid)
      DO UPDATE SET willattend = true, skill = EXCLUDED.skill
      RETURNING *;
      `,
      [userId, ev.id, skill]
    );

    // 4️⃣ Increment the correct skillFilled column
    await pool.query(
      `UPDATE events SET ${filledColumn} = ${filledColumn} + 1 WHERE id = $1`,
      [ev.id]
    );

    res.status(200).json({
      message: `Signed up for ${skill}!`,
      event: attendance.rows[0],
    });
  } catch (err) {
    console.error("Error Signing Up:", err);
    res.status(500).json({ error: "Server error while signing up" });
  }
});

router.put("/cancelSignUp/:eventName", authenticateToken, async (req, res) => {
  try {
    const { eventName } = req.params;
    const userId = req.user.id;

    // 1️⃣ Get event row
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE name = $1",
      [eventName]
    );

    if (eventResult.rows.length === 0)
      return res.status(404).json({ message: "Event not found" });

    const ev = eventResult.rows[0];

    // 2️⃣ Get the user's current skill
    const attendanceResult = await pool.query(
      "SELECT skill FROM attendance WHERE memberid = $1 AND eventid = $2",
      [userId, ev.id]
    );

    if (attendanceResult.rows.length === 0)
      return res.status(404).json({ message: "Attendance record not found" });

    const oldSkill = attendanceResult.rows[0].skill; // e.g. "foodService"

    // If the user had chosen a skill previously:
    if (oldSkill) {
      const filledColumn = oldSkill.toLowerCase() + "filled";

      // 3️⃣ Decrement skill filled count (never go below 0)
      await pool.query(
        `UPDATE events
         SET ${filledColumn} = GREATEST(${filledColumn} - 1, 0)
         WHERE id = $1`,
        [ev.id]
      );
    }

    // 4️⃣ Null the skill and mark willattend false
    const updateAttendance = await pool.query(
      `
      UPDATE attendance
      SET willattend = false,
          hasattended = false,
          skill = NULL
      WHERE memberid = $1 AND eventid = $2
      RETURNING *
      `,
      [userId, ev.id]
    );

    res.status(200).json({
      message: "Un-signed successfully!",
      event: updateAttendance.rows[0],
    });
  } catch (err) {
    console.error("Error Canceling Sign Up:", err);
    res.status(500).json({ error: "Server error while canceling sign up" });
  }
});

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
