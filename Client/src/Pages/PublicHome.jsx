import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

export default function PublicHome() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/event/getall");
        const list = Array.isArray(data.events) ? data.events : [];
        setEvents(list);
      } catch (e) {
        console.error(e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcoming = useMemo(() => {
    const today = new Date();
    const items = (events || [])
      .filter((e) => new Date(e.eventDate || e.date) >= new Date(today.toDateString()))
      .sort((a, b) => new Date(a.eventDate || a.date) - new Date(b.eventDate || b.date))
      .slice(0, 6);
    return items;
  }, [events]);

  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 1100 }}>
        {/* Hero */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="m-0">Welcome to VolunteerHub 🌟</h2>
            <div className="text-muted">
              Discover upcoming opportunities and make an impact in your community.
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button as={Link} to="/login" variant="primary">
              Log In
            </Button>
            <Button as={Link} to="/register" variant="outline-primary">
              Create Account
            </Button>
          </div>
        </div>

        {/* Upcoming Events (public) */}
        <Card className="shadow-sm mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Card.Title className="mb-0">Upcoming Events</Card.Title>
              <Button as={Link} to="/BrowseEvents" size="sm" variant="outline-primary">
                Browse All
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-muted">No upcoming events yet. Please check back soon!</div>
            ) : (
              <div className="row g-3">
                {upcoming.map((e, i) => {
                  const name = e.eventName ?? e.name;
                  const date = e.eventDate ?? e.date;
                  const location = e.eventLocation ?? e.location;
                  const urgency = e.eventUrgency ?? e.urgency;
                  const skills = e.eventRequiredSkills ?? e.requiredskills ?? [];

                  return (
                    <div className="col-12 col-md-6" key={`${name}-${i}`}>
                      <Card className="h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-semibold">{name}</div>
                              <div className="text-muted small">
                                {fmtDate(date)} • {location || "—"}
                              </div>
                            </div>
                            <Badge bg="secondary">
                              {typeof urgency === "number"
                                ? ["Low", "Medium", "High", "Critical"][
                                    Math.min(Math.max(urgency, 0), 3)
                                  ]
                                : urgency || "—"}
                            </Badge>
                          </div>
                          {Array.isArray(skills) && skills.length > 0 && (
                            <div className="mt-2 small">
                              Required: {skills.join(", ")}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Why join */}
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Why create an account?</Card.Title>
                <ul className="mb-0">
                  <li>Get matched with events that fit your skills & schedule.</li>
                  <li>Track your hours and volunteer history.</li>
                  <li>Receive reminders and important updates.</li>
                </ul>
              </Card.Body>
            </Card>
          </div>
          <div className="col-12 col-md-6">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Just browsing?</Card.Title>
                <div className="text-muted">
                  You can explore events without an account. When you’re ready, log in
                  or register to RSVP and track your impact.
                </div>
                <Button as={Link} to="/BrowseEvents" className="mt-3" variant="outline-primary">
                  Browse Events
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
