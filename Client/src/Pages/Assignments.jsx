// Client/src/Pages/Assignments.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Card, Button, Spinner } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";

const SKILL_FIELDS = [
  ["firstAid", "First Aid"],
  ["foodService", "Food Service"],
  ["logistics", "Logistics"],
  ["teaching", "Teaching"],
  ["eventSetup", "Event Setup"],
  ["dataEntry", "Data Entry"],
  ["customerService", "Customer Service"],
];

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

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailsEvent, setDetailsEvent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/event/getEventsToAttendByUserAndThePosition",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch assignments");

      const data = await response.json();
      setAssignments(data.events || []);
    } catch (err) {
      console.error(err);
      alert("Could not load assignments.");
    } finally {
      setLoading(false);
    }
  };

  const cancelSignup = async (eventName) => {
    if (!window.confirm(`Cancel your signup for '${eventName}'?`)) return;

    try {
      const res = await fetch(
        `http://localhost:5000/event/cancelSignup/${encodeURIComponent(
          eventName
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) throw new Error("Unsign failed");

      alert("Canceled signup successfully");
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel signup.");
    }
  };

  const openDetails = async (eventName) => {
    try {
      setDetailsLoading(true);
      const res = await fetch(
        `http://localhost:5000/event/${encodeURIComponent(eventName)}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDetailsEvent(data);
    } catch (err) {
      console.error("Failed to load event details", err);
      alert("Could not load event details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => setDetailsEvent(null);

  const renderPositions = () => {
    if (!detailsEvent) return null;

    const rows = SKILL_FIELDS.map(([key, label]) => {
      const total = Number(detailsEvent[key] ?? 0);
      const filled =
        Number(detailsEvent[key + "Filled"] ?? detailsEvent[key + "filled"] ?? 0) ||
        0;

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

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (loading)
    return (
      <>
        <Sidebar />
        <div className="d-flex justify-content-center mt-5">
          <Spinner animation="border" />
        </div>
      </>
    );

  return (
    <>
      <Sidebar />

      <div className="d-flex flex-column align-items-center mt-4">
        <h2 className="fw-bold mb-4">Your Event Assignments</h2>

        {assignments.length === 0 ? (
          <p className="text-muted">You are not signed up for any events.</p>
        ) : (
          assignments.map((a) => (
            <Card
              key={a.eventid}
              style={{ width: "50rem" }}
              className="mb-3 p-3 shadow-sm"
            >
              <h4 className="fw-bold">{a.eventname}</h4>

              <p className="text-muted mb-1">
                <strong>Date:</strong> {(a.eventdate || "").split("T")[0]}
              </p>

              <p className="text-muted mb-1">
                <strong>Location:</strong> {a.eventlocation}
              </p>

              <p className="text-primary fw-bold">
                Assigned Position: {a.skill ? a.skill : "No position selected"}
              </p>

              <div className="d-flex justify-content-end gap-2 mt-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => openDetails(a.eventname)}
                >
                  View Details
                </Button>
                <Button
                  variant="danger"
                  onClick={() => cancelSignup(a.eventname)}
                >
                  Cancel Signup
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        show={!!detailsEvent}
        onHide={closeDetails}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {detailsEvent?.eventName || detailsEvent?.name || "Event Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading && (
            <div className="text-center py-3">
              <Spinner animation="border" />
            </div>
          )}
          {!detailsLoading && detailsEvent && (
            <>
              <p>
                <strong>Organization:</strong>{" "}
                {detailsEvent.organization || "Unknown"}
              </p>
              <p>
                <strong>Location:</strong> {detailsEvent.eventLocation || "—"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {(detailsEvent.eventDate || detailsEvent.date || "")
                  .toString()
                  .split("T")[0] || "No Date"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {fmtTime(detailsEvent.eventTime || detailsEvent.event_time)}
              </p>
              <hr />
              <p>
                <strong>Description:</strong>{" "}
                {detailsEvent.eventDescription ||
                  detailsEvent.description ||
                  "No description provided."}
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

export default Assignments;
