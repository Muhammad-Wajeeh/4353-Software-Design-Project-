// Server/authenticator.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "test_secret_fallback";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    console.log("Decoded JWT payload:", user);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
