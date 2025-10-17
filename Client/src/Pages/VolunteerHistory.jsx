import React, { useEffect, useState } from "react";
import axios from "axios";
import Table from "react-bootstrap/Table";
import Sidebar from "./Sidebar";
import Form from "react-bootstrap/Form";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";

function VolunteerHistory() {
  const userId = "u1"; // mock user id (swap when you wire auth)
  const [history, setHistory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Newest");

  // Fetch volunteer history from backend
  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data } = await axios.get(`http://localhost:5000/history/${userId}`);
        setHistory(data.history.events || []);
        setFiltered(data.history.events || []);
      } catch (err) {
        console.error("Failed to load volunteer history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // Filter + sort logic
  useEffect(() => {
    let result = [...history];

    if (statusFilter !== "All") {
      result = result.filter((ev) => ev.status === statusFilter);
    }

    if (sortOption === "Newest") {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === "Oldest") {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === "Hours ↑") {
      result.sort((a, b) => a.hours - b.hours);
    } else if (sortOption === "Hours ↓") {
      result.sort((a, b) => b.hours - a.hours);
    }

    setFiltered(result);
  }, [statusFilter, sortOption, history]);

  // Total hours of currently visible events
  const totalHours = filtered.reduce((sum, ev) => sum + (ev.hours || 0), 0);

  // Dynamic label + color for the summary box
  const labelText =
    statusFilter === "Completed"
      ? "Completed Hours Volunteered:"
      : statusFilter === "Upcoming"
      ? "Upcoming Hours:"
      : statusFilter === "Cancelled"
      ? "Cancelled Hours:"
      : "Total Hours Volunteered:";

  const labelColor =
    statusFilter === "Completed"
      ? "success"
      : statusFilter === "Upcoming"
      ? "warning"
      : statusFilter === "Cancelled"
      ? "danger"
      : "primary";

  // -------- CSV export of currently filtered rows --------
  const downloadCSV = () => {
    // helper to safely escape fields with quotes/commas/newlines
    const esc = (s) =>
      `"${String(s ?? "").replaceAll('"', '""')}"`;

    const headers = ["Event Name", "Organization", "Date", "Hours", "Status"];
    const rows = filtered.map((ev) => [
      ev.eventName,
      ev.organization,
      ev.date,
      ev.hours,
      ev.status,
    ]);

    const csv =
      [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");

    // BOM helps Excel open UTF-8 correctly
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    a.href = url;
    a.download = `volunteer_history_${userId}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 900 }}>
        <h2 className="text-center mb-3">Volunteer History</h2>

        {/* Filters / Sorting / CSV */}
        <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3">
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 200 }}
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Cancelled">Cancelled</option>
          </Form.Select>

          <ButtonGroup>
            {["Newest", "Oldest", "Hours ↑", "Hours ↓"].map((opt) => (
              <Button
                key={opt}
                variant={sortOption === opt ? "primary" : "outline-primary"}
                onClick={() => setSortOption(opt)}
              >
                {opt}
              </Button>
            ))}
          </ButtonGroup>

          <Button variant="outline-secondary" onClick={downloadCSV}>
            Download CSV
          </Button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <p className="text-center">No volunteer history found.</p>
        ) : (
          <>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Organization</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev, index) => (
                  <tr key={index}>
                    <td>
                      <Link to={`/history/event/${ev.eventId}`}>{ev.eventName}</Link>
                    </td>
                    <td>{ev.organization}</td>
                    <td>{ev.date}</td>
                    <td>{ev.hours}</td>
                    <td>{ev.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Dynamic Total Hours Summary */}
            <div className="d-flex justify-content-center mt-3">
              <div
                className={`px-4 py-2 border rounded-3 shadow-sm text-center border-${labelColor} bg-${labelColor}-subtle`}
                style={{ maxWidth: "350px", borderWidth: "2px" }}
              >
                <span className="fw-semibold me-2">{labelText}</span>
                <span className={`fw-bold text-${labelColor} fs-5`}>
                  {totalHours}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default VolunteerHistory;
