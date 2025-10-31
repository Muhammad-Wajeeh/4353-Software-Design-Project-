import React, { useEffect, useMemo, useState } from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import Badge from "react-bootstrap/Badge";
import axios from "axios";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();

  // 🔒 remember user preference across reloads
  const initialCollapsed = useMemo(
    () => localStorage.getItem("vh_sidebar_collapsed") === "1",
    []
  );
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  // Example counts; keep your existing logic
  const [newEvents] = useState(6);
  const [newAssignments] = useState(2);

  // 🔔 unread notifications badge (real)
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const userId = "u1"; // TODO: replace when auth is wired

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/notifications/${userId}`,
          { params: { onlyUnread: true } }
        );
        setUnreadNotifs((data.notifications || []).length);
      } catch {
        setUnreadNotifs(0);
      }
    };

    fetchUnread();
    const handleRefresh = () => fetchUnread();
    window.addEventListener("notificationsUpdated", handleRefresh);
    return () => window.removeEventListener("notificationsUpdated", handleRefresh);
  }, [location.pathname]);

  // ←→ push the page content so it’s never covered
  useEffect(() => {
    document.body.style.setProperty(
      "--sidebar-space",
      collapsed ? "56px" : "220px"
    );
    localStorage.setItem("vh_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <>
    {/* Toggle always visible */}
    <button
      className="sidebar-toggle"
      aria-label={collapsed ? "Open menu" : "Close menu"}
      onClick={() => setCollapsed((v) => !v)}
    >
      {collapsed ? "☰" : "×"}
    </button>
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Toggle tab */}
      

      <div className="sidebar-top">
        <h4 className="brand">
          <span className="logo-dot" />
          <span className="label">VolunteerHub</span>
        </h4>
      </div>

      <Nav className="flex-column sidebar-nav">
        <Nav.Link as={Link} to="/eventmanagement" className="nav-item">
          <span className="label">Event Management</span>
        </Nav.Link>

        <Nav.Link as={Link} to="/profilemanagement" className="nav-item">
          <span className="label">Profile Management</span>
        </Nav.Link>

        <Nav.Link as={Link} to="/eventlist" className="nav-item">
          <span className="label">BrowseEvents</span>
          {newEvents > 0 && (
            <Badge bg="danger" pill className="ms-2 counter">
              {newEvents}
            </Badge>
          )}
        </Nav.Link>

        <Nav.Link as={Link} to="/inbox" className="nav-item">
          <span className="label">Inbox</span>
          {unreadNotifs > 0 && (
            <Badge bg="danger" pill className="ms-2 counter">
              {unreadNotifs}
            </Badge>
          )}
        </Nav.Link>

        <Nav.Link as={Link} to="/assignments" className="nav-item">
          <span className="label">Assignments</span>
          {newAssignments > 0 && (
            <Badge bg="danger" pill className="ms-2 counter">
              {newAssignments}
            </Badge>
          )}
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerMatching" className="nav-item">
          <span className="label">Volunteer Matching</span>
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerHistory" className="nav-item">
          <span className="label">Volunteer History</span>
        </Nav.Link>

        <Nav.Link as={Link} to="/settings" className="nav-item">
          <span className="label">Settings</span>
        </Nav.Link>

        <Nav.Link as={Link} to="/register" className="nav-item">
          <span className="label">Register</span>
        </Nav.Link>

        <Nav.Link as={Link} to="/login" className="nav-item">
          <span className="label">Login</span>
        </Nav.Link>

        <Nav.Link as={Link} to="/logout" className="nav-item">
          <span className="label">Log Out</span>
        </Nav.Link>
      </Nav>
    </aside>
    </>
  );
}

export default Sidebar;
