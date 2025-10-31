// Server/middleware/auth.js
const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const auth = req.headers.authorization || "";        // "Bearer <token>"
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    // expected payload: { id, username, ... }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { authenticate };
