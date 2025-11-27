// Server/routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../DB");
const authenticateToken = require("./authenticator");

/**
 * GET /events
 * Used by Volunteer Matching – returns FUTURE events with a normalized
 * shape and a requiredSkills array derived from the skill columns.
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        location,
        zipcode,
        urgency,
        date,
        organization,
        hours,
        event_time,
        firstaid,
        foodservice,
        logistics,
        teaching,
        eventsetup,
        dataentry,
        customerservice
      FROM events
      WHERE (date + event_time) > NOW()
      ORDER BY date ASC, event_time ASC
    `);

    const events = result.rows.map((ev) => {
      const requiredSkills = [];
      if (ev.firstaid > 0) requiredSkills.push("first aid");
      if (ev.foodservice > 0) requiredSkills.push("food service");
      if (ev.logistics > 0) requiredSkills.push("logistics");
      if (ev.teaching > 0) requiredSkills.push("teaching");
      if (ev.eventsetup > 0) requiredSkills.push("event setup");
      if (ev.dataentry > 0) requiredSkills.push("data entry");
      if (ev.customerservice > 0) requiredSkills.push("customer service");

      return {
        id: String(ev.id),
        name: ev.name,
        description: ev.description,
        location: ev.location,
        zipcode: ev.zipcode,
        urgency: ev.urgency,
        date: ev.date,
        organization: ev.organization,
        hours: ev.hours,
        time: ev.event_time,
        requiredSkills,
        status: "Open",
      };
    });

    return res.status(200).json({ events });
  } catch (err) {
    console.error("Error fetching events for matching:", err.message);
    return res
      .status(500)
      .json({ error: "Server error while fetching events" });
  }
});

// ------------------------------------------------------------------
// Legacy / admin endpoints (kept for other pages)
// ------------------------------------------------------------------

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
      organization, // optional
      hours,        // 👈 NEW: duration in hours from client
    } = req.body || {};

    const {
      firstAid,
      foodService,
      logistics,
      teaching,
      eventSetup,
      dataEntry,
      customerService,
    } = skillNeeds || {};

    if (!eventName || !eventDate) {
      return res
        .status(400)
        .json({ message: "eventName and eventDate are required" });
    }

    let eventUrgencyNumberForm = 0;
    if (eventUrgency === "Critical") eventUrgencyNumberForm = 3;
    else if (eventUrgency === "High") eventUrgencyNumberForm = 2;
    else if (eventUrgency === "Medium") eventUrgencyNumberForm = 1;
    else if (eventUrgency === "Low") eventUrgencyNumberForm = 0;

    await pool.query(
      `INSERT INTO events (
        name, description, location, zipcode, urgency, date,
        creatorid, organization, event_time, hours,
        firstaid, foodservice, logistics, teaching, eventsetup, dataentry, customerservice
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        eventName,
        eventDescription,
        eventLocation,
        eventZipCode,
        eventUrgencyNumberForm,
        eventDate,
        req.user.id,
        organization || req.user.username, // use provided or fallback to username
        eventTime,
        hours ?? null,            // 👈 store event duration (may be null)
        firstAid,
        foodService,
        logistics,
        teaching,
        eventSetup,
        dataEntry,
        customerService,
      ]
    );

    return res.status(201).json("Event Created");
  } catch (err) {
    const postgresqlUniqueViolationErrorCode = "23505";
    if (err.code === postgresqlUniqueViolationErrorCode) {
      return res.status(400).json({ error: "Event name already exists" });
    }

    console.error("Error creating event:", err);
    return res.status(500).json({ error: "Server error while creating event" });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { eventName } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: "eventName is required" });
    }

    const existingEvent = await pool.query(
      "SELECT * FROM events WHERE name = $1",
      [eventName]
    );

    if (existingEvent.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    await pool.query("DELETE FROM events WHERE name = $1", [eventName]);

    return res
      .status(200)
      .json({ message: `Event '${eventName}' deleted successfully` });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Server error while deleting event" });
  }
});

// GET /event/getAllForThisUser
router.get("/getAllForThisUser", authenticateToken, async (req, res) => {
  try {
    const creatorId = req.user.id;

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
    const userId = req.user.id;

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
      eventTime: ev.event_time,
      organization: ev.organization,
      hours: ev.hours,
      // slots per skill + filled counts
      firstaid: ev.firstaid,
      foodservice: ev.foodservice,
      logistics: ev.logistics,
      teaching: ev.teaching,
      eventsetup: ev.eventsetup,
      dataentry: ev.dataentry,
      customerservice: ev.customerservice,
      firstaidFilled: ev.firstaidfilled,
      foodserviceFilled: ev.foodservicefilled,
      logisticsFilled: ev.logisticsfilled,
      teachingFilled: ev.teachingfilled,
      eventsetupFilled: ev.eventsetupfilled,
      dataentryFilled: ev.dataentryfilled,
      customerserviceFilled: ev.customerservicefilled,
    }));

    res.status(200).json({ events });
  } catch (err) {
    console.error("Error fetching all events:", err.message);
    res.status(500).json({ error: "Server error while fetching events" });
  }
});

/**
 * GET /event/:value
 * Supports either numeric ID or name string, returns full event details
 * including per-skill slots and filled counts.
 */
router.get("/:value", async (req, res) => {
  try {
    const { value } = req.params;

    let result;
    if (/^\d+$/.test(value)) {
      // numeric -> treat as ID
      result = await pool.query("SELECT * FROM events WHERE id = $1", [
        Number(value),
      ]);
    } else {
      // otherwise treat as name
      result = await pool.query("SELECT * FROM events WHERE name = $1", [
        value,
      ]);
    }

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
      firstAid: ev.firstaid,
      foodService: ev.foodservice,
      logistics: ev.logistics,
      teaching: ev.teaching,
      eventSetup: ev.eventsetup,
      dataEntry: ev.dataentry,
      customerService: ev.customerservice,
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

router.put("/signup/:eventName", authenticateToken, async (req, res) => {
  try {
    const { eventName } = req.params;
    const { skill } = req.body;
    const userId = req.user.id;

    if (!skill) {
      return res.status(400).json({ error: "Skill is required to sign up" });
    }

    const skillColumn = skill.toLowerCase();
    const filledColumn = skillColumn + "filled";

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

    if (alreadyFilled >= totalNeeded) {
      return res.status(400).json({
        error: `No available slots left for ${skill}`,
      });
    }

    // 👇 NEW: use event duration as planned volunteer hours
    const eventDurationHours = ev.hours != null ? Number(ev.hours) : 0;

    const attendance = await pool.query(
      `
      INSERT INTO attendance (memberid, eventid, willattend, hasattended, skill, hoursvolunteered)
      VALUES ($1, $2, true, false, $3, $4)
      ON CONFLICT (memberid, eventid)
      DO UPDATE SET
        willattend       = true,
        skill            = EXCLUDED.skill,
        hoursvolunteered = EXCLUDED.hoursvolunteered
      RETURNING *;
      `,
      [userId, ev.id, skill, eventDurationHours]
    );

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

    const eventResult = await pool.query(
      "SELECT * FROM events WHERE name = $1",
      [eventName]
    );

    if (eventResult.rows.length === 0)
      return res.status(404).json({ message: "Event not found" });

    const ev = eventResult.rows[0];

    const attendanceResult = await pool.query(
      "SELECT skill FROM attendance WHERE memberid = $1 AND eventid = $2",
      [userId, ev.id]
    );

    if (attendanceResult.rows.length === 0)
      return res.status(404).json({ message: "Attendance record not found" });

    const oldSkill = attendanceResult.rows[0].skill;

    if (oldSkill) {
      const filledColumn = oldSkill.toLowerCase() + "filled";

      await pool.query(
        `UPDATE events
         SET ${filledColumn} = GREATEST(${filledColumn} - 1, 0)
         WHERE id = $1`,
        [ev.id]
      );
    }

    const updateAttendance = await pool.query(
      `
      UPDATE attendance
      SET willattend = false,
          hasattended = false,
          skill = NULL,
          hoursvolunteered = 0      -- 👈 clear planned hours when cancelling
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
      eventTime,
      skillNeeds,
    } = req.body;

    const existingEvent = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );
    if (existingEvent.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    let eventUrgencyNumberForm = null;
    if (eventUrgency === "Critical") eventUrgencyNumberForm = 3;
    else if (eventUrgency === "High") eventUrgencyNumberForm = 2;
    else if (eventUrgency === "Medium") eventUrgencyNumberForm = 1;
    else if (eventUrgency === "Low") eventUrgencyNumberForm = 0;

    const firstAid = skillNeeds?.firstAid;
    const foodService = skillNeeds?.foodService;
    const logistics = skillNeeds?.logistics;
    const teaching = skillNeeds?.teaching;
    const eventSetup = skillNeeds?.eventSetup;
    const dataEntry = skillNeeds?.dataEntry;
    const customerService = skillNeeds?.customerService;

    const updateQuery = `
      UPDATE events
      SET
        name            = COALESCE($1,  name),
        description     = COALESCE($2,  description),
        location        = COALESCE($3,  location),
        zipcode         = COALESCE($4,  zipcode),
        requiredskills  = COALESCE($5,  requiredskills),
        urgency         = COALESCE($6,  urgency),
        date            = COALESCE($7,  date),
        organization    = COALESCE($8,  organization),
        hours           = COALESCE($9,  hours),
        event_time      = COALESCE($10, event_time),
        firstaid        = COALESCE($11, firstaid),
        foodservice     = COALESCE($12, foodservice),
        logistics       = COALESCE($13, logistics),
        teaching        = COALESCE($14, teaching),
        eventsetup      = COALESCE($15, eventsetup),
        dataentry       = COALESCE($16, dataentry),
        customerservice = COALESCE($17, customerservice)
      WHERE id = $18
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
      eventTime,
      firstAid,
      foodService,
      logistics,
      teaching,
      eventSetup,
      dataEntry,
      customerService,
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
