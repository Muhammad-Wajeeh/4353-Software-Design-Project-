import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [unread, setUnread] = useState([]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const decoded = decodeJwt(token);
      const storedId = localStorage.getItem("vh_userId");
      const userId = storedId || decoded?.id;

      if (!userId) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const [pRes, eRes, nRes] = await Promise.allSettled([
          axios.get(`http://localhost:5000/profile/${userId}`),
          axios.get("http://localhost:5000/events/getAllForThisUser", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/notifications/getAllForThisUser", {
            headers: { Authorization: `Bearer ${token}` },
            params: { onlyUnread: true },
          }),
        ]);

        if (pRes.status === "fulfilled") setProfile(pRes.value.data.user);
        if (eRes.status === "fulfilled") {
          const list = Array.isArray(eRes.value.data.events)
            ? eRes.value.data.events
            : [];
          setEvents(list);
        }
        if (nRes.status === "fulfilled") {
          const list = Array.isArray(nRes.value.data.notifications)
            ? nRes.value.data.notifications
            : [];
          setUnread(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const name = profile?.name || profile?.username || "Volunteer";

  const upcoming = useMemo(() => {
    const copy = [...events];
    copy.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    return copy.slice(0, 5);
  }, [events]);

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

  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 1100 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="m-0">Welcome back, {name} 👋</h2>
            <div className="text-muted">
              Here’s a quick look at what’s coming up.
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button as={Link} to="/profilemanagement" variant="outline-primary">
              Profile
            </Button>
            <Button as={Link} to="/inbox" variant="outline-secondary">
              Inbox{" "}
              {unread.length > 0 && (
                <Badge bg="danger" pill className="ms-1">
                  {unread.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-7">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Card.Title className="mb-0">My Upcoming Events</Card.Title>
                  <Button
                    as={Link}
                    to="/EventManagement"
                    size="sm"
                    variant="outline-primary"
                  >
                    Manage Events
                  </Button>
                </div>
                {upcoming.length === 0 ? (
                  <div className="text-muted">No upcoming events.</div>
                ) : (
                  <div className="list-group list-group-flush">
                    {upcoming.map((e, idx) => (
                      <div
                        key={idx}
                        className="list-group-item d-flex justify-content-between align-items-start"
                      >
                        <div>
                          <div className="fw-semibold">{e.eventName}</div>
                          <div className="text-muted small">
                            {fmtDate(e.eventDate)} • {e.eventLocation}
                          </div>
                          {Array.isArray(e.eventRequiredSkills) &&
                            e.eventRequiredSkills.length > 0 && (
                              <div className="mt-1 small">
                                Required: {e.eventRequiredSkills.join(", ")}
                              </div>
                            )}
                        </div>
                        <Badge bg="secondary">
                          {typeof e.eventUrgency === "number"
                            ? ["Low", "Medium", "High", "Critical"][
                                Math.min(Math.max(e.eventUrgency, 0), 3)
                              ]
                            : e.eventUrgency || "—"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          <div className="col-12 col-lg-5">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Card.Title className="mb-0">
                    Unread Notifications
                  </Card.Title>
                  <Button
                    as={Link}
                    to="/inbox"
                    size="sm"
                    variant="outline-secondary"
                  >
                    Open Inbox
                  </Button>
                </div>
                {unread.length === 0 ? (
                  <div className="text-muted">You’re all caught up!</div>
                ) : (
                  <div className="list-group list-group-flush">
                    {unread.slice(0, 5).map((n) => (
                      <div
                        key={n.notificationId}
                        className="list-group-item"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <Badge
                            bg={
                              n.isAssignment
                                ? "primary"
                                : n.isReminder
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {n.isAssignment
                              ? "assignment"
                              : n.isReminder
                              ? "reminder"
                              : "update"}
                          </Badge>
                          <strong>{n.title}</strong>
                        </div>
                        <div className="mt-1">{n.description}</div>
                        {n.dateReceived && (
                          <div className="text-muted small">
                            {new Date(n.dateReceived).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12 col-lg-6">
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Card.Title className="mb-0">Volunteer Matching</Card.Title>
                  <Button
                    as={Link}
                    to="/VolunteerMatching"
                    size="sm"
                    variant="outline-primary"
                  >
                    Open
                  </Button>
                </div>
                <div className="text-muted">
                  Personalized suggestions for events that fit your skills and
                  availability.
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className="col-12 col-lg-6">
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Card.Title className="mb-0">Volunteer History</Card.Title>
                  <Button
                    as={Link}
                    to="/VolunteerHistory"
                    size="sm"
                    variant="outline-primary"
                  >
                    Open
                  </Button>
                </div>
                <div className="text-muted">
                  Track completed hours and view your participation details.
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
