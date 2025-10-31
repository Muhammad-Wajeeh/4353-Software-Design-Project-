import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";

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

export default function Inbox() {
  const [items, setItems] = useState([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const decoded = token ? decodeJwt(token) : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      if (!decoded?.id) {
        setItems([]);
        return;
      }
      const { data } = await axios.get(
        "http://localhost:5000/notifications/getAllForThisUser",
        { headers: authHeaders, params: { onlyUnread } }
      );
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnread]);

  const markRead = async (idLike) => {
    try {
      const id = idLike?.id ?? idLike?.notificationid ?? idLike;
      if (!id) return;
      await axios.patch(`http://localhost:5000/notifications/${id}/read`, null, {
        headers: authHeaders,
      });
      setItems((prev) =>
        prev.map((n) => {
          const nid = n.id ?? n.notificationid;
          return nid === id ? { ...n, wasread: true, read: true } : n;
        })
      );
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch(
        "http://localhost:5000/notifications/markAllAsReadForThisUser",
        null,
        { headers: authHeaders }
      );
      setItems((prev) => prev.map((n) => ({ ...n, wasread: true, read: true })));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (idLike) => {
    try {
      const id = idLike?.id ?? idLike?.notificationid ?? idLike;
      if (!id) return;
      await axios.delete(`http://localhost:5000/notifications/${id}`, {
        headers: authHeaders,
      });
      setItems((prev) => prev.filter((n) => (n.id ?? n.notificationid) !== id));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  const typeColor = (n) => {
    const isAssign = n.isassignment ?? n.isAssignment;
    const isRem = n.isreminder ?? n.isReminder;
    if (isAssign) return "primary";
    if (isRem) return "warning";
    return "secondary";
  };

  const isRead = (n) => (n.wasread ?? n.read) === true;

  const createdAtStr = (n) => {
    const unix = n.datereceived ?? n.dateReceived;
    if (unix == null) return "";
    const ms = Number(unix) * 1000;
    if (!Number.isFinite(ms)) return "";
    return new Date(ms).toLocaleString();
    // If you later migrate to timestamptz, just new Date(n.datereceived).toLocaleString()
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

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted">No notifications.</p>
        ) : (
          <ListGroup>
            {items.map((n) => {
              const nid = n.id ?? n.notificationid;
              return (
                <ListGroup.Item
                  key={nid}
                  className="d-flex justify-content-between align-items-start"
                >
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={typeColor(n)}>
                        {(n.isassignment ?? n.isAssignment)
                          ? "assignment"
                          : (n.isreminder ?? n.isReminder)
                          ? "reminder"
                          : "update"}
                      </Badge>
                      {!isRead(n) && <Badge bg="danger">new</Badge>}
                      <strong>{n.title}</strong>
                    </div>
                    <div className="text-muted small">{createdAtStr(n)}</div>
                    <div className="mt-1">{n.description}</div>
                  </div>

                  <ButtonGroup size="sm">
                    {!isRead(n) && (
                      <Button
                        variant="outline-success"
                        onClick={() => markRead(n)}
                      >
                        Mark read
                      </Button>
                    )}
                    <Button variant="outline-danger" onClick={() => remove(n)}>
                      Delete
                    </Button>
                  </ButtonGroup>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </div>
    </>
  );
}
