const express = require("express");
const router = express.Router();
const { volunteerEvents } = require("../data/mockData");

// GET /events
router.get("/", (req, res) => {
  res.status(200).json({ events: volunteerEvents });
});

// GET /events/:id
router.get("/:id", (req, res) => {
  const event = volunteerEvents.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.status(200).json({ event });
});

module.exports = router;
