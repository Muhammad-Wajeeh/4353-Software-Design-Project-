import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";

const API = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

/**
 * Axios instance that always attaches the JWT from localStorage
 * (server can't read localStorage; client must send the token)
 */
const http = axios.create({ baseURL: API });
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

function Inbox() {
  const [user, setUser] = useState(null); // { id, username }
  const [items, setItems] = useState([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(true);

  // 1) get logged-in user first (requires Authorization header)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get("/auth/me");
        setUser(data); // expects { id, username }
      } catch (e) {
        console.error("auth/me failed:", e?.response?.data || e.message);
        // TODO: optionally navigate("/login");
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const fetchNotifs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await http.get(`/notifications/${user.id}`, {
        params: { onlyUnread },
      });
      setItems(data.notifications || []);
    } catch (e) {
      console.error("fetchNotifs error:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2) fetch whenever filter or user changes
  useEffect(() => {
    if (user) fetchNotifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, onlyUnread]);

  const markRead = async (id) => {
    try {
      await http.put(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, wasread: true } : n)));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error("markRead error:", e?.response?.data || e.message);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await http.put(`/notifications/${user.id}/read-all`);
      setItems((prev) => prev.map((n) => ({ ...n, wasread: true })));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error("markAllRead error:", e?.response?.data || e.message);
    }
  };

  const remove = async (id) => {
    try {
      await http.delete(`/notifications/${id}`);
      setItems((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error("remove error:", e?.response?.data || e.message);
    }
  };

  const typeBadge = (n) => {
    if (n.isassignment) return <Badge bg="primary">assignment</Badge>;
    if (n.isreminder) return <Badge bg="warning">reminder</Badge>;
    return <Badge bg="secondary">general</Badge>;
  };

  const fmtWhen = (ms) => (ms ? new Date(Number(ms)).toLocaleString() : "");

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
              disabled={!user}
            />
            <Button variant="outline-secondary" onClick={fetchNotifs} disabled={!user}>
              Refresh
            </Button>
            <Button variant="outline-success" onClick={markAllRead} disabled={!user}>
              Mark all read
            </Button>
          </div>
        </div>

        {booting ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : !user ? (
          <p className="text-center text-muted">Please log in to view notifications.</p>
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
                key={n.id}
                className="d-flex justify-content-between align-items-start"
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    {typeBadge(n)}
                    {!n.wasread && <Badge bg="danger">new</Badge>}
                    <strong>{n.title}</strong>
                  </div>
                  <div className="text-muted small">{fmtWhen(n.datereceived)}</div>
                  <div className="mt-1">{n.description}</div>
                </div>

                <ButtonGroup size="sm">
                  {!n.wasread && (
                    <Button variant="outline-success" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                  <Button variant="outline-danger" onClick={() => remove(n.id)}>
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
