// Client/src/Pages/VolunteerMatching.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";

// Helper to read logged-in user id (stored by Login.jsx)
const getUserId = () => localStorage.getItem("vh_userId");

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

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

// For positions in the details modal (uses /event/:name shape)
const SKILL_FIELDS = [
  ["firstAid", "First Aid"],
  ["foodService", "Food Service"],
  ["logistics", "Logistics"],
  ["teaching", "Teaching"],
  ["eventSetup", "Event Setup"],
  ["dataEntry", "Data Entry"],
  ["customerService", "Customer Service"],
];

// normalize anything date-like to YYYY-MM-DD or null
const toIsoDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const weekdayOf = (iso) => new Date(iso).getDay(); // 0..6 (Sun..Sat)

/**
 * Compute a 0–100 match score between an event and a volunteer profile.
 *  - skills overlap (60%)
 *  - availability by date / weekday (25%)
 *  - location proximity by city/state (15%)
 */
function computeScore(event, profile) {
  if (!profile) return 0;

  const weights = {
    skills: 0.6,
    availability: 0.25,
    location: 0.15,
  };

  // ---------- 1) SKILL MATCH ----------
  const req = Array.isArray(event.requiredSkills) ? event.requiredSkills : [];
  const my = Array.isArray(profile.skills) ? profile.skills : [];
  const reqSet = new Set(req.map((s) => s.toLowerCase()));
  const mySet = new Set(my.map((s) => s.toLowerCase()));
  const overlap = [...reqSet].filter((s) => mySet.has(s)).length;

  const skillScore =
    req.length === 0 ? weights.skills : (overlap / req.length) * weights.skills;

  // ---------- 2) AVAILABILITY MATCH ----------
  let availScore = 0;
  const eventIso = toIsoDate(event.date);
  const dates = Array.isArray(profile.availability?.dates)
    ? profile.availability.dates
    : [];

  if (eventIso && dates.length > 0) {
    const dateSet = new Set(dates);
    const hasExactDate = dateSet.has(eventIso);

    const eventDow = weekdayOf(eventIso);
    const hasSameWeekday = dates.some((d) => {
      const di = toIsoDate(d);
      return di && weekdayOf(di) === eventDow;
    });

    if (hasExactDate) {
      availScore = weights.availability;
    } else if (hasSameWeekday) {
      availScore = weights.availability * 0.5;
    }
  }

  // ---------- 3) LOCATION MATCH ----------
  const profileCity = (profile.city || "").trim().toLowerCase();
  const profileState = (profile.state || "").trim().toLowerCase();

  const locStr = typeof event.location === "string" ? event.location : "";
  const [locCityRaw, locStateRaw] = locStr.split(",");
  const eventCity = (event.city || locCityRaw || "").trim().toLowerCase();
  const eventState = (event.state || locStateRaw || "").trim().toLowerCase();

  let locScore = 0;
  if (profileCity && eventCity && profileCity === eventCity) {
    locScore = weights.location;
  } else if (profileState && eventState && profileState === eventState) {
    locScore = weights.location * 0.5;
  }

  const total = (skillScore + availScore + locScore) * 100;
  return Math.round(Math.min(100, total));
}

export default function VolunteerMatching() {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterMode, setFilterMode] = useState("all"); // all | best
  const [sortMode, setSortMode] = useState("soonest"); // soonest | best

  // track events already joined (based on notifications)
  const [joinedNames, setJoinedNames] = useState(() => new Set());
  const navigate = useNavigate();

  const [detailsEvent, setDetailsEvent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const userId = getUserId();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    let mounted = true;

    if (!userId || !token) {
      console.warn("No userId/token in localStorage – user not logged in?");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [pRes, eRes, nRes] = await Promise.allSettled([
          axios.get(`http://localhost:5000/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/events", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/notifications/getAllForThisUser", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (pRes.status === "fulfilled" && mounted) {
          setProfile(pRes.value.data.user);
        }

        if (eRes.status === "fulfilled" && mounted) {
          setEvents(
            Array.isArray(eRes.value.data.events) ? eRes.value.data.events : []
          );
        } else if (mounted) {
          console.error("Could not load events", eRes.reason);
          setEvents([]);
        }

        if (nRes.status === "fulfilled" && mounted) {
          const notifs = Array.isArray(nRes.value.data.notifications)
            ? nRes.value.data.notifications
            : [];
          const joinedSet = new Set(
            notifs
              .filter((n) => n.isAssignment)
              .map((n) => {
                const prefix = "Requested to join: ";
                if (typeof n.title === "string" && n.title.startsWith(prefix)) {
                  return n.title.slice(prefix.length);
                }
                return null;
              })
              .filter(Boolean)
          );
          setJoinedNames(joinedSet);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId, token]);

  // decorate events with score
  const scored = useMemo(() => {
    return events
      .filter((e) => (e.status || "Open") === "Open")
      .map((e) => ({ ...e, _score: computeScore(e, profile) }));
  }, [events, profile]);

  // filter + sort
  const view = useMemo(() => {
    let list = [...scored];
    if (filterMode === "best") list = list.filter((e) => e._score >= 50);

    if (sortMode === "soonest") {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortMode === "best") {
      list.sort(
        (a, b) => b._score - a._score || new Date(a.date) - new Date(b.date)
      );
    }
    return list;
  }, [scored, filterMode, sortMode]);

  // Join: create an "assignment" notification and update UI
  const handleJoin = async (ev) => {
    if (!token) {
      alert("Please log in to join events.");
      return;
    }

    if (joinedNames.has(ev.name)) {
      alert("You’ve already requested to join this event.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/notifications/createNotification",
        {
          title: `Requested to join: ${ev.name}`,
          description: `You requested to join "${ev.name}" on ${fmtDate(
            ev.date
          )} at ${ev.location}.`,
          isReminder: false,
          isAssignment: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setJoinedNames((prev) => {
        const next = new Set(prev);
        next.add(ev.name);
        return next;
      });
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
      alert("Could not send request.");
    }
  };

  // ---------- Details modal (fetch full event with slots) ----------
  const openDetails = async (ev) => {
    try {
      setDetailsLoading(true);
      const res = await axios.get(
        `http://localhost:5000/event/${encodeURIComponent(ev.name)}`
      );
      setDetailsEvent(res.data);
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
      <div className="container mt-4" style={{ maxWidth: 960 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Volunteer Matching</h2>
          <div className="d-flex align-items-center gap-2">
            <Form.Select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              style={{ width: 180 }}
            >
              <option value="all">All open events</option>
              <option value="best">Best matches (score ≥ 50)</option>
            </Form.Select>

            <Form.Select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="soonest">Sort: Soonest</option>
              <option value="best">Sort: Best match</option>
            </Form.Select>
          </div>
        </div>

        {view.length === 0 ? (
          <p className="text-muted">No events match your filters.</p>
        ) : (
          <div
            className="d-grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {view.map((ev) => {
              const isJoined = joinedNames.has(ev.name);
              return (
                <Card key={ev.id} className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <Card.Title className="mb-2">{ev.name}</Card.Title>
                      <div className="d-flex align-items-center gap-2">
                        {isJoined && <Badge bg="success">Joined</Badge>}
                        <Badge
                          bg={
                            ev._score >= 70
                              ? "success"
                              : ev._score >= 50
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {ev._score}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-muted small mb-1">
                      {fmtDate(ev.date)} • {ev.location}
                    </div>

                    <div className="mb-2">
                      <strong>Required skills:</strong>{" "}
                      {Array.isArray(ev.requiredSkills) &&
                      ev.requiredSkills.length > 0
                        ? ev.requiredSkills.join(", ")
                        : "None"}
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        variant={isJoined ? "success" : "outline-primary"}
                        disabled={isJoined}
                        onClick={() => handleJoin(ev)}
                        title={isJoined ? "Already joined" : "Request to join"}
                      >
                        {isJoined ? "Joined" : "Join"}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => openDetails(ev)}
                      >
                        Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Details modal */}
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
