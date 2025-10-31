// Server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../DB");
const authenticate = require("./authenticator.js");


require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";

// ----------------------------
// POST /auth/register
// ----------------------------
router.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body || {};
  try {
    // optional duplicate check
    const existing = await pool.query(
      "SELECT 1 FROM userprofiles WHERE username = $1 OR emailaddress = $2 LIMIT 1",
      [username, email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      `INSERT INTO userprofiles (firstname, lastname, username, emailaddress, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [firstName, lastName, username, email, hash]
    );

    res.json({ message: "Account Created" });
  } catch (err) {
    console.error("register error:", err);
    res.status(400).json({ error: "Registration failed" });
  }
});

// ----------------------------
// POST /auth/login
// ----------------------------
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const queryResult = await pool.query(
      "SELECT id, username, password FROM userprofiles WHERE username = $1",
      [username]
    );

    if (queryResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = queryResult.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login Successful", token });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// GET /auth/me
// ----------------------------
router.get("/me", authenticate, (req, res) => {
  const { id, username } = req.user || {};
  res.json({ id, username });
});

module.exports = router;
