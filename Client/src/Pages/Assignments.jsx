import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Card, Button, Spinner } from "react-bootstrap";

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

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

              <Button
                variant="danger"
                className="mt-2"
                onClick={() => cancelSignup(a.eventname)}
              >
                Cancel Signup
              </Button>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

export default Assignments;
