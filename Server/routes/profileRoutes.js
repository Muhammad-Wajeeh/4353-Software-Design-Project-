// Server/routes/profileRoutes.js
const express = require("express");
const router = express.Router();

const { users } = require("../data/mockData");
const {
  // optional: simple inline validation; you can swap to your validators module later
} = {};

// GET /profile/:userId  — fetch a profile (no password)
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => String(u.id) === String(userId));
  if (!user) return res.status(404).json({ message: "User not found" });

  const { password, ...safeUser } = user;
  return res.status(200).json({ user: safeUser });
});

// PUT /profile/:userId  — partial update
router.put("/:userId", (req, res) => {
  const userId = String(req.params.userId).trim();
  const { name, location, skills, availability, preferences } = req.body || {};

  // DEBUG (safe to remove later)
  console.log("Available users:", users);
  console.log("Looking for ID:", userId);

  const user = users.find(u => String(u.id).trim() === userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // minimal validations (expand later)
  if (name !== undefined && (typeof name !== "string" || !name.trim()))
    return res.status(400).json({ errors: ["name must be a non-empty string"] });
  if (location !== undefined && (typeof location !== "string" || !location.trim()))
    return res.status(400).json({ errors: ["location must be a non-empty string"] });
  if (skills !== undefined && (!Array.isArray(skills) || skills.some(s => typeof s !== "string")))
    return res.status(400).json({ errors: ["skills must be an array of strings"] });
  if (availability !== undefined && (typeof availability !== "object" || availability === null || Array.isArray(availability)))
    return res.status(400).json({ errors: ["availability must be an object"] });
  if (preferences !== undefined && (typeof preferences !== "object" || preferences === null || Array.isArray(preferences)))
    return res.status(400).json({ errors: ["preferences must be an object"] });

  // apply partial updates
  if (name !== undefined) user.name = name.trim();
  if (location !== undefined) user.location = location.trim();
  if (skills !== undefined) user.skills = skills.map(s => s.trim());
  if (availability !== undefined) user.availability = availability;
  if (preferences !== undefined) user.preferences = preferences;

  const { password, ...safeUser } = user;
  return res.status(200).json({ message: "Profile updated", user: safeUser });
});

module.exports = router; 
