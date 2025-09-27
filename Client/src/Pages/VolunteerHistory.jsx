import React from "react";
import { useState } from "react";
import Table from "react-bootstrap/Table";
import Sidebar from "./Sidebar";

function VolunteerHistory() {
  const users = ["Alice", "Bob", "Charlie", "Diana"];
  const events = ["Event 1", "Event 2", "Event 3", "Event 4", "Event 5"];

  // Example attendance data (true = present, false = absent)
  const attendance = {
    Alice: [true, false, true, true, false],
    Bob: [true, true, false, true, true],
    Charlie: [false, true, true, false, true],
    Diana: [true, true, true, true, true],
  };

  return (
    <>
      <Sidebar></Sidebar>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>User</th>
            {events.map((event, index) => (
              <th key={index}>{event}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user}>
              <td>{user}</td>
              {attendance[user].map((present, i) => (
                <td key={i} style={{ textAlign: "center" }}>
                  {present ? "✔️" : "❌"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default VolunteerHistory;
