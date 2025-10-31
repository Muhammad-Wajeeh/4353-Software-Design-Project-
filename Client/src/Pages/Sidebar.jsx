import React, { useEffect, useMemo, useState } from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import Badge from "react-bootstrap/Badge";
import axios from "axios";
import "./Sidebar.css";

/* inline SVG icons (no external deps) */
const Icon = {
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2
      2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10Z"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="m21 20-4.2-4.2a7.5 7.5 0 1 0-1.4 1.4L20 21l1-1ZM5.5 11a5.5
      5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0Z"/>
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2
      2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5l8-5v2Z"/>
    </svg>
  ),
  CheckList: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M3 5h12v2H3V5Zm0 6h12v2H3v-2Zm0 6h12v2H3v-2Zm16-9
      l-1.5-1.5l-1.4 1.4L19 11l4.3-4.3l-1.4-1.4L19 9Z"/>
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M16 11a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm-8 1a4 4 0 1 0-4-4a4
      4 0 0 0 4 4Zm0 2c-3.3 0-6 1.7-6 4v2h8v-2c0-1.4.7-2.6 1.8-3.4A8 8 0 0 0 8 14Zm8 0c-3.3 0-6
      1.7-6 4v2h12v-2c0-2.3-2.7-4-6-4Z"/>
    </svg>
  ),
  Gear: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8Zm10 4a8 8 0 0 0-.2-1.8l2-1.6l-2-3.4l-2.5
      1a8 8 0 0 0-3.1-1.8l-.4-2.6H8.2l-.4 2.6a8 8 0 0 0-3.1 1.8l-2.5-1l-2 3.4l2 1.6A8 8 0 0 0 2 12c0 .6.1 1.2.2 1.8l-2
      1.6l2 3.4l2.5-1a8 8 0 0 0 3.1 1.8l.4 2.6h7.6l.4-2.6a8 8 0 0 0 3.1-1.8l2.5 1l2-3.4l-2-1.6c.1-.6.2-1.2.2-1.8Z"/>
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M17 8V7a5 5 0 1 0-10 0v1H5v14h14V8h-2ZM9 7a3 3 0 1 1 6 0v1H9V7Z"/>
    </svg>
  ),
  Door: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M4 3h12v18H4V3Zm10 10a1 1 0 1 0 0-2a1 1 0 0 0 0 2Zm4 8h2V3h-2v18Z"/>
    </svg>
  ),
  History: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M13 3a9 9 0 0 0-9 9H2l3.9 3.9L9.8 12H6a7 7 0 1 1 7 7 7 7 0 0 1-7-7H4a9 9 0 1 0 9-9Zm-1 4v5l4.2 2.5l.8-1.2l-3.5-2.1V7H12Z"/>
    </svg>
  ),
};

function Sidebar() {
  const location = useLocation();

  const initialCollapsed = useMemo(
    () => localStorage.getItem("vh_sidebar_collapsed") === "1",
    []
  );
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const userId = "u1"; // TODO: hook to auth

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
  }, [location.pathname]);

  // keep main content from being covered
  useEffect(() => {
    document.body.style.setProperty("--sidebar-space", collapsed ? "72px" : "232px");
    localStorage.setItem("vh_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <div className="brand">VolunteerHub</div>}
        <button
          className="collapse-btn"
          aria-label={collapsed ? "Open menu" : "Close menu"}
          title={collapsed ? "Open menu" : "Close menu"}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? "☰" : "×"}
        </button>
      </div>

      <Nav className="flex-column sidebar-nav">
        <Nav.Link as={Link} to="/eventmanagement" className="nav-item" data-label="Event Management">
          <span className="icon"><Icon.Calendar /></span>
          <span className="label-wrap"><span className="label">Event Management</span></span>
        </Nav.Link>

        <Nav.Link as={Link} to="/BrowseEvents" className="nav-item" data-label="Browse Events">
          <span className="icon"><Icon.Search /></span>
          <span className="label-wrap"><span className="label">Browse Events</span></span>
        </Nav.Link>

        <Nav.Link as={Link} to="/inbox" className="nav-item" data-label="Inbox">
          <span className="icon"><Icon.Mail /></span>
          <span className="label-wrap"><span className="label">Inbox</span></span>
          {unreadNotifs > 0 && (
            <Badge bg="danger" pill className="ms-auto counter">{unreadNotifs}</Badge>
          )}
        </Nav.Link>

        <Nav.Link as={Link} to="/eventlist" className="nav-item" data-label="Assignments">
          <span className="icon"><Icon.CheckList /></span>
          <span className="label-wrap"><span className="label">Assignments</span></span>
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerMatching" className="nav-item" data-label="Volunteer Matching">
          <span className="icon"><Icon.Users /></span>
          <span className="label-wrap"><span className="label">Volunteer Matching</span></span>
        </Nav.Link>

        <Nav.Link as={Link} to="/VolunteerHistory" className="nav-item" data-label="Volunteer History">
          <span className="icon"><Icon.History /></span>
          <span className="label-wrap"><span className="label">Volunteer History</span></span>
        </Nav.Link>

        <Nav.Link as={Link} to="/settings" className="nav-item" data-label="Settings">
          <span className="icon"><Icon.Gear /></span>
          <span className="label-wrap"><span className="label">Settings</span></span>
        </Nav.Link>

        <Nav.Link as={Link} to="/login" className="nav-item" data-label="Login">
          <span className="icon"><Icon.Lock /></span>
          <span className="label-wrap"><span className="label">Login</span></span>
        </Nav.Link>

        <Nav.Link as={Link} to="/logout" className="nav-item" data-label="Log Out">
          <span className="icon"><Icon.Door /></span>
          <span className="label-wrap"><span className="label">Log Out</span></span>
        </Nav.Link>
      </Nav>
    </aside>
  );
}

export default Sidebar;
