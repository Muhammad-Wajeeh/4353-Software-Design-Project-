// Server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../DB");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";

// POST /auth/register
router.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body || {};
  try {
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

// POST /auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Look up the user
    const queryResult = await pool.query(
      "SELECT id, password FROM userprofiles WHERE username = $1",
      [username]
    );

    if (queryResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = queryResult.rows[0];

    // Compare the password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ username: username, id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      message: "Login Successful",
      token,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

async function doesUserExist(username, email) {
  const existingUser = await pool.query(
    "SELECT * FROM userprofiles WHERE username = $1 OR emailaddress = $2",
    [username, email]
  );

  if (existingUser.rows.length > 0) return true;
}

module.exports = router;
