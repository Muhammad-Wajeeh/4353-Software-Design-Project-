const express = require("express");
const router = express.Router();
const pool = require("../DB");
const authenticateToken = require("./authenticator");

// GET /history/:userId — all completed events for this user
router.get("/getVolunteerHistory", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // comes from the JWT payload
    // Query attendance records joined with events
    const queryResult = await pool.query(
      "select eventid from attendance where memberid = $1",
      [userId]
    );

    console.log(queryResult);


    return res.status(200).json("hello");
  } catch (e) {
    console.error("GET /history/:userId error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
