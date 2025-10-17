// Server/routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const { events } = require("../data/mockData"); // <-- use `events`

// GET /events
router.get("/", (req, res) => {
  return res.status(200).json({ events });
});

// GET /events/:id
router.get("/:id", (req, res) => {
  const id = String(req.params.id);
  const event = events.find((e) => String(e.id) === id);
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }
  return res.status(200).json({ event });
});

module.exports = router;
