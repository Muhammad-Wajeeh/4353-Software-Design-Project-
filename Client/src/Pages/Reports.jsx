// Client/src/Pages/Reports.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Spinner from "react-bootstrap/Spinner";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";

// PDF libs (client-side)
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
  const [myEventVolunteers, setMyEventVolunteers] = useState([]);
  const [myEventAssignments, setMyEventAssignments] = useState([]);
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
        } else if (activeTab === "my-assignments") {
          const res = await axios.get(
            `${API_BASE}/reports/my-events/${selectedMyEventId}/assignments`,
            { headers }
          );
          setMyEventAssignments(res.data.assignments || []);
        }
      } catch (err) {
        console.error("Failed to load per-event report", err);
        if (activeTab === "my-volunteers") {
          setMyEventVolunteers([]);
        } else if (activeTab === "my-assignments") {
          setMyEventAssignments([]);
        }
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

    return (
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

    return (
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
      return (
        <p className="text-muted">No volunteers for this event yet.</p>
      );
    }

    return (
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
                  {v.hours_this_event !== null && v.hours_this_event !== undefined
                    ? v.hours_this_event
                    : "—"}
                </td>
                <td className="text-end">
                  {v.status_this_event || "—"}
                </td>
                <td className="text-end">{v.total_events || 0}</td>
                <td className="text-end">{v.total_hours || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

    if (!myEventAssignments.length) {
      return (
        <p className="text-muted">No assignments yet for this event.</p>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Role</th>
              <th>Volunteer</th>
              <th>Username</th>
              <th>Email</th>
              <th className="text-end">Hours</th>
              <th className="text-end">Status</th>
            </tr>
          </thead>
          <tbody>
            {myEventAssignments.map((a, idx) => (
              <tr key={idx}>
                <td>{a.skill || "—"}</td>
                <td>{a.fullname || "—"}</td>
                <td>{a.username || "—"}</td>
                <td>{a.email || "—"}</td>
                <td className="text-end">
                  {a.hours !== null && a.hours !== undefined ? a.hours : "—"}
                </td>
                <td className="text-end">{a.status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
                setActiveTab(e.target.value);
                setSelectedMyEventId("");
                setMyEventVolunteers([]);
                setMyEventAssignments([]);
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
                onChange={(e) => setSelectedMyEventId(e.target.value)}
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
          event-specific reports, use the dropdown to select one of your
          created events and review volunteers and assignments directly in the
          dashboard.
        </p>
      </div>
    </>
  );
}
