// Server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../DB");
const bcrypt = require("bcrypt");

require("dotenv").config();

// Use provided secret in prod; safe fallback for tests/dev
const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";

// POST /auth/register
router.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body || {};

  var userAlreadyExists = await doesUserExist(username, password);

  if (userAlreadyExists)
    return res.status(400).json({ error: "Username or Email Already Exists" });

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      "INSERT INTO userprofiles (firstname, lastname, username, emailaddress, password) VALUES($1, $2, $3, $4, $5)",
      [firstName, lastName, username, email, hash]
    );

    res.json("Account Created");
  } catch (err) {
    console.log(err.message);
    // need something here to let client side know that the user they are attempting is taken, or the id, maybe even enforce stronger password
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  console.log("login route hit");
  const { username, password } = req.body;
  try {
    const queryResult = await pool.query(
      "SELECT password FROM userprofiles WHERE username = $1",
      [username]
    );

    console.log("Query result:", queryResult.rows);

    if (queryResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const storedHashedPassword = queryResult.rows[0].password;
    const isPasswordValid = await bcrypt.compare(
      password,
      storedHashedPassword
    );
    if (isPasswordValid == true) {
      const token = jwt.sign({ username: username }, JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.json({
        message: "Login Successful",
        token,
      });
    } else {
      res.status(401).json({ error: "login failed: wrong password" });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500);
  }
});

async function doesUserExist(username, email) {
  const existingUser = await pool.query(
    "SELECT * FROM userprofiles WHERE username = $1 OR emailaddress = $2",
    [username, email]
  );

  if (existingUser.rows.length > 0) return true;
}

// Middleware exports (if you use them)
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    console.log("Decoded JWT payload:", user); // <- add this
    req.user = user; // Attach user info to request
    next();
  });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
