const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: false,                      // not using cookies for auth
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// routes...
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const volunteerHistoryRoutes = require("./routes/volunteerHistoryRoutes");
const notificationRoutes = require("./routes/inboxRoutes");
const eventRoutes = require("./routes/eventRoutes");

app.get("/", (req, res) => res.send("API is running"));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/history", volunteerHistoryRoutes);
app.use("/notifications", notificationRoutes);
app.use("/events", eventRoutes);
app.use("/event", eventRoutes); // legacy

module.exports = app;
