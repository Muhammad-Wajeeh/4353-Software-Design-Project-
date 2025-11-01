import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";

const API = "http://localhost:5000";

function Inbox() {
  const [items, setItems] = useState([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(true);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    "Content-Type": "application/json",
  });

  // Fetch all notifications for logged-in user
  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/notifications/getAllForThisUser?onlyUnread=${onlyUnread}`,
        { headers: authHeader() }
      );
      if (!res.ok) {
        console.error("Failed to fetch notifications:", res.status);
        setItems([]);
      } else {
        const data = await res.json();
        setItems(Array.isArray(data.notifications) ? data.notifications : []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setBooting(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnread]);

  // Mark one notification as read
  const markRead = async (notificationId) => {
    try {
      const res = await fetch(
        `${API}/notifications/${notificationId}/markAsRead`,
        { method: "PUT" }
      );
      if (res.ok) {
        setItems((prev) =>
          prev.map((n) =>
            n.notificationId === notificationId ? { ...n, wasRead: true } : n
          )
        );
      } else {
        console.error("markRead failed:", await res.text());
      }
    } catch (err) {
      console.error("markRead error:", err);
    }
  };

  // Mark all as read (for current user)
  const markAllRead = async () => {
    try {
      const res = await fetch(`${API}/notifications/markAllAsReadForThisUser`, {
        method: "PUT",
        headers: authHeader(),
      });
      if (res.ok) {
        setItems((prev) => prev.map((n) => ({ ...n, wasRead: true })));
      } else {
        console.error("markAllRead failed:", await res.text());
      }
    } catch (err) {
      console.error("markAllRead error:", err);
    }
  };

  // Delete one notification
  const remove = async (notificationId) => {
    try {
      const res = await fetch(`${API}/notifications/delete/${notificationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) =>
          prev.filter((n) => n.notificationId !== notificationId)
        );
      } else {
        console.error("remove failed:", await res.text());
      }
    } catch (err) {
      console.error("remove error:", err);
    }
  };

  // UI helpers (match backend field names)
  const typeBadge = (n) => {
    if (n.isAssignment) return <Badge bg="primary">assignment</Badge>;
    if (n.isReminder) return <Badge bg="warning">reminder</Badge>;
    return <Badge bg="secondary">general</Badge>;
  };

  const fmtWhen = (v) => {
    if (!v && v !== 0) return "";
    const ms = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(ms) ? new Date(ms).toLocaleString() : "";
  };

  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 800 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Inbox</h2>
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="switch"
              id="onlyUnread"
              label="Only unread"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
            />
            <Button variant="outline-secondary" onClick={fetchNotifs}>
              Refresh
            </Button>
            <Button variant="outline-success" onClick={markAllRead}>
              Mark all read
            </Button>
          </div>
        </div>

        {booting ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted">No notifications.</p>
        ) : (
          <ListGroup>
            {items.map((n) => (
              <ListGroup.Item
                key={n.notificationId}
                className="d-flex justify-content-between align-items-start"
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    {typeBadge(n)}
                    {!n.wasRead && <Badge bg="danger">new</Badge>}
                    <strong>{n.title}</strong>
                  </div>
                  <div className="text-muted small">
                    {fmtWhen(n.dateReceived)}
                  </div>
                  <div className="mt-1">{n.description}</div>
                </div>

                <ButtonGroup size="sm">
                  {!n.wasRead && (
                    <Button
                      variant="outline-success"
                      onClick={() => markRead(n.notificationId)}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="outline-danger"
                    onClick={() => remove(n.notificationId)}
                  >
                    Delete
                  </Button>
                </ButtonGroup>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    </>
  );
}

export default Inbox;
