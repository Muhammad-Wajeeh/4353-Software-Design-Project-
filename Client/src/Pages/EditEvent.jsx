import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import Sidebar from "./Sidebar";

function EditEvent() {
  const { eventName } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);

  const onSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/event/edit/${encodeURIComponent(eventName)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }
      );
      if (response.ok) {
        alert("Event updated!");
        navigate("/eventmanagement");
      } else {
        alert("Update failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/event/get/${encodeURIComponent(eventName)}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();

      // data shape comes from the server alias in eventRoutes.js
      const formattedDate = data.eventDate
        ? new Date(data.eventDate).toISOString().split("T")[0]
        : "";

      setEvent({
        eventName: data.eventName || "",
        eventDescription: data.eventDescription || "",
        eventLocation: data.eventLocation || "",
        eventZipCode: data.eventZipCode || "",
        eventRequiredSkills: Array.isArray(data.eventRequiredSkills)
          ? data.eventRequiredSkills
          : data.eventRequiredSkills
          ? [data.eventRequiredSkills]
          : [],
        eventUrgency: data.eventUrgency || "",
        eventDate: formattedDate,
      });
    } catch (e) {
      console.error(e);
      alert("Could not load event.");
      navigate("/eventmanagement");
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);

  if (!event) return <p>Loading...</p>;

  return (
    <>
      <Sidebar />
      <Form onSubmit={onSubmitForm} className="p-3">
        <Form.Group className="mb-3" controlId="emEventName">
          <Form.Label>Event Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter event name"
            maxLength={100}
            required
            name="eventName"
            value={event.eventName}
            readOnly
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventName: e.target.value }))
            }
          />
          <Form.Text muted>Maximum 100 characters.</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="emDescription">
          <Form.Label>Event Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="Describe the event..."
            required
            name="description"
            value={event.eventDescription}
            onChange={(e) =>
              setEvent((prev) => ({
                ...prev,
                eventDescription: e.target.value,
              }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="emLocation">
          <Form.Label>Location</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Enter location (address or venue)"
            required
            name="location"
            value={event.eventLocation}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventLocation: e.target.value }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="emZipCode">
          <Form.Label>Zip Code</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter Zip/Postal Code"
            required
            name="zip"
            value={event.eventZipCode}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventZipCode: e.target.value }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="emRequiredSkills">
          <Form.Label>Required Skills</Form.Label>
          <Form.Select
            multiple
            required
            name="requiredSkills"
            style={{ minHeight: 140 }}
            value={event.eventRequiredSkills}
            onChange={(e) =>
              setEvent((prev) => ({
                ...prev,
                eventRequiredSkills: Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                ),
              }))
            }
          >
            <option value="First Aid">First Aid</option>
            <option value="Food Service">Food Service</option>
            <option value="Logistics">Logistics</option>
            <option value="Teaching">Teaching</option>
            <option value="Event Setup">Event Setup</option>
            <option value="Data Entry">Data Entry</option>
            <option value="Customer Service">Customer Service</option>
          </Form.Select>
          <Form.Text muted>
            Select one or more skills (Ctrl/Cmd + click).
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="emUrgency">
          <Form.Label>Urgency</Form.Label>
          <Form.Select
            required
            name="urgency"
            value={event.eventUrgency}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventUrgency: e.target.value }))
            }
          >
            <option value="">Select urgency...</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="emEventDate">
          <Form.Label>Event Date</Form.Label>
          <Form.Control
            type="date"
            required
            name="eventDate"
            value={event.eventDate}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventDate: e.target.value }))
            }
          />
        </Form.Group>

        <Button type="submit" variant="primary">
          Save Event
        </Button>
      </Form>
    </>
  );
}

export default EditEvent;
