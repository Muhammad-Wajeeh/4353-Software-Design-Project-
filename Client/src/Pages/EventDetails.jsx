import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useParams, useNavigate } from "react-router-dom";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";

export default function EventDetails() {
  const { id } = useParams(); // event id from /events/:id
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/events/${id}`);
        setEvent(data.event);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="container mt-4 text-center">
          <Spinner animation="border" />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Sidebar />
        <div className="container mt-4">
          <p className="text-danger">Event not found.</p>
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 900 }}>
        <Card className="shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <Card.Title className="mb-1">{event.name}</Card.Title>
                <div className="text-muted">{event.organization}</div>
              </div>
              <Badge bg={event.status === "Open" ? "success" : "secondary"}>{event.status}</Badge>
            </div>

            <div className="mt-3">
              <div><strong>Date:</strong> {fmtDate(event.date)}</div>
              <div><strong>Location:</strong> {event.location}</div>
              <div><strong>Capacity:</strong> {event.capacity}</div>
              <div className="mt-2"><strong>Required skills:</strong> {Array.isArray(event.requiredSkills) && event.requiredSkills.length ? event.requiredSkills.join(", ") : "None"}</div>
              <div className="mt-3"><strong>Description:</strong><br />{event.description}</div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
