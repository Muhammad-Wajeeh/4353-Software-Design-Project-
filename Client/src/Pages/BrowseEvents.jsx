import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import "./BrowseEvents.css";

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [eventsToAttend, setEventsToAttend] = useState([]);

  const getEvents = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/event/getAllFutureEvents",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch events");

      const json = await response.json();

      // Server returns { events: [...] } → extract safely
      const eventsList = Array.isArray(json.events) ? json.events : [];

      console.log(eventsList);
      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]); // ensures it never breaks render
    }
  };

  const getEventsToAttendByUser = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/event/getEventsToAttendByUser",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch events");

      const json = await response.json();

      const eventList = Array.isArray(json.eventsAttendedOrToBeAttended)
        ? json.eventsAttendedOrToBeAttended
        : [];

      setEventsToAttend(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEventsToAttend([]); // fallback to empty
    }
  };

  const onClickSignUpButton = async (eventNameToBeSignedUpFor) => {
    try {
      const response = await fetch(
        `http://localhost:5000/event/signup/${encodeURIComponent(
          eventNameToBeSignedUpFor
        )}`,
        {
          method: "PUT", // or "GET" depending on your backend route
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Sign Up failed");
      await getEventsToAttendByUser(); // re-fetch updated list
    } catch (error) {
      console.error(error);
      alert("Could not sign up.");
    }
  };

  const onClickCancelSignUpButton = async (eventNameToBeSignedUpFor) => {
    try {
      const response = await fetch(
        `http://localhost:5000/event/cancelSignUp/${encodeURIComponent(
          eventNameToBeSignedUpFor
        )}`,
        {
          method: "PUT", // or "GET" depending on your backend route
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Sign Up failed");
      await getEventsToAttendByUser(); // re-fetch updated list
    } catch (error) {
      console.error(error);
      alert("Could not sign up.");
    }
  };

  const willAttend = (eventName) => {
    for (const ev of eventsToAttend) {
      if (eventName === ev.eventName) return true;
    }
    return false;
  };

  useEffect(() => {
    getEvents();
    getEventsToAttendByUser();
  }, []);

  return (
    <>
      <Sidebar />
      <div className="events-container">
        {Array.isArray(events) &&
          events.map((event, index) => {
            // fake attendance flag (just for demo)
            const attended = index % 2 === 0; // alternate true/false for now

            const urgency = event.urgency ?? event.eventUrgency ?? "Low";

            let urgencyClass = "";
            let urgencyInWordForm = " ";
            if (urgency === 1) {
              urgencyClass = "urgency-medium";
              urgencyInWordForm = "Medium";
            } else if (urgency === 2) {
              urgencyClass = "urgency-high";
              urgencyInWordForm = "High";
            } else if (urgency === 3) {
              urgencyClass = "urgency-critical";
              urgencyInWordForm = "Critical";
            } else {
              urgencyClass = "urgency-low";
              urgencyInWordForm = "Low";
            }

            return (
              <Card key={event.id} className="event-card">
                {/* 🔹 Attendance badge (top-left) */}
                <div
                  className={`attendance-badge ${
                    willAttend(event.eventName) ? "attending" : "not-attending"
                  }`}
                >
                  {willAttend(event.eventName) ? "Attending" : "Not Attending"}
                </div>

                {/* 🔹 Urgency badge (top-right) */}
                <div className={`urgency-badge ${urgencyClass}`}>
                  urgency : {urgencyInWordForm}
                </div>

                <Card.Header as="h5">{event.organization}</Card.Header>

                <Card.Body>
                  <Card.Title>{event.eventName}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {event.eventLocation}
                  </Card.Subtitle>

                  <Card.Subtitle className="mb-2 text-muted">
                    {(event.eventDate || "").split("T")[0] || "No Date"}
                  </Card.Subtitle>

                  <Card.Subtitle className="mb-2 text-muted">
                    {event.eventTime}
                  </Card.Subtitle>

                  <Card.Text>{event.eventDescription}</Card.Text>

                  <div className="bottom-row">
                    <div className="skills-container">
                      {Array.isArray(event.eventRequiredSkills) &&
                        event.eventRequiredSkills.length > 0 &&
                        event.eventRequiredSkills.map((skill, idx) => (
                          <span key={idx} className="skill-badge">
                            {skill}
                          </span>
                        ))}
                    </div>
                    {willAttend(event.eventName) ? (
                      <Button
                        variant="danger"
                        onClick={() =>
                          onClickCancelSignUpButton(event.eventName)
                        }
                      >
                        Cancel Sign Up
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        onClick={() => onClickSignUpButton(event.eventName)}
                      >
                        Sign Up
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            );
          })}
      </div>
    </>
  );
}

export default BrowseEvents;
