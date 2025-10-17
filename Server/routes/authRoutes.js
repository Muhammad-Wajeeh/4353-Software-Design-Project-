// routes/userRoutes.js
const express = require("express");
const router = express.Router();

require("dotenv").config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
let blacklistedTokens = [];


router.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;
  console.log(req.body);

  try {
    // ---------- hard coding the storage for now
    const tempStorageForRegistrationInfo = {
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: password,
    };

    console.log(tempStorageForRegistrationInfo);
    // ------------

    // ----------- will be used when we implement DB

    // const saltRounds = 10;
    // const hash = await bcrypt.hash(password, saltRounds);

    // await pool.query(
    //   "INSERT INTO members (firstName, LastName, username, password, email) VALUES($1, $2, $3, $4, $5)",
    //   [firstName, lastName, username, hash, email]
    // );

    // -----------
    res.json("Account Created");
  } catch (err) {
    console.log(err.message);
    // need something here to let client side know that the user they are attempting is taken, or the id, maybe even enforce stronger password
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // ----------- will be used when we implement DB

    // const queryResult = await pool.query(
    //   "SELECT password, id, position FROM members WHERE username = $1",
    //   [username]
    // );

    // if (queryResult.rows.length === 0) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    // const storedHashedPassword = queryResult.rows[0].password;
    // const userId = queryResult.rows[0].id;
    // const isValid = await bcrypt.compare(password, storedHashedPassword);
    // if (isValid == true) {
    //   const userPosition = queryResult.rows[0].position;

    //   const token = jwt.sign(
    //     { id: userId, username: username, position: userPosition },
    //     JWT_SECRET,
    //     { expiresIn: "1h" }
    //   );

    // ------------

    const tempHardcodedPassword = "ILoveFoodAndNoobs";

    if (password == tempHardcodedPassword) {
      const token = jwt.sign(
        {
          username,
          jti: crypto.randomUUID(),
          iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

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

// function to logout and also localstorage.removeitem('accesstoken'): should the removeitem access token thing on the client side after you hit this enpoint.
// LOGOUT (blacklist token)
router.delete("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(400);

  blacklistedTokens.push(token);
  res.json({ message: "Logged out successfully" });
});

// will run when certain endpoint are hit, so that we can verify user access
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // Unauthorized
  if (blacklistedTokens.includes(token)) return res.sendStatus(403);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    console.log("Decoded JWT payload:", user); // <- add this
    req.user = user; // Attach user info to request
    next();
  });
}

function authorizeRoles(...allowedPositions) {
  return (req, res, next) => {
    if (!req.user || !allowedPositions.includes(req.user.position)) {
      return res.sendStatus(403);
    }
    next();
  };
}

module.exports = router;
