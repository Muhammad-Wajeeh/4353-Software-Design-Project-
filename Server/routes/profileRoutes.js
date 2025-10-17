// Server/routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const { users } = require("../data/mockData");

// helpers
const isString = (v) => typeof v === "string";
const nonEmptyString = (v) => isString(v) && v.trim().length > 0;

// GET /profile/:userId — fetch profile (no password)
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const user = users.find((u) => String(u.id) === String(userId));
  if (!user) return res.status(404).json({ message: "User not found" });

  const { password, ...safeUser } = user;

  // Back-compat: if older mock had only `location`, try a light parse once
  if (!safeUser.city && isString(safeUser.location)) {
    const parts = safeUser.location.split(",").map((s) => s.trim());
    safeUser.city = safeUser.city || parts[0] || "";
    safeUser.state = safeUser.state || parts[1] || "";
    safeUser.zip = safeUser.zip || parts[2] || "";
  }

  // Ensure availability is always { dates: [...] } when present
  if (safeUser.availability) {
    if (Array.isArray(safeUser.availability)) {
      safeUser.availability = { dates: [...new Set(safeUser.availability)].sort() };
    } else if (
      !Array.isArray(safeUser.availability.dates) &&
      Array.isArray(safeUser.availability)
    ) {
      safeUser.availability = { dates: [...new Set(safeUser.availability)].sort() };
    }
  }

  return res.status(200).json({ user: safeUser });
});

// PUT /profile/:userId — partial update (structured address + normalized availability)
router.put("/:userId", (req, res) => {
  const userId = String(req.params.userId).trim();
  const {
    name,
    address1,
    address2,
    city,
    state,
    zip,
    location,     // legacy optional field
    skills,
    availability, // may be array or { dates: [...] }
    preferences,
  } = req.body || {};

  const user = users.find((u) => String(u.id).trim() === userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const errors = [];

  if (name !== undefined && !nonEmptyString(name))
    errors.push("name must be a non-empty string");

  if (address1 !== undefined && !isString(address1))
    errors.push("address1 must be a string");

  if (address2 !== undefined && !isString(address2))
    errors.push("address2 must be a string");

  if (city !== undefined && !nonEmptyString(city))
    errors.push("city must be a non-empty string");

  if (
    state !== undefined &&
    (!isString(state) || state.trim().length < 2 || state.trim().length > 3)
  )
    errors.push("state must be a 2–3 letter code");

  if (
    zip !== undefined &&
    (!isString(zip) || !/^\d{5}(-?\d{4})?$/.test(zip.trim()))
  )
    errors.push("zip must be 5 or 9 digits");

  if (
    skills !== undefined &&
    (!Array.isArray(skills) || skills.some((s) => typeof s !== "string"))
  )
    errors.push("skills must be an array of strings");

  if (
    preferences !== undefined &&
    (typeof preferences !== "object" || preferences === null || Array.isArray(preferences))
  )
    errors.push("preferences must be an object");

  // Normalize availability to { dates: ["YYYY-MM-DD", ...] } if provided
  let normalizedAvailability = undefined;
  if (availability !== undefined) {
    let dates = [];

    if (Array.isArray(availability)) {
      dates = availability;
    } else if (
      availability &&
      typeof availability === "object" &&
      Array.isArray(availability.dates)
    ) {
      dates = availability.dates;
    } else {
      errors.push("availability must be an array of dates or an object like { dates: [...] }");
    }

    if (errors.length === 0) {
      const bad = dates.find(
        (d) => typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)
      );
      if (bad) {
        errors.push("each availability date must be a string in YYYY-MM-DD format");
      } else {
        normalizedAvailability = { dates: Array.from(new Set(dates)).sort() };
      }
    }
  }

  if (errors.length) return res.status(400).json({ errors });

  // Apply updates
  if (name !== undefined) user.name = name.trim();

  if (address1 !== undefined) user.address1 = address1.trim();
  if (address2 !== undefined) user.address2 = address2.trim();
  if (city !== undefined) user.city = city.trim();
  if (state !== undefined) user.state = state.trim();
  if (zip !== undefined) user.zip = zip.trim();

  // Legacy: best-effort split of `location` if no structured fields were sent
  if (
    location !== undefined &&
    address1 === undefined &&
    city === undefined &&
    state === undefined &&
    zip === undefined &&
    isString(location)
  ) {
    const parts = location.split(",").map((s) => s.trim());
    user.city = user.city || parts[0] || "";
    user.state = user.state || parts[1] || "";
    user.zip = user.zip || parts[2] || "";
  }

  if (skills !== undefined) user.skills = skills.map((s) => s.trim());
  if (preferences !== undefined) user.preferences = preferences;
  if (normalizedAvailability !== undefined) user.availability = normalizedAvailability;

  const { password, ...safeUser } = user;
  return res.status(200).json({ message: "Profile updated", user: safeUser });
});

module.exports = router;
