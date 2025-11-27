// Client/src/Pages/BrowseEvents.jsx
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { Card, Button } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import "./BrowseEvents.css";
import { useNavigate } from "react-router-dom";

const SKILL_FIELDS = [
  ["firstaid", "First Aid"],
  ["foodservice", "Food Service"],
  ["logistics", "Logistics"],
  ["teaching", "Teaching"],
  ["eventsetup", "Event Setup"],
  ["dataentry", "Data Entry"],
  ["customerservice", "Customer Service"],
];



// Helper: format DB time ("13:47:00") as US 12-hour time ("1:47 PM")
const fmtTime = (t) => {
  if (!t) return "TBD";
  const str = String(t);
  const [hStr, mStr = "00"] = str.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return str;

  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${mStr.padStart(2, "0")} ${suffix}`;
};

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [eventsToAttend, setEventsToAttend] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const navigate = useNavigate();

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

      const eventsList = Array.isArray(json.events) ? json.events : [];
      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
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
      setEventsToAttend([]);
    }
  };

  const onClickCancelSignUpButton = async (eventNameToBeSignedUpFor) => {
    try {
      const response = await fetch(
        `http://localhost:5000/event/cancelSignUp/${encodeURIComponent(
          eventNameToBeSignedUpFor
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Cancel Sign Up failed");
      await getEventsToAttendByUser();
    } catch (error) {
      console.error(error);
      alert("Could not cancel sign up.");
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

  // ---------- Modal helpers ----------
  const openDetails = (event) => setSelectedEvent(event);
  const closeDetails = () => setSelectedEvent(null);

  const renderPositions = () => {
    if (!selectedEvent) return null;

    const rows = SKILL_FIELDS.map(([key, label]) => {
      const total = Number(selectedEvent[key] ?? 0);
      const filled =
        Number(
          selectedEvent[key + "Filled"] ??
            selectedEvent[key + "filled"] ??
            0
        ) || 0;

      if (!total) return null;

      const remaining = Math.max(total - filled, 0);

      return (
        <div
          key={key}
          className="d-flex justify-content-between align-items-center mb-1"
        >
          <div>
            <strong>{label}</strong>
          </div>
          <div className="text-muted">
            {filled}/{total} filled{" "}
            {remaining === 0 ? (
              <span className="text-danger fw-semibold">• Full</span>
            ) : (
              <span className="text-success fw-semibold">
                • {remaining} remaining
              </span>
            )}
          </div>
        </div>
      );
    }).filter(Boolean);

    if (rows.length === 0) {
      return (
        <p className="mb-0 text-muted">
          No specific positions have been configured for this event.
        </p>
      );
    }

    return <div>{rows}</div>;
  };

  return (
    <>
      <Sidebar />

      <div className="events-container">
        {Array.isArray(events) &&
          events.map((event, index) => {
            const attending = willAttend(event.eventName);

            const urgency = event.urgency ?? event.eventUrgency ?? "Low";

            let urgencyClass = "";
            let urgencyInWordForm = " ";
            if (urgency === 1 || urgency === "Medium") {
              urgencyClass = "urgency-medium";
              urgencyInWordForm = "Medium";
            } else if (urgency === 2 || urgency === "High") {
              urgencyClass = "urgency-high";
              urgencyInWordForm = "High";
            } else if (urgency === 3 || urgency === "Critical") {
              urgencyClass = "urgency-critical";
              urgencyInWordForm = "Critical";
            } else {
              urgencyClass = "urgency-low";
              urgencyInWordForm = "Low";
            }

            return (
              <Card
                key={event.id || `${event.eventName}-${index}`}
                className="event-card"
              >
                {/* Attendance badge (top-left) */}
                <div
                  className={`attendance-badge ${
                    attending ? "attending" : "not-attending"
                  }`}
                >
                  {attending ? "Attending" : "Not Attending"}
                </div>

                {/* Urgency badge (top-right) */}
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
                    {fmtTime(event.eventTime || event.time)}
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
                    <div className="d-flex gap-2">
                      {attending ? (
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
                          onClick={() =>
                            navigate(
                              `/events/EventSignup/${encodeURIComponent(
                                event.eventName
                              )}`
                            )
                          }
                        >
                          Sign Up
                        </Button>
                      )}
                      <Button
                        variant="outline-secondary"
                        onClick={() => openDetails(event)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
      </div>

      {/* ---------- Event Details Modal ---------- */}
      <Modal
        show={!!selectedEvent}
        onHide={closeDetails}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedEvent?.eventName || "Event Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              <p>
                <strong>Organization:</strong>{" "}
                {selectedEvent.organization || "Unknown"}
              </p>
              <p>
                <strong>Location:</strong>{" "}
                {selectedEvent.eventLocation || "—"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {(selectedEvent.eventDate || "").split("T")[0] || "No Date"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {fmtTime(selectedEvent.eventTime || selectedEvent.time)}
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {selectedEvent.hours
                  ? `${selectedEvent.hours} hour${
                      selectedEvent.hours === 1 ? "" : "s"
                    }`
                  : "Not specified"}
              </p>
              <hr />
              <p>
                <strong>Description:</strong>{" "}
                {selectedEvent.eventDescription || "No description provided."}
              </p>
              <hr />
              <h6>Positions &amp; Slots</h6>
              {renderPositions()}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default BrowseEvents;
