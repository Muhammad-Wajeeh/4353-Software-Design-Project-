const express = require("express");
const app = express();
const cors = require("cors");
// const pool = require("./db");
const bcrypt = require("bcrypt");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const volunteerHistoryRoutes = require("./routes/volunteerHistoryRoutes");

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

app.listen(5000, () => {
  console.log("server has started on port 5000");
});
