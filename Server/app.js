// Server/app.js
const express = require("express");
const cors = require("cors");

// routes
const authRoutes = require("./routes/authRoutes");          // or userRoutes if that's your filename
const profileRoutes = require("./routes/profileRoutes");
const volunteerHistoryRoutes = require("./routes/volunteerHistoryRoutes");
const notificationRoutes = require("./routes/inboxRoutes"); // your notifications router
const eventRoutes = require("./routes/eventRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health
app.get("/", (req, res) => res.send("API is running"));

// mount routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/history", volunteerHistoryRoutes);
app.use("/notifications", notificationRoutes);
app.use("/events", eventRoutes);

module.exports = app;
