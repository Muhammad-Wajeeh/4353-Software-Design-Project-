// Server/routes/matchingRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pool = require("../DB");

// ====== simple JWT auth (self-contained) ======
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Missing auth token" });
    }

    const secret =
      process.env.jwtSecret || process.env.JWT_SECRET || "jwtSecret";

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.error("JWT verify error in /matching:", err);
        return res.status(403).json({ message: "Invalid token" });
      }
      // Your payload looks like: { username: 'jeffdunn21', id: '16', ... }
      req.user = {
        id: decoded.id,
        username: decoded.username,
      };
      next();
    });
  } catch (e) {
    console.error("authenticateJWT error:", e);
    return res.status(500).json({ message: "Auth error" });
  }
}

// ====== helpers ======
const skillsStringToArray = (s) =>
  s
    ? String(s)
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    : [];

function eventRowToSkills(row) {
  const skills = [];
  if (row.firstaid && Number(row.firstaid) > 0) skills.push("first aid");
  if (row.foodservice && Number(row.foodservice) > 0) skills.push("food service");
  if (row.logistics && Number(row.logistics) > 0) skills.push("logistics");
  if (row.teaching && Number(row.teaching) > 0) skills.push("teaching");
  if (row.eventsetup && Number(row.eventsetup) > 0) skills.push("event setup");
  if (row.dataentry && Number(row.dataentry) > 0) skills.push("data entry");
  if (row.customerservice && Number(row.customerservice) > 0)
    skills.push("customer service");
  return skills;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABELS = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

/**
 * GET /matching/recommendations
 *
 * Returns a list of upcoming events ranked by how well they match:
 *  - volunteer skills
 *  - day-of-week availability
 *  - very simple "distance" (zip match)
 *  - urgency
 */
router.get("/recommendations", authenticateJWT, async (req, res) => {
  try {
    const userId = String(req.user.id);

    // 1) Load volunteer profile
    const profileQ = await pool.query(
      `SELECT id, city, state, zip, skills, maxdistancefromevents,
              isavailablesun, isavailablemon, isavailabletue, isavailablewed,
              isavailablethu, isavailablefri, isavailablesat
         FROM userprofiles
        WHERE id = $1`,
      [userId]
    );

    if (!profileQ.rowCount) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const p = profileQ.rows[0];

    const userSkills = skillsStringToArray(p.skills);
    const availability = {
      sun: !!p.isavailablesun,
      mon: !!p.isavailablemon,
      tue: !!p.isavailabletue,
      wed: !!p.isavailablewed,
      thu: !!p.isavailablethu,
      fri: !!p.isavailablefri,
      sat: !!p.isavailablesat,
    };
    const hasAnyAvailability = Object.values(availability).some(Boolean);

    const maxDistanceMiles = p.maxdistancefromevents
      ? Number(p.maxdistancefromevents)
      : null;
    const userZip = p.zip ? String(p.zip) : null;

    // 2) Load candidate events (future, user not already signed up)
    const eventsQ = await pool.query(
      `
      SELECT
        e.id,
        e.name,
        e.description,
        e.location,
        e.zipcode,
        e.urgency,      -- 0=Low..3=Critical
        e.date,
        e.event_time,
        e.organization,
        e.firstaid,
        e.foodservice,
        e.logistics,
        e.teaching,
        e.eventsetup,
        e.dataentry,
        e.customerservice
      FROM events e
      WHERE e.date >= CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM attendance a
          WHERE a.event_id = e.id
            AND a.user_id = $1
        )
      ORDER BY e.date ASC
      `,
      [userId]
    );

    const now = new Date();

    const matches = eventsQ.rows.map((e) => {
      const eventSkills = eventRowToSkills(e);
      const overlapSkills = eventSkills.filter((s) =>
        userSkills.includes(s)
      );

      // Day-of-week availability
      const eventDate = e.date ? new Date(e.date) : null;
      const dowKey =
        eventDate && !isNaN(eventDate)
          ? DAY_KEYS[eventDate.getDay()]
          : null;
      const availableOnDay =
        hasAnyAvailability && dowKey ? !!availability[dowKey] : false;

      // Super simple distance logic: same ZIP prefix
      let withinDistance = true;
      if (maxDistanceMiles !== null && userZip && e.zipcode) {
        withinDistance =
          String(userZip).slice(0, 5) === String(e.zipcode).slice(0, 5);
      }

      const urgency =
        typeof e.urgency === "number"
          ? e.urgency
          : Number(e.urgency || 0);

      let urgencyBonus = 0;
      if (urgency >= 3) urgencyBonus = 3; // Critical
      else if (urgency === 2) urgencyBonus = 2; // High
      else if (urgency === 1) urgencyBonus = 1; // Medium

      const skillScore = overlapSkills.length * 2;
      const dayScore = availableOnDay ? 2 : 0;
      const distanceScore = withinDistance ? 2 : 0;

      const matchScore = skillScore + dayScore + distanceScore + urgencyBonus;

      const reasons = [];
      if (overlapSkills.length) {
        reasons.push(`Skills match: ${overlapSkills.join(", ")}`);
      }
      if (availableOnDay && dowKey) {
        reasons.push(`You are available on ${DAY_LABELS[dowKey]}`);
      }
      if (withinDistance && userZip && e.zipcode) {
        reasons.push(`Same ZIP area (${userZip})`);
      }
      if (urgencyBonus > 0) {
        reasons.push(
          urgency >= 3
            ? "Critical urgency event"
            : urgency === 2
            ? "High urgency event"
            : "Medium urgency event"
        );
      }

      return {
        eventId: e.id,
        name: e.name,
        description: e.description,
        location: e.location,
        zipcode: e.zipcode,
        organization: e.organization,
        date: e.date,
        time: e.event_time,
        urgency,
        neededSkills: eventSkills,
        overlapSkills,
        availableOnDay,
        withinDistance,
        matchScore,
        reasons,
      };
    });

    // 3) Filter out totally irrelevant events
    const filtered = matches.filter((m) => {
      const hasSkill = m.overlapSkills.length > 0;
      const hasDay = m.availableOnDay || !hasAnyAvailability;
      const okDistance = m.withinDistance;
      return hasSkill && hasDay && okDistance;
    });

    // 4) Sort and cap
    filtered.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      const da = a.date ? new Date(a.date) : now;
      const db = b.date ? new Date(b.date) : now;
      return da - db;
    });

    const top = filtered.slice(0, 10);

    return res.status(200).json({
      count: top.length,
      matches: top,
    });
  } catch (err) {
    console.error("GET /matching/recommendations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
