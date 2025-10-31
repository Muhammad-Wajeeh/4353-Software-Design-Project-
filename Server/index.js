const app = require("./app");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server has started on port ${PORT}`);
});

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const volunteerHistoryRoutes = require("./routes/volunteerHistoryRoutes");
const notificationRoutes = require("./routes/inboxRoutes");
const eventRoutes = require("./routes/eventRoutes");

//middleware

app.use(cors());
app.use(express.json());

//routes

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/history", volunteerHistoryRoutes);
app.use("/notifications", notificationRoutes);
app.use("/event", eventRoutes);
