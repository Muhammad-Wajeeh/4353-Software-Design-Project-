// routes/userRoutes.js
const express = require("express");
const router = express.Router();

var tempListOfEvents = [];

router.post(
  "/create",
  // authenticateToken,
  // authorizeRoles("Admin"),
  async (req, res) => {
    const {
      eventName,
      eventDescription,
      eventLocation,
      eventZipCode,
      eventRequiredSkills,
      eventUrgency,
      eventDate,
    } = req.body;

    console.log(
      eventName,
      eventDescription,
      eventLocation,
      eventZipCode,
      eventRequiredSkills,
      eventUrgency,
      eventDate
    );
    try {
      var tempEventDict = {
        eventName: eventName,
        eventDescription: eventDescription,
        eventLocation: eventLocation,
        eventZipCode: eventZipCode,
        eventRequiredSkills: eventRequiredSkills,
        eventUrgency: eventUrgency,
        eventDate: eventDate,
      };

      console.log(tempEventDict);

      tempListOfEvents.push(tempEventDict);

      for (var x of tempListOfEvents) {
        console.log(x.eventName);
      }

      // implement when DB is created
      //   await pool.query(
      //     "INSERT INTO Events (id, name, worthinpoints, eventdate) VALUES ($1, $2, $3, $4)",
      //     [eventId, eventName, eventWorthInPoints, eventDate]
      //   );

      res.json("Event successfully created");
    } catch (error) {
      console.log(error);
      res.json("Event could not be created");
    }
  }
);

router.get(
  "/getAll",
  // authenticateToken,
  // authorizeRoles("Admin", "Member"),
  async (req, res) => {
    try {
      //   const responseOfEventNames = await pool.query(
      //     "SELECT name, worthinpoints, description, eventdate FROM events"
      //   );
      //   console.log(responseOfEventNames);
      //   res.json(responseOfEventNames.rows);
      res.json(tempListOfEvents);
    } catch (error) {
      res.json("No Events Found");
    }
  }
);

router.delete(
  "/delete",
  // authenticateToken,
  // authorizeRoles("Admin", "Member"),
  async (req, res) => {
    const { eventName } = req.body;
    console.log(eventName);
    try {
      const index = tempListOfEvents.findIndex(
        (evt) => evt.eventName === eventName
      );

      if (index !== -1) {
        // remove it in place
        tempListOfEvents.splice(index, 1);
      }
      res.json(tempListOfEvents);
    } catch (error) {
      res.json("No Events Found");
    }
  }
);

module.exports = router;
