const express = require("express");
const router = express.Router();
const { volunteerHistories } = require("../data/mockData");

// GET /history/:userId — get all completed events for a user
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const history = volunteerHistories.find(h => h.userId === userId);

  if (!history) {
    return res.status(404).json({ message: "No volunteer history found for this user" });
  }

  res.status(200).json({ history });
});

module.exports = router;
