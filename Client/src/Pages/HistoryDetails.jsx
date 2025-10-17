import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Spinner from "react-bootstrap/Spinner";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import { useParams, useNavigate } from "react-router-dom";

const userId = "u1";
const fmtDate = (iso) => new Date(iso).toLocaleDateString();

export default function HistoryDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [eRes, hRes] = await Promise.all([
          axios.get(`http://localhost:5000/events/${eventId}`),
          axios.get(`http://localhost:5000/history/${userId}`),
        ]);
        setEvent(eRes.data.event);
        const entry = (hRes.data.history?.events || []).find(ev => ev.eventId === eventId);
        setParticipation(entry || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="container mt-4 text-center"><Spinner animation="border" /></div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Sidebar />
        <div className="container mt-4">
          <p className="text-danger">Event not found.</p>
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>Back</Button>
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
              <Badge bg="secondary">History</Badge>
            </div>

            <div className="mt-3">
              <div><strong>Date:</strong> {fmtDate(event.date)}</div>
              <div><strong>Location:</strong> {event.location}</div>
              <div className="mt-2"><strong>Description:</strong><br />{event.description}</div>
            </div>

            {participation ? (
              <div className="mt-4 p-3 border rounded">
                <div className="fw-bold mb-2">Your Participation</div>
                <div><strong>Status:</strong> {participation.status}</div>
                <div><strong>Hours:</strong> {participation.hours}</div>
              </div>
            ) : (
              <div className="mt-4 text-muted">No recorded participation for this event.</div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
