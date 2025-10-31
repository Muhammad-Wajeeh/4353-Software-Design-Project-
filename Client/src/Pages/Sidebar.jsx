import React, { useEffect, useState } from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import Badge from "react-bootstrap/Badge";
import axios from "axios";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const userId = "u1";

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

    const handleRefresh = () => fetchUnread();
    window.addEventListener("notificationsUpdated", handleRefresh);
    return () => {
      window.removeEventListener("notificationsUpdated", handleRefresh);
    };
  }, [location.pathname]);

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* 🔹 Toggle Button */}
      <button
        className="collapse-btn"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? "☰" : "✕"}
      </button>

      {/* 🔹 Logo / Title */}
      {!collapsed && (
        <div className="sidebar-top">
          <h4 className="text-light">VolunteerHub</h4>
        </div>
      )}

      {/* 🔹 Navigation */}
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/eventmanagement">
          {collapsed ? "📅" : "Event Management"}
        </Nav.Link>

        <Nav.Link as={Link} to="/profilemanagement">
          {collapsed ? "👤" : "Profile Management"}
        </Nav.Link>

        <Nav.Link as={Link} to="/BrowseEvents">
          {collapsed ? "🔍" : "Browse Events"}
        </Nav.Link>

        <Nav.Link as={Link} to="/inbox">
          {collapsed ? "📨" : "Inbox"}{" "}
          {!collapsed && unreadNotifs > 0 && (
            <Badge bg="danger" pill className="ms-2">
              {unreadNotifs}
            </Badge>
          )}
        </Nav.Link>

        <Nav.Link as={Link} to="/eventlist">
          {collapsed ? "📋" : "Assignments"}
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerMatching">
          {collapsed ? "🤝" : "Volunteer Matching"}
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerHistory">
          {collapsed ? "📜" : "Volunteer History"}
        </Nav.Link>

        <Nav.Link as={Link} to="/settings">
          {collapsed ? "⚙️" : "Settings"}
        </Nav.Link>

        <Nav.Link as={Link} to="/register">
          {collapsed ? "📝" : "Register"}
        </Nav.Link>

        <Nav.Link as={Link} to="/login">
          {collapsed ? "🔑" : "Login"}
        </Nav.Link>

        <Nav.Link as={Link} to="/logout">
          {collapsed ? "🚪" : "Log Out"}
        </Nav.Link>
      </Nav>
    </div>
  );
}

export default Sidebar;
