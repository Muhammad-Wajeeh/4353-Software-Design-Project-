// Server/routes/statesRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// GET /states -> [{ state_code, state_name }]
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT state_code, state_name
         FROM states
        ORDER BY state_name ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /states error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
