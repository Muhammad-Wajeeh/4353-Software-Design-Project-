// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db"); 
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName = "" } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userRes = await client.query(
        `INSERT INTO user_credentials (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING user_id, username, email, created_at`,
        [username.trim(), email.trim(), password_hash]
      );
      const user = userRes.rows[0];

      // Create a blank profile so Profile page works out of the box
      await client.query(
        `INSERT INTO user_profile
           (user_id, full_name, address1, city, state_code, zip, skills, preferences, availability)
         VALUES ($1, $2, '', '', 'TX', '77000', '{}', '{}'::jsonb, '{"dates":[]}'::jsonb)`,
        [user.user_id, fullName]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Account created",
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      const msg = String(e.message || "");
      if (msg.includes("user_credentials_username_key")) {
        return res.status(409).json({ message: "Username already exists" });
      }
      if (msg.includes("user_credentials_email_key")) {
        return res.status(409).json({ message: "Email already exists" });
      }
      console.error("Register error:", e);
      res.status(500).json({ message: "Registration failed" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Register outer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: "usernameOrEmail and password are required" });
    }

    const { rows } = await pool.query(
      `SELECT user_id, username, email, password_hash
         FROM user_credentials
        WHERE username = $1 OR email = $1
        LIMIT 1`,
      [usernameOrEmail.trim()]
    );
    if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Logged in",
      token,
      user: { user_id: user.user_id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
