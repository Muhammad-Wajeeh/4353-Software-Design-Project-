const express = require("express");
const router = express.Router();
const { events } = require("../data/mockData");

// --------------------
// Existing endpoints
// --------------------

// GET /events -> { events: [...] }
router.get("/", (req, res) => {
  res.status(200).json({ events });
});

// GET /events/:id -> { event }
router.get("/:id", (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.status(200).json({ event });
});

// ----------------------------------------------------
// Aliases to support current frontend client endpoints
// ----------------------------------------------------

// GET /event/getall  -> { events }
router.get("/event/getall", (req, res) => {
  res.status(200).json({ events });
});

// POST /event/create  (body: client form shape)
router.post("/event/create", (req, res) => {
  const {
    eventName,
    eventDescription,
    eventLocation,
    eventZipCode,
    eventRequiredSkills = [],
    eventUrgency,
    eventDate,
  } = req.body || {};

  // Basic validation
  if (!eventName || !eventDate) {
    return res.status(400).json({ message: "eventName and eventDate are required" });
  }

  const newEvent = {
    id: "e" + Math.random().toString(36).slice(2, 8),
    name: eventName,
    description: eventDescription || "",
    location: eventLocation || "",
    zip: eventZipCode || "",
    requiredSkills: Array.isArray(eventRequiredSkills) ? eventRequiredSkills : [],
    urgency: eventUrgency || "Low",
    date: eventDate,
    status: "Open",
    capacity: 0,
    organization: "VolunteerHub",
  };

  events.push(newEvent);
  return res.status(201).json({ event: newEvent, events });
});

// DELETE /event/delete  (body: { eventName })
router.delete("/event/delete", (req, res) => {
  const { eventName } = req.body || {};
  if (!eventName) return res.status(400).json({ message: "eventName required" });

  const idx = events.findIndex((e) => e.name === eventName);
  if (idx === -1) return res.status(404).json({ message: "Event not found" });

  events.splice(idx, 1);
  return res.status(200).json({ events });
});

// GET /event/get/:name -> returns in the client’s expected shape
router.get("/event/get/:name", (req, res) => {
  const ev = events.find((e) => e.name === req.params.name);
  if (!ev) return res.status(404).json({ message: "Event not found" });

  return res.json({
    eventName: ev.name,
    eventDescription: ev.description,
    eventLocation: ev.location,
    eventZipCode: ev.zip,
    eventRequiredSkills: ev.requiredSkills,
    eventUrgency: ev.urgency,
    eventDate: ev.date,
  });
});

// PUT /event/edit/:name  (body: client form shape)
router.put("/event/edit/:name", (req, res) => {
  const idx = events.findIndex((e) => e.name === req.params.name);
  if (idx === -1) return res.status(404).json({ message: "Event not found" });

  const p = req.body || {};
  events[idx] = {
    ...events[idx],
    name: p.eventName ?? events[idx].name,
    description: p.eventDescription ?? events[idx].description,
    location: p.eventLocation ?? events[idx].location,
    zip: p.eventZipCode ?? events[idx].zip,
    requiredSkills: Array.isArray(p.eventRequiredSkills)
      ? p.eventRequiredSkills
      : events[idx].requiredSkills,
    urgency: p.eventUrgency ?? events[idx].urgency,
    date: p.eventDate ?? events[idx].date,
  };

  return res.json({ event: events[idx] });
});

module.exports = router;
