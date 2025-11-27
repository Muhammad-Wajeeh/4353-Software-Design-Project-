import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Badge from "react-bootstrap/Badge";
import axios from "axios";
import "./Sidebar.css";

/* Inline SVG icons */
const Icon = {
  Home: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path fill="currentColor" d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3Z" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10Z"
      />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="m21 20-4.2-4.2a7.5 7.5 0 1 0-1.4 1.4L20 21l1-1ZM5.5 11a5.5 5.5 0 1 1 11 0a5.5 5.5 0 0 1-11 0Z"
      />
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5l8-5v2Z"
      />
    </svg>
  ),
  CheckList: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M3 5h12v2H3V5Zm0 6h12v2H3v-2Zm0 6h12v2H3v-2Zm16-9l-1.5-1.5l-1.4 1.4L19 11l4.3-4.3l-1.4-1.4L19 9Z"
      />
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M16 11a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm-8 1a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.7-6 4v2h8v-2c0-1.4.7-2.6 1.8-3.4A8 8 0 0 0 8 14Zm8 0c-3.3 0-6 1.7-6 4v2h12v-2c0-2.3-2.7-4-6-4Z"
      />
    </svg>
  ),
  Gear: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8Zm10 4a8 8 0 0 0-.2-1.8l2-1.6l-2-3.4l-2.5 1a8 8 0 0 0-3.1-1.8l-.4-2.6H8.2l-.4 2.6a8 8 0 0 0-3.1 1.8l-2.5-1l-2 3.4l2 1.6A8 8 0 0 0 2 12c0 .6.1 1.2.2 1.8l-2 1.6l2 3.4l2.5-1a8 8 0 0 0 3.1 1.8l.4 2.6h7.6l.4-2.6a8 8 0 0 0 3.1-1.8l2.5 1l2-3.4l-2-1.6c.1-.6.2-1.2.2-1.8Z"
      />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M17 8V7a5 5 0 1 0-10 0v1H5v14h14V8h-2ZM9 7a3 3 0 1 1 6 0v1H9V7Z"
      />
    </svg>
  ),
  Door: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M4 3h12v18H4V3Zm10 10a1 1 0 1 0 0-2a1 1 0 0 0 0 2Zm4 8h2V3h-2v18Z"
      />
    </svg>
  ),
  History: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        fill="currentColor"
        d="M13 3a9 9 0 0 0-9 9H2l3.9 3.9L9.8 12H6a7 7 0 1 1 7 7 7 7 0 0 1-7-7H4a9 9 0 1 0 9-9Zm-1 4v5l4.2 2.5l.8-1.2l-3.5-2.1V7H12Z"
      />
    </svg>
  ),
};

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
}

export default function Sidebar() {
  const location = useLocation();

  const initialCollapsed = useMemo(
    () => localStorage.getItem("vh_sidebar_collapsed") === "1",
    []
  );
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Hover card state (label + top position)
  const [hoverCard, setHoverCard] = useState({ label: null, top: 0 });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authed = isTokenValid(token);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (!authed) return setUnreadNotifs(0);
        const { data } = await axios.get(
          "http://localhost:5000/notifications/getAllForThisUser",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { onlyUnread: true },
          }
        );
        setUnreadNotifs((data.notifications || []).length);
      } catch {
        setUnreadNotifs(0);
      }
    };
    fetchUnread();

    const handleRefresh = () => fetchUnread();
    window.addEventListener("notificationsUpdated", handleRefresh);
    return () =>
      window.removeEventListener("notificationsUpdated", handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, authed, token]);

  useEffect(() => {
    document.body.style.setProperty(
      "--sidebar-space",
      collapsed ? "72px" : "232px"
    );
    localStorage.setItem("vh_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const onEnter = (e, label) => {
    if (!collapsed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setHoverCard({ label, top: Math.round(r.top + r.height / 2) });
  };
  const onLeave = () => setHoverCard({ label: null, top: 0 });

  const Item = ({ to, icon, label, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
      data-label={label}
      aria-label={label}
      onMouseEnter={(e) => onEnter(e, label)}
      onMouseLeave={onLeave}
    >
      <span className="icon">{icon}</span>
      <span className="label-wrap">
        <span className="label">{label}</span>
      </span>
      {children}
    </NavLink>
  );

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

      <nav className="sidebar-nav">
        {/* Home visible to everyone */}
        <Item to="/" icon={<Icon.Home />} label="Home" />

        {/* Always-visible public browsing */}
        <Item to="/BrowseEvents" icon={<Icon.Search />} label="Browse Events" />

        {/* Auth-only items */}
        {authed && (
          <>
            <Item
              to="/EventManagement"
              icon={<Icon.Calendar />}
              label="Event Management"
            />
            <Item
              to="/ProfileManagement"
              icon={<Icon.Users />}
              label="Profile Management"
            />
            <Item to="/inbox" icon={<Icon.Mail />} label="Inbox">
              {unreadNotifs > 0 && (
                <Badge bg="danger" pill className="counter">
                  {unreadNotifs}
                </Badge>
              )}
            </Item>
            <Item
              to="/Assignments"
              icon={<Icon.CheckList />}
              label="Assignments"
            />
            <Item
              to="/VolunteerMatching"
              icon={<Icon.Users />}
              label="Volunteer Matching"
            />
            <Item
              to="/VolunteerHistory"
              icon={<Icon.History />}
              label="Volunteer History"
            />
          </>
        )}

        {/* Auth gates for auth links */}
        {!authed && (
          <>
            <Item to="/Register" icon={<Icon.Lock />} label="Register" />
            <Item to="/Login" icon={<Icon.Lock />} label="Login" />
          </>
        )}
        {authed && <Item to="/logout" icon={<Icon.Door />} label="Log Out" />}
      </nav>

      {/* Themed hover card (shown only when collapsed and hovering) */}
      {collapsed && hoverCard.label && (
        <div className="hover-card" style={{ top: hoverCard.top }}>
          <div className="hover-card-arrow" />
          <div className="hover-card-body">{hoverCard.label}</div>
        </div>
      )}
    </aside>
  );
}
