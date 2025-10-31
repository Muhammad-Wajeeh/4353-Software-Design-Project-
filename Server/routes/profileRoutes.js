// Server/routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../DB");

// ---------------- helpers ----------------
const isStr = (v) => typeof v === "string";
const nonEmpty = (v) => isStr(v) && v.trim().length > 0;

const commaToArray = (s) =>
  s ? String(s).split(",").map((x) => x.trim()).filter(Boolean) : [];

const arrayToComma = (arr) =>
  Array.isArray(arr) ? arr.map((x) => String(x).trim()).filter(Boolean).join(",") : "";

const tryParseJSON = (s) => {
  if (!isStr(s)) return null;
  try { return JSON.parse(s); } catch { return null; }
};

// Map DB row -> API user shape
const rowToUser = (r) => {
  const preferencesMaybeJSON = tryParseJSON(r.preferences);
  return {
    id: String(r.id),
    name: r.fullname || [r.firstname, r.lastname].filter(Boolean).join(" ").trim(),
    firstName: r.firstname || "",
    lastName: r.lastname || "",
    username: r.username || "",
    email: r.emailaddress || "",
    address1: r.address1 || "",
    address2: r.address2 || "",
    city: r.city || "",
    state: r.state || "",
    zip: r.zip ? String(r.zip) : "",
    skills: commaToArray(r.skills),
    preferences: preferencesMaybeJSON ?? (r.preferences || ""),
    // New DoW availability, but keep a predictable container
    availability: {
      days: {
        sun: !!r.isavailablesun,
        mon: !!r.isavailablemon,
        tue: !!r.isavailabletue,
        wed: !!r.isavailablewed,
        thu: !!r.isavailablethu,
        fri: !!r.isavailablefri,
        sat: !!r.isavailablesat,
      },
      // legacy compatibility — your old code expected dates array sometimes
      dates: [],
    },
    maxDistanceFromEvents: r.maxdistancefromevents || "",
  };
};

// ---------------- GET /profile/:userId ----------------
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const q = await pool.query(
      `SELECT id, firstname, lastname, username, emailaddress, password, fullname,
              address1, address2, city, state, zip, skills, preferences, maxdistancefromevents,
              isavailablesun, isavailablemon, isavailabletue, isavailablewed,
              isavailablethu, isavailablefri, isavailablesat
         FROM userprofiles
        WHERE id = $1`,
      [userId]
    );
    if (!q.rowCount) return res.status(404).json({ message: "User not found" });

    const { password, ...rest } = q.rows[0];
    return res.status(200).json({ user: rowToUser(rest) });
  } catch (e) {
    console.error("GET /profile/:userId error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- PUT /profile/:userId ----------------
// Accepts partial updates. Supports either:
// 1) availability.days.{sun..sat} booleans (new way) OR
// 2) availability:{dates:[...]} / dates array (legacy; ignored for storage but allowed)
router.put("/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId).trim();
    const {
      name,
      firstName,
      lastName,
      username,
      email,
      address1,
      address2,
      city,
      state,
      zip,
      skills,
      preferences,
      maxDistanceFromEvents,
      availability,   // {days:{sun..sat}} or legacy dates array
    } = req.body || {};

    // validate lightweight
    const errors = [];
    if (name !== undefined && !nonEmpty(name)) errors.push("name must be a non-empty string");
    if (firstName !== undefined && !isStr(firstName)) errors.push("firstName must be a string");
    if (lastName !== undefined && !isStr(lastName)) errors.push("lastName must be a string");
    if (username !== undefined && !nonEmpty(username)) errors.push("username must be a non-empty string");
    if (email !== undefined && !nonEmpty(email)) errors.push("email must be a non-empty string");
    if (address1 !== undefined && !isStr(address1)) errors.push("address1 must be a string");
    if (address2 !== undefined && !isStr(address2)) errors.push("address2 must be a string");
    if (city !== undefined && !nonEmpty(city)) errors.push("city must be a non-empty string");
    if (state !== undefined && (!isStr(state) || state.trim().length < 2 || state.trim().length > 3))
      errors.push("state must be a 2–3 letter code");
    if (zip !== undefined && (!isStr(zip) || !/^\d{5}(-?\d{4})?$/.test(zip.trim())))
      errors.push("zip must be 5 or 9 digits");
    if (skills !== undefined && (!Array.isArray(skills) || skills.some((s) => typeof s !== "string")))
      errors.push("skills must be an array of strings");

    if (errors.length) return res.status(400).json({ errors });

    // Build dynamic UPDATE
    const sets = [];
    const vals = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

    if (name !== undefined)       set("fullname", name.trim());
    if (firstName !== undefined)  set("firstname", firstName);
    if (lastName !== undefined)   set("lastname", lastName);
    if (username !== undefined)   set("username", username.trim());
    if (email !== undefined)      set("emailaddress", email.trim());
    if (address1 !== undefined)   set("address1", address1 || "");
    if (address2 !== undefined)   set("address2", address2 || "");
    if (city !== undefined)       set("city", city || "");
    if (state !== undefined)      set("state", state || "");
    if (zip !== undefined)        set("zip", zip.replace(/\D/g, "")); // keep digits
    if (skills !== undefined)     set("skills", arrayToComma(skills));
    if (maxDistanceFromEvents !== undefined) set("maxdistancefromevents", String(maxDistanceFromEvents));

    // preferences: if object, store JSON; if string, store as-is
    if (preferences !== undefined) {
      if (preferences && typeof preferences === "object" && !Array.isArray(preferences)) {
        set("preferences", JSON.stringify(preferences));
      } else if (preferences == null) {
        set("preferences", null);
      } else {
        set("preferences", String(preferences));
      }
    }

    // availability (new DoW booleans supported)
    if (availability !== undefined) {
      const days = availability?.days ?? availability; // allow {days:{...}} or {sun:..}
      if (days && typeof days === "object" && !Array.isArray(days)) {
        // each provided day toggles; omitted days are unchanged
        if (days.sun !== undefined) set("isavailablesun", !!days.sun);
        if (days.mon !== undefined) set("isavailablemon", !!days.mon);
        if (days.tue !== undefined) set("isavailabletue", !!days.tue);
        if (days.wed !== undefined) set("isavailablewed", !!days.wed);
        if (days.thu !== undefined) set("isavailablethu", !!days.thu);
        if (days.fri !== undefined) set("isavailablefri", !!days.fri);
        if (days.sat !== undefined) set("isavailablesat", !!days.sat);
      }
      // Legacy {dates:[...]} is accepted but ignored for storage (keeps API compatibility)
    }

    if (!sets.length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    vals.push(userId);
    const upd = await pool.query(
      `UPDATE userprofiles SET ${sets.join(", ")} WHERE id = $${i} RETURNING
         id, firstname, lastname, username, emailaddress, fullname,
         address1, address2, city, state, zip, skills, preferences, maxdistancefromevents,
         isavailablesun, isavailablemon, isavailabletue, isavailablewed,
         isavailablethu, isavailablefri, isavailablesat`,
      vals
    );

    if (!upd.rowCount) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Profile updated",
      user: rowToUser(upd.rows[0]),
    });
  } catch (e) {
    // Unique username/email conflicts, etc.
    if (e && e.code === "23505") {
      return res.status(409).json({ message: "Duplicate value violates unique constraint", detail: e.detail });
    }
    console.error("PUT /profile/:userId error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
