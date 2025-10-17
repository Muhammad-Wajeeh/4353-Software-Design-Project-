// Server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Use provided secret in prod; safe fallback for tests/dev
const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";
let blacklistedTokens = [];

// POST /auth/register  (dummy for now)
router.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body || {};
  // store/mock however you like for now
  return res.status(200).json({ message: "Account Created" });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  try {
    // temp hardcoded password for assignment (no DB yet)
    const TEMP_PASS = "ILoveFoodAndNoobs";
    if (password !== TEMP_PASS) {
      return res.status(401).json({ error: "login failed: wrong password" });
    }

    const token = jwt.sign(
      {
        username,
        jti: crypto.randomUUID(),
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "Login Successful", token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /auth/logout
router.delete("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(400);
  blacklistedTokens.push(token);
  return res.json({ message: "Logged out successfully" });
});

// Middleware exports (if you use them)
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  if (blacklistedTokens.includes(token)) return res.sendStatus(403);

  jwt.verify(JWT_SECRET ? token : "", JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
