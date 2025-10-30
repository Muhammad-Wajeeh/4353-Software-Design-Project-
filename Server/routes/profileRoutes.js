// Server/routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db"); // <- keep this path (routes/ -> ../db)

// -------------------- validators --------------------
const ZIP_RE = /^[0-9]{5}(?:-[0-9]{4})?$/;

const isStr = (x) => typeof x === "string";
const reqStr = (x, name) => {
  if (!isStr(x) || !x.trim()) throw new Error(`${name} is required`);
  return x.trim();
};
const isTwoCharState = (x) => isStr(x) && x.length === 2;

const isArrayOfStrings = (a) =>
  Array.isArray(a) && a.every((s) => typeof s === "string");

const isAvailability = (obj) => {
  if (!obj || typeof obj !== "object") return false;
  if (!Array.isArray(obj.dates)) return false;
  return obj.dates.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
};

// DB row -> API shape
const rowToProfile = (r) => ({
  user_id: r.user_id,
  full_name: r.full_name,
  address1: r.address1,
  address2: r.address2 || "",
  city: r.city,
  state_code: r.state_code,
  zip: r.zip,
  skills: r.skills || [],
  preferences: r.preferences || {},
  availability: r.availability || { dates: [] },
  updated_at: r.updated_at,
});

// -------------------- GET /profile/:userId --------------------
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { rows } = await pool.query(
      `SELECT user_id, full_name, address1, address2, city, state_code, zip,
              skills, preferences, availability, updated_at
         FROM user_profile
        WHERE user_id = $1
        LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.status(200).json(rowToProfile(rows[0]));
  } catch (err) {
    console.error("GET /profile/:userId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// -------------------- PUT /profile/:userId --------------------
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      full_name,
      address1,
      address2 = "",
      city,
      state_code,
      zip,
      skills = [],
      preferences = {},
      availability,
    } = req.body || {};

    // validate
    try {
      reqStr(full_name, "full_name");
      reqStr(address1, "address1");
      reqStr(city, "city");
      if (!isTwoCharState(state_code)) throw new Error("state_code must be 2 characters (e.g., 'TX')");
      if (!isStr(zip) || !ZIP_RE.test(zip)) throw new Error("zip must be 5 digits (or ZIP+4)");
      if (!isArrayOfStrings(skills)) throw new Error("skills must be an array of strings");
      if (!isAvailability(availability)) {
        throw new Error("availability must be { dates: ['YYYY-MM-DD', ...] }");
      }
    } catch (vErr) {
      return res.status(400).json({ message: vErr.message });
    }

    const { rows } = await pool.query(
      `UPDATE user_profile
          SET full_name   = $1,
              address1    = $2,
              address2    = $3,
              city        = $4,
              state_code  = $5,
              zip         = $6,
              skills      = $7,
              preferences = $8::jsonb,
              availability= $9::jsonb,
              updated_at  = NOW()
        WHERE user_id     = $10
        RETURNING user_id, full_name, address1, address2, city, state_code, zip,
                  skills, preferences, availability, updated_at`,
      [
        full_name.trim(),
        address1.trim(),
        address2 ? String(address2).trim() : "",
        city.trim(),
        state_code.toUpperCase(),
        zip,
        skills,
        JSON.stringify(preferences || {}),
        JSON.stringify(availability || { dates: [] }),
        userId,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.status(200).json(rowToProfile(rows[0]));
  } catch (err) {
    console.error("PUT /profile/:userId error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
