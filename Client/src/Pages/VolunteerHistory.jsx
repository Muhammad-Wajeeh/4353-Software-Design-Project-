import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Sidebar from "./Sidebar";
import Form from "react-bootstrap/Form";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";

function VolunteerHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/history/getVolunteerHistory",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("Fetched history:", data);

      const events = data.history?.events || data.pastEvents || [];
      setHistory(events);
    } catch (err) {
      console.error("Failed to load volunteer history:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/history/updateAttendanceHistory",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("updated attendance", data);
    } catch (err) {
      console.error("failed to update attendance:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    updateAttendance();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Sidebar />
      {history.map((event) => (
        <Table hover variant="">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Event Date </th>
              <th>Organization</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{event.name}</td>
              <td>{(event.date || "").split("T")[0] || "No Date"}</td>
              <td>SASE</td>
            </tr>
          </tbody>
        </Table>
      ))}
    </>
  );
}

export default VolunteerHistory;
