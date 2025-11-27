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
  const [activeTab, setActiveTab] = useState("volunteers"); // "volunteers" | "events"
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      setLoadingVolunteers(false);
      setLoadingEvents(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    (async () => {
      try {
        // volunteers report
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
        // events report
        const eRes = await axios.get(`${API_BASE}/reports/events`, {
          headers,
        });
        setEvents(Array.isArray(eRes.data.events) ? eRes.data.events : []);
      } catch (err) {
        console.error("Failed to load event report", err);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [token]);

  const downloadCsv = async (kind) => {
    if (!token) {
      alert("You must be logged in to download reports.");
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

  // -------- PDF generation (client-side) --------
  const downloadPdf = () => {
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

    // use autoTable helper function instead of doc.autoTable
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

  const renderBody = () =>
    activeTab === "volunteers" ? renderVolunteerTable() : renderEventTable();

  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 1100 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Reports</h2>
          <Form className="d-flex gap-2">
            <Form.Select
              size="sm"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              style={{ width: 220 }}
            >
              <option value="volunteers">Volunteer participation</option>
              <option value="events">Event assignments</option>
            </Form.Select>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => downloadCsv(activeTab)}
            >
              Download CSV
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={downloadPdf}
            >
              Download PDF
            </Button>
          </Form>
        </div>

        <Card className="shadow-sm">
          <Card.Body>{renderBody()}</Card.Body>
        </Card>

        <p className="text-muted small mt-3">
          CSV reports can be opened in Excel, Google Sheets, or imported into
          other tools. PDF reports are generated in your browser and can be
          saved or printed.
        </p>
      </div>
    </>
  );
}
