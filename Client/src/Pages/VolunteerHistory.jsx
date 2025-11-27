// Client/src/Pages/VolunteerHistory.jsx
import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Sidebar from "./Sidebar";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

// If your backend uses these column names, this will let us
// display position/slot info similar to BrowseEvents / Assignments.
const SKILL_FIELDS = [
  ["firstaid", "First Aid"],
  ["foodservice", "Food Service"],
  ["logistics", "Logistics"],
  ["teaching", "Teaching"],
  ["eventsetup", "Event Setup"],
  ["dataentry", "Data Entry"],
  ["customerservice", "Customer Service"],
];

// format "13:47:00" or "13:47" → "1:47 PM"
function formatEventTime(dbTime) {
  if (!dbTime) return "TBD";
  const [hStr, mStr] = String(dbTime).split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10) || 0;

  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  const minPadded = String(m).padStart(2, "0");
  return `${hour12}:${minPadded} ${period}`;
}

function VolunteerHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/history/getVolunteerHistory",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("Fetched history:", data);

      // Support both possible shapes: { history: { events: [...] } } or { pastEvents: [...] }
      const events = data.history?.events || data.pastEvents || [];
      setHistory(Array.isArray(events) ? events : []);
    } catch (err) {
      console.error("Failed to load volunteer history:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/history/updateAttendanceHistory",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("updated attendance", data);
    } catch (err) {
      console.error("failed to update attendance:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    updateAttendance();
  }, []);

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
          No specific positions were configured (or data not available).
        </p>
      );
    }

    return <div>{rows}</div>;
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Sidebar />

      <Table hover>
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Event Date</th>
            <th>Organization</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {history.map((event, idx) => (
            <tr key={event.id ?? `${event.name}-${idx}`}>
              <td>{event.name || event.eventName}</td>
              <td>{(event.date || event.eventDate || "").split("T")[0] || "No Date"}</td>
              <td>{event.organization || "Unknown"}</td>
              <td>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => openDetails(event)}
                >
                  Details
                </Button>
              </td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-muted">
                No past events found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Details modal for a past event */}
      <Modal
        show={!!selectedEvent}
        onHide={closeDetails}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedEvent?.name || selectedEvent?.eventName || "Event Details"}
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
                {selectedEvent.location ||
                  selectedEvent.eventLocation ||
                  "—"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {(selectedEvent.date || selectedEvent.eventDate || "")
                  .split("T")[0] || "No Date"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {formatEventTime(
                  selectedEvent.event_time ||
                    selectedEvent.eventTime ||
                    selectedEvent.time
                )}
              </p>
              {selectedEvent.description || selectedEvent.eventDescription ? (
                <>
                  <hr />
                  <p>
                    <strong>Description:</strong>{" "}
                    {selectedEvent.description ||
                      selectedEvent.eventDescription}
                  </p>
                </>
              ) : null}

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

export default VolunteerHistory;
