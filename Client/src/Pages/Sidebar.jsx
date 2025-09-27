import React from "react";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Nav } from "react-bootstrap";
import Badge from "react-bootstrap/Badge";
import "./Sidebar.css"; // style the sidebar layout

function Sidebar() {
  const newMessages = 3; // replace with state from API or props
  const newEvents = 6;
  const newAssignments = 2;

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <h4 className="text-light">VolunteerHub</h4>
      </div>

      <Nav className="flex-column">
        <Nav.Link href="/eventmanagement">Event Management</Nav.Link>
        <Nav.Link href="/profilemanagement">Profile Management</Nav.Link>
        <Nav.Link href="/eventlist">
          Event List{" "}
          {newMessages > 0 && (
            <Badge bg="danger" pill className="ms-2">
              {newEvents}
            </Badge>
          )}
        </Nav.Link>
        <Nav.Link href="/inbox">
          Inbox{" "}
          {newMessages > 0 && (
            <Badge bg="danger" pill className="ms-2">
              {newMessages}
            </Badge>
          )}
        </Nav.Link>
        <Nav.Link href="/eventlist">
          Event List{" "}
          {newMessages > 0 && (
            <Badge bg="danger" pill className="ms-2">
              {newAssignments}
            </Badge>
          )}
        </Nav.Link>
        <Nav.Link href="/settings"> Settings</Nav.Link>
        <Nav.Link href="/logout"> Log Out</Nav.Link>
      </Nav>
    </div>
  );
}

export default Sidebar;
