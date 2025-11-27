// Server/app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS – allow your frontends to call the API and send Authorization header
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: false, // we’re using JWTs, not cookies
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// routes...
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const volunteerHistoryRoutes = require("./routes/volunteerHistoryRoutes");
const notificationRoutes = require("./routes/inboxRoutes");
const eventRoutes = require("./routes/eventRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authenticateToken = require("./routes/authenticator");

app.get("/", (req, res) => res.send("API is running"));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/history", volunteerHistoryRoutes);
app.use("/notifications", notificationRoutes);
app.use("/events", eventRoutes); // main events base
app.use("/event", eventRoutes);  // legacy compatibility
app.use("/matching", matchingRoutes);
app.use("/reports", authenticateToken, reportRoutes);

module.exports = app;
