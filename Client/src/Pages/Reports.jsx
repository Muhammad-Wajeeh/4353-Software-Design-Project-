import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Spinner from "react-bootstrap/Spinner";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = "http://localhost:5000";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

// Nice display labels for skill codes
const ROLE_LABELS = {
  firstaid: "First Aid",
  foodservice: "Food Service",
  logistics: "Logistics",
  eventsetup: "Event Setup",
  teaching: "Teaching",
  dataentry: "Data Entry",
  customerservice: "Customer Service",
};

const ROLE_CATEGORIES = {
  "Physical roles": ["firstaid", "foodservice", "logistics", "eventsetup"],
  "Educational / admin roles": ["teaching", "dataentry", "customerservice"],
};

const skillLabel = (skill) => ROLE_LABELS[skill] || skill || "—";

export default function Reports() {
  // "volunteers" | "events" | "my-volunteers" | "my-assignments"
  const [activeTab, setActiveTab] = useState("volunteers");

  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);

  const [loadingVolunteers, setLoadingVolunteers] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // "My events" and per-event data
  const [myEvents, setMyEvents] = useState([]);
  const [loadingMyEvents, setLoadingMyEvents] = useState(false);
  const [selectedMyEventId, setSelectedMyEventId] = useState("");
  const [selectedEventMeta, setSelectedEventMeta] = useState(null);

  const [myEventVolunteers, setMyEventVolunteers] = useState([]);
  const [myEventAssignments, setMyEventAssignments] = useState([]);
  const [myRolesSummary, setMyRolesSummary] = useState([]);
  const [loadingMyDetail, setLoadingMyDetail] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Initial load: global reports + list of "my events"
  useEffect(() => {
    if (!token) {
      setLoadingVolunteers(false);
      setLoadingEvents(false);
      setLoadingMyEvents(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        // volunteers report (global)
        const vRes = await axios.get(`${API_BASE}/reports/volunteers`, {
          headers,
        });
        setVolunteers(
          Array.isArray(vRes.data.volunteers) ? vRes.data.volunteers : []
        );
      } catch (err) {
        console.error("Failed to load volunteer report", err);
      } finally {
        setLoadingVolunteers(false);
      }

      try {
        // events report (global)
        const eRes = await axios.get(`${API_BASE}/reports/events`, {
          headers,
        });
        setEvents(Array.isArray(eRes.data.events) ? eRes.data.events : []);
      } catch (err) {
        console.error("Failed to load event report", err);
      } finally {
        setLoadingEvents(false);
      }

      try {
        setLoadingMyEvents(true);
        const myRes = await axios.get(`${API_BASE}/reports/my-events`, {
          headers,
        });
        setMyEvents(Array.isArray(myRes.data.events) ? myRes.data.events : []);
      } catch (err) {
        console.error("Failed to load my events list", err);
        setMyEvents([]);
      } finally {
        setLoadingMyEvents(false);
      }
    })();
  }, [token]);

  // Load per-event data when user selects one of their events
  useEffect(() => {
    if (!token || !selectedMyEventId) return;
    const headers = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        setLoadingMyDetail(true);

        if (activeTab === "my-volunteers") {
          const res = await axios.get(
            `${API_BASE}/reports/my-events/${selectedMyEventId}/volunteers`,
            { headers }
          );
          setMyEventVolunteers(res.data.volunteers || []);
          setSelectedEventMeta(res.data.event || null);
        } else if (activeTab === "my-assignments") {
          const res = await axios.get(
            `${API_BASE}/reports/my-events/${selectedMyEventId}/assignments`,
            { headers }
          );
          setMyEventAssignments(res.data.assignments || []);
          setMyRolesSummary(res.data.rolesSummary || []);
          setSelectedEventMeta(res.data.event || null);
        }
      } catch (err) {
        console.error("Failed to load per-event report", err);
        if (activeTab === "my-volunteers") {
          setMyEventVolunteers([]);
        } else if (activeTab === "my-assignments") {
          setMyEventAssignments([]);
          setMyRolesSummary([]);
        }
        setSelectedEventMeta(null);
      } finally {
        setLoadingMyDetail(false);
      }
    })();
  }, [activeTab, selectedMyEventId, token]);

  const downloadCsv = async (kind) => {
    if (!token) {
      alert("You must be logged in to download reports.");
      return;
    }

    if (kind !== "volunteers" && kind !== "events") {
      alert("CSV export is currently available only for global reports.");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const url =
      kind === "volunteers"
        ? `${API_BASE}/reports/volunteers.csv`
        : `${API_BASE}/reports/events.csv`;

    try {
      const res = await axios.get(url, {
        headers,
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download =
        kind === "volunteers"
          ? "volunteers_report.csv"
          : "events_report.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download CSV", err);
      alert("Could not download CSV report.");
    }
  };

  // -------- PDF generation (client-side, global only for now) --------
  const downloadPdf = () => {
    if (activeTab !== "volunteers" && activeTab !== "events") {
      alert("PDF export is currently available only for global reports.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const marginLeft = 40;
    let title = "";
    let head = [];
    let body = [];

    if (activeTab === "volunteers") {
      title = "Volunteer Participation Report";
      head = [["ID", "Volunteer", "Username", "Email", "Events attended"]];
      body = volunteers.map((v) => [
        v.id,
        v.fullname || "—",
        v.username || "—",
        v.email || "—",
        v.events_attended || 0,
      ]);
    } else {
      title = "Event Assignments Report";
      head = [["ID", "Event", "Date", "Location", "Description", "Volunteers"]];
      body = events.map((e) => [
        e.id,
        e.name || "—",
        fmtDate(e.date),
        e.location || "—",
        (e.description || "").slice(0, 60),
        e.volunteers_assigned || 0,
      ]);
    }

    doc.setFontSize(16);
    doc.text(title, marginLeft, 40);

    autoTable(doc, {
      startY: 60,
      head,
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    const filename =
      activeTab === "volunteers"
        ? "volunteers_report.pdf"
        : "events_report.pdf";
    doc.save(filename);
  };

  // ----------------- GLOBAL TABLES -----------------

  const renderVolunteerTable = () => {
    if (loadingVolunteers) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      );
    }

    if (!volunteers.length) {
      return <p className="text-muted">No volunteer data found.</p>;
    }

    const totalVols = volunteers.length;
    const totalEvents = volunteers.reduce(
      (sum, v) => sum + (Number(v.events_attended) || 0),
      0
    );

    return (
      <>
        <div className="d-flex flex-wrap gap-3 mb-3">
          <div className="border rounded px-3 py-2 small bg-light">
            <div className="text-uppercase text-muted" style={{ fontSize: 11 }}>
              Total volunteers
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{totalVols}</div>
          </div>
          <div className="border rounded px-3 py-2 small bg-light">
            <div className="text-uppercase text-muted" style={{ fontSize: 11 }}>
              Total event sign-ups
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{totalEvents}</div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Volunteer</th>
                <th>Username</th>
                <th>Email</th>
                <th className="text-end">Events attended</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.fullname || "—"}</td>
                  <td>{v.username || "—"}</td>
                  <td>{v.email || "—"}</td>
                  <td className="text-end">{v.events_attended || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderEventTable = () => {
    if (loadingEvents) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      );
    }

    if (!events.length) {
      return <p className="text-muted">No event data found.</p>;
    }

    const totalEvents = events.length;
    const totalAssignments = events.reduce(
      (sum, e) => sum + (Number(e.volunteers_assigned) || 0),
      0
    );

    return (
      <>
        <div className="d-flex flex-wrap gap-3 mb-3">
          <div className="border rounded px-3 py-2 small bg-light">
            <div className="text-uppercase text-muted" style={{ fontSize: 11 }}>
              Total events
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{totalEvents}</div>
          </div>
          <div className="border rounded px-3 py-2 small bg-light">
            <div className="text-uppercase text-muted" style={{ fontSize: 11 }}>
              Total volunteer assignments
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {totalAssignments}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Date</th>
                <th>Location</th>
                <th>Description</th>
                <th className="text-end">Volunteers assigned</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.name}</td>
                  <td>{fmtDate(e.date)}</td>
                  <td>{e.location}</td>
                  <td>{e.description}</td>
                  <td className="text-end">{e.volunteers_assigned || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // ----------------- PER-EVENT DASHBOARD VIEWS -----------------

  const renderSelectedEventHeader = () => {
    if (!selectedMyEventId) {
      return null;
    }
    if (!selectedEventMeta) {
      return (
        <p className="text-muted mb-3">Loading event details…</p>
      );
    }

    return (
      <div className="mb-3">
        <div
          className="d-flex flex-wrap justify-content-between align-items-center"
          style={{ gap: "0.75rem" }}
        >
          <div>
            <div
              className="text-uppercase text-muted"
              style={{ fontSize: 11 }}
            >
              Selected event
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {selectedEventMeta.name}
            </div>
            <div style={{ fontSize: 13 }}>
              {fmtDate(selectedEventMeta.date)}
              {selectedEventMeta.location
                ? ` • ${selectedEventMeta.location}`
                : ""}
            </div>
          </div>
          {selectedEventMeta.description && (
            <div
              className="small text-muted"
              style={{ maxWidth: 360, fontSize: 12 }}
            >
              {selectedEventMeta.description}
            </div>
          )}
        </div>
        <hr className="mt-2 mb-3" />
      </div>
    );
  };

  const renderMyVolunteersTable = () => {
    if (!selectedMyEventId) {
      return <p className="text-muted">Choose one of your events above.</p>;
    }

    if (loadingMyDetail) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      );
    }

    if (!myEventVolunteers.length) {
      return <p className="text-muted">No volunteers for this event yet.</p>;
    }

    const totalVols = myEventVolunteers.length;
    const totalHours = myEventVolunteers.reduce(
      (sum, v) => sum + (Number(v.hours_this_event) || 0),
      0
    );
    const avgHours =
      totalVols > 0 ? (totalHours / totalVols).toFixed(1) : "0.0";

    return (
      <>
        {renderSelectedEventHeader()}

        <div className="d-flex flex-wrap gap-3 mb-3">
          <div className="border rounded px-3 py-2 small bg-light">
            <div className="text-uppercase text-muted" style={{ fontSize: 11 }}>
              Volunteers for this event
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{totalVols}</div>
          </div>
          <div className="border rounded px-3 py-2 small bg-light">
            <div className="text-uppercase text-muted" style={{ fontSize: 11 }}>
              Total hours volunteered (this event)
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{totalHours}</div>
          </div>
          <div className="border rounded px-3 py-2 small bg-light">
            <div className="text-uppercase text-muted" style={{ fontSize: 11 }}>
              Avg hours per volunteer
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{avgHours}</div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>Username</th>
                <th>Email</th>
                <th className="text-end">This event: hours</th>
                <th className="text-end">This event: status</th>
                <th className="text-end">Total events</th>
                <th className="text-end">Total hours</th>
              </tr>
            </thead>
            <tbody>
              {myEventVolunteers.map((v) => (
                <tr key={v.id}>
                  <td>{v.fullname || "—"}</td>
                  <td>{v.username || "—"}</td>
                  <td>{v.email || "—"}</td>
                  <td className="text-end">
                    {v.hours_this_event !== null &&
                    v.hours_this_event !== undefined
                      ? v.hours_this_event
                      : "—"}
                  </td>
                  <td className="text-end">{v.status_this_event || "—"}</td>
                  <td className="text-end">{v.total_events || 0}</td>
                  <td className="text-end">{v.total_hours || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderMyAssignmentsTable = () => {
    if (!selectedMyEventId) {
      return <p className="text-muted">Choose one of your events above.</p>;
    }

    if (loadingMyDetail) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      );
    }

    if (!myEventAssignments.length && !myRolesSummary.length) {
      return <p className="text-muted">No assignments yet for this event.</p>;
    }

    // Build a quick lookup from label ("First Aid") to summary stats
    const summaryByLabel = {};
    myRolesSummary.forEach((r) => {
      summaryByLabel[r.role] = r;
    });

    return (
      <>
        {renderSelectedEventHeader()}

        {Object.entries(ROLE_CATEGORIES).map(
          ([categoryName, skillsForCategory]) => {
            // Build role "cards" for this category
            const rolesForCategory = skillsForCategory
              .map((skill) => {
                const label = skillLabel(skill);
                const summary = summaryByLabel[label] || {
                  total: 0,
                  filled: 0,
                  remaining: 0,
                };
                const volunteers = myEventAssignments.filter(
                  (a) => a.skill === skill
                );
                // If nothing configured and no volunteers, skip this card
                if (
                  !volunteers.length &&
                  !summary.total &&
                  !summary.filled &&
                  !summary.remaining
                ) {
                  return null;
                }
                return { skill, label, summary, volunteers };
              })
              .filter(Boolean);

            if (!rolesForCategory.length) {
              return null;
            }

            return (
              <div key={categoryName} className="mb-4">
                <div
                  className="text-uppercase text-muted mb-2"
                  style={{ fontSize: 11 }}
                >
                  {categoryName}
                </div>
                <div className="row g-3">
                  {rolesForCategory.map(({ skill, label, summary, volunteers }) => (
                    <div key={skill} className="col-12 col-md-6 col-lg-4">
                      <div className="border rounded h-100 p-3 d-flex flex-column">
                        <div className="d-flex justify-content-between mb-1">
                          <div style={{ fontWeight: 600 }}>{label}</div>
                          <div className="small text-muted">
                            {summary.filled}/{summary.total || 0} filled
                          </div>
                        </div>
                        <div
                          className="small text-muted mb-2"
                          style={{ fontSize: 11 }}
                        >
                          {summary.remaining > 0
                            ? `${summary.remaining} spots remaining`
                            : summary.total
                            ? "Fully filled"
                            : "No positions configured"}
                        </div>

                        {volunteers.length ? (
                          <ul className="list-unstyled mb-0 small">
                            {volunteers.map((v, idx) => (
                              <li
                                key={idx}
                                className="d-flex justify-content-between"
                                style={{ fontSize: 12 }}
                              >
                                <span>
                                  {v.fullname || "—"}{" "}
                                  <span className="text-muted">
                                    ({v.username || "—"})
                                  </span>
                                </span>
                                <span className="text-end">
                                  {v.hours != null ? `${v.hours}h` : ""}{" "}
                                  <span className="text-muted">
                                    {v.status ? `· ${v.status}` : ""}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div
                            className="small text-muted"
                            style={{ fontSize: 12 }}
                          >
                            No volunteers assigned yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        )}
      </>
    );
  };

  const renderBody = () => {
    if (activeTab === "volunteers") return renderVolunteerTable();
    if (activeTab === "events") return renderEventTable();
    if (activeTab === "my-volunteers") return renderMyVolunteersTable();
    if (activeTab === "my-assignments") return renderMyAssignmentsTable();
    return null;
  };

  const isGlobalTab = activeTab === "volunteers" || activeTab === "events";

  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 1100 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Reports</h2>
          <Form className="d-flex gap-2 align-items-center">
            <Form.Select
              size="sm"
              value={activeTab}
              onChange={(e) => {
                const next = e.target.value;
                setActiveTab(next);
                setSelectedMyEventId("");
                setSelectedEventMeta(null);
                setMyEventVolunteers([]);
                setMyEventAssignments([]);
                setMyRolesSummary([]);
              }}
              style={{ width: 260 }}
            >
              <option value="volunteers">
                Volunteer participation (all volunteers)
              </option>
              <option value="events">
                Event assignments (all events)
              </option>
              <option value="my-volunteers">
                My events – volunteers + history
              </option>
              <option value="my-assignments">
                My events – assignments by position
              </option>
            </Form.Select>

            {(activeTab === "my-volunteers" ||
              activeTab === "my-assignments") && (
              <Form.Select
                size="sm"
                value={selectedMyEventId}
                onChange={(e) => {
                  setSelectedMyEventId(e.target.value);
                  setSelectedEventMeta(null);
                  setMyEventVolunteers([]);
                  setMyEventAssignments([]);
                  setMyRolesSummary([]);
                }}
                style={{ width: 260 }}
                disabled={loadingMyEvents}
              >
                <option value="">
                  {loadingMyEvents
                    ? "Loading your events..."
                    : "Select one of your events…"}
                </option>
                {myEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {fmtDate(ev.date)} – {ev.name}
                  </option>
                ))}
              </Form.Select>
            )}

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => downloadCsv(activeTab)}
              disabled={!isGlobalTab}
            >
              Download CSV
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={downloadPdf}
              disabled={!isGlobalTab}
            >
              Download PDF
            </Button>
          </Form>
        </div>

        <Card className="shadow-sm">
          <Card.Body>{renderBody()}</Card.Body>
        </Card>

        <p className="text-muted small mt-3">
          CSV and PDF exports are available for the global reports. For your
          event-specific reports, use the dropdown to select one of your created
          events and review volunteers and assignments directly in the
          dashboard-style view.
        </p>
      </div>
    </>
  );
}
