import React, { useEffect, useState } from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import Badge from "react-bootstrap/Badge";
import axios from "axios";
import "./Sidebar.css"; // style the sidebar layout

function Sidebar() {
  const location = useLocation();

  // TODO: wire these later if you add APIs for events/assignments
  const [newEvents] = useState(6);
  const [newAssignments] = useState(2);

  // 🔔 real unread notifications count
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const userId = "u1"; // swap when auth is wired

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/notifications/${userId}`,
          { params: { onlyUnread: true } }
        );
        setUnreadNotifs((data.notifications || []).length);
      } catch (_) {
        setUnreadNotifs(0);
      }
    };

    fetchUnread();

    // 🔔 listen for update events from Inbox
    const handleRefresh = () => fetchUnread();
    window.addEventListener("notificationsUpdated", handleRefresh);

    // Cleanup
    return () => {
      window.removeEventListener("notificationsUpdated", handleRefresh);
    };
  }, [location.pathname]);

  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <h4 className="text-light">VolunteerHub</h4>
      </div>

      <Nav className="flex-column">
        <Nav.Link as={Link} to="/eventmanagement">
          Event Management
        </Nav.Link>

        <Nav.Link as={Link} to="/profilemanagement">
          Profile Management
        </Nav.Link>

        <Nav.Link as={Link} to="/BrowseEvents">
          BrowseEvents
        </Nav.Link>

        <Nav.Link as={Link} to="/inbox">
          Inbox{" "}
          {unreadNotifs > 0 && (
            <Badge bg="danger" pill className="ms-2">
              {unreadNotifs}
            </Badge>
          )}
        </Nav.Link>

        <Nav.Link as={Link} to="/eventlist">
          Assignments{" "}
          {newAssignments > 0 && (
            <Badge bg="danger" pill className="ms-2">
              {newAssignments}
            </Badge>
          )}
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerMatching">
          Volunteer Matching
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerHistory">
          Volunteer History
        </Nav.Link>

        <Nav.Link as={Link} to="/settings">
          Settings
        </Nav.Link>

        <Nav.Link as={Link} to="/register">
          Register
        </Nav.Link>
        <Nav.Link as={Link} to="/login">
          Login
        </Nav.Link>
        <Nav.Link as={Link} to="/logout">
          Log Out
        </Nav.Link>
      </Nav>
    </div>
  );
}

export default Sidebar;
