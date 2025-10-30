// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const volunteerHistoryRoutes = require("./routes/volunteerHistoryRoutes");
const notificationRoutes = require("./routes/inboxRoutes");
const eventRoutes = require("./routes/eventRoutes");
const legacyEventRoutes = require("./routes/eventLegacyRoutes");
const statesRoutes = require("./routes/statesRoutes"); // <-- NEW

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("API is running"));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/history", volunteerHistoryRoutes);
app.use("/notifications", notificationRoutes);
app.use("/events", eventRoutes);
app.use("/event", legacyEventRoutes);
app.use("/states", statesRoutes); // <-- NEW

app.listen(PORT, () => console.log(`server has started on port ${PORT}`));
