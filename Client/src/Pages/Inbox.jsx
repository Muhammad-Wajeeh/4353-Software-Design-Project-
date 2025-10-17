import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";

function Inbox() {                       // <-- rename component to match file
  const userId = "u1"; // mock user
  const [items, setItems] = useState([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:5000/notifications/${userId}`, {
        params: { onlyUnread }
      });
      setItems(data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [onlyUnread]);

  const markRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/notifications/${id}/read`);
      setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      // 🔔 tell Sidebar to refresh unread badge
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch(`http://localhost:5000/notifications/${userId}/read-all`);
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      // 🔔 tell Sidebar to refresh unread badge
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/notifications/${id}`);
      setItems(prev => prev.filter(n => n.id !== id));
      // 🔔 tell Sidebar to refresh unread badge
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (e) {
      console.error(e);
    }
  };

  // simple type to color mapping
  const typeColor = (t) =>
    t === "assignment" ? "primary" :
    t === "reminder"   ? "warning" :
    t === "update"     ? "info"    : "secondary";

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
            {items.map((n) => (
              <ListGroup.Item
                key={n.id}
                className="d-flex justify-content-between align-items-start"
              >
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={typeColor(n.type)}>{n.type}</Badge>
                    {!n.read && <Badge bg="danger">new</Badge>}
                    <strong>{n.title}</strong>
                  </div>
                  <div className="text-muted small">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-1">{n.message}</div>
                </div>

                <ButtonGroup size="sm">
                  {!n.read && (
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

export default Inbox;                    // <-- export the component you defined
