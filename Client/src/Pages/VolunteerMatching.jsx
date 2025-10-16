import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

const userId = "u1"; // mock user until auth is wired

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";

const weekdayOf = (iso) => new Date(iso).getDay(); // 0..6

function computeScore(event, profile) {
  if (!profile) return 0;

  const req = Array.isArray(event.requiredSkills) ? event.requiredSkills : [];
  const my = Array.isArray(profile.skills) ? profile.skills : [];
  const reqSet = new Set(req.map((s) => s.toLowerCase()));
  const mySet = new Set(my.map((s) => s.toLowerCase()));
  const overlap = [...reqSet].filter((s) => mySet.has(s)).length;
  const skillPart = req.length === 0 ? 30 : Math.round((overlap / req.length) * 60); // up to 60

  let availPart = 0;
  try {
    const dow = String(weekdayOf(event.date));
    const has = profile.availability && profile.availability[dow] && profile.availability[dow].length > 0;
    availPart = has ? 25 : 0;
  } catch (_) {}

  const sameCity =
    typeof profile.location === "string" &&
    typeof event.location === "string" &&
    profile.location.split(",")[0].trim().toLowerCase() ===
      event.location.split(",")[0].trim().toLowerCase();
  const locPart = sameCity ? 15 : 0;

  return Math.min(100, skillPart + availPart + locPart);
}

export default function VolunteerMatching() {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterMode, setFilterMode] = useState("all");   // all | best
  const [sortMode, setSortMode] = useState("soonest");   // soonest | best

  // ✅ track events already joined (backed by notifications meta.eventId)
  const [joinedIds, setJoinedIds] = useState(() => new Set());

  // fetch profile + events + existing “joined” from notifications
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [pRes, eRes, nRes] = await Promise.allSettled([
          axios.get("http://localhost:5000/profile/u1"),
          axios.get("http://localhost:5000/events"),
          axios.get(`http://localhost:5000/notifications/${userId}`),
        ]);

        if (pRes.status === "fulfilled" && mounted) {
          setProfile(pRes.value.data.user);
        }

        if (eRes.status === "fulfilled" && mounted) {
          setEvents(Array.isArray(eRes.value.data.events) ? eRes.value.data.events : []);
        } else if (mounted) {
          setEvents([
            {
              id: "e1",
              name: "Community Cleanup",
              date: "2025-10-21",
              location: "Houston, TX",
              requiredSkills: ["first aid", "organization"],
              status: "Open",
            },
            {
              id: "e2",
              name: "Food Drive",
              date: "2025-10-25",
              location: "Houston, TX",
              requiredSkills: ["logistics"],
              status: "Open",
            },
            {
              id: "e3",
              name: "Animal Shelter Help",
              date: "2025-11-02",
              location: "Katy, TX",
              requiredSkills: ["animal care", "organization"],
              status: "Open",
            },
          ]);
        }

        // Build joined set from notifications (type=assignment with meta.eventId)
        if (nRes.status === "fulfilled" && mounted) {
          const notifs = Array.isArray(nRes.value.data.notifications)
            ? nRes.value.data.notifications
            : [];
          const joinedSet = new Set(
            notifs
              .filter((n) => n.type === "assignment" && n.meta && n.meta.eventId)
              .map((n) => n.meta.eventId)
          );
          setJoinedIds(joinedSet);
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
  }, []);

  // decorate with score
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
      list.sort((a, b) => b._score - a._score || new Date(a.date) - new Date(b.date));
    }
    return list;
  }, [scored, filterMode, sortMode]);

  // ✅ Join with duplicate guard + UI update + sidebar refresh
  const handleJoin = async (ev) => {
    if (joinedIds.has(ev.id)) {
      alert("You’ve already requested to join this event.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/notifications", {
        userId,
        type: "assignment",
        title: `Requested to join: ${ev.name}`,
        message: `You requested to join "${ev.name}" on ${fmtDate(ev.date)} at ${ev.location}.`,
        meta: { eventId: ev.id },
      });
      // Add to joined set locally
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.add(ev.id);
        return next;
      });
      // Let Sidebar badge refresh if open:
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
      alert("Could not send request.");
    }
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
          <div className="d-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {view.map((ev) => {
              const isJoined = joinedIds.has(ev.id);
              return (
                <Card key={ev.id} className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <Card.Title className="mb-2">{ev.name}</Card.Title>
                      <div className="d-flex align-items-center gap-2">
                        {isJoined && <Badge bg="success">Joined</Badge>}
                        <Badge bg={ev._score >= 70 ? "success" : ev._score >= 50 ? "warning" : "secondary"}>
                          {ev._score}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-muted small mb-1">
                      {fmtDate(ev.date)} • {ev.location}
                    </div>

                    <div className="mb-2">
                      <strong>Required skills:</strong>{" "}
                      {Array.isArray(ev.requiredSkills) && ev.requiredSkills.length > 0
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
                        onClick={() => alert("Coming soon: event details modal.")}
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
    </>
  );
}
