import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import Sidebar from "./Sidebar";

function EditEvent() {
  const { eventName } = useParams(); // get event name from route
  const navigate = useNavigate(); // ✅ useNavigate instead of state

  const [event, setEvent] = useState(null);

  const onSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/event/edit/${eventName}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }
      );
      if (response.ok) {
        navigate("/eventmanagement");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvent = async () => {
    const response = await fetch(
      `http://localhost:5000/event/get/${eventName}`,
      {
        method: "GET",
        headers: {
          // Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    const formattedDate = new Date(data.eventDate).toISOString().split("T")[0];
    setEvent({
      ...data,
      eventRequiredSkills: Array.isArray(data.eventRequiredSkills)
        ? data.eventRequiredSkills
        : [data.eventRequiredSkills],
    });
    setEvent({ ...data, eventDate: formattedDate });
    console.log(data);
  };

  useEffect(() => {
    fetchEvent();
  }, [eventName]);

  if (!event) return <p>Loading...</p>;

  return (
    <>
      <Sidebar></Sidebar>
      <Form onSubmit={onSubmitForm}>
        <Form.Group className="mb-3" controlId="emEventName">
          <Form.Label>Event Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter event name"
            maxLength={100}
            required
            name="eventName"
            value={event?.eventName || ""} // avoid undefined errors
            readOnly
            onChange={(e) => setEvent({ ...event, eventName: e.target.value })}
          />
          <Form.Text muted>Maximum 100 characters.</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="emDescription">
          {" "}
          <Form.Label>Event Description</Form.Label>{" "}
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="Describe the event..."
            required
            name="description"
            value={event?.eventDescription || ""} // avoid undefined errors
            onChange={(e) =>
              setEvent({ ...event, eventDescription: e.target.value })
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
            value={event?.eventLocation || ""} // avoid undefined errors
            onChange={(e) =>
              setEvent({ ...event, eventLocation: e.target.value })
            }
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="emZipCode">
          <Form.Label>Zip Code</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter Zip/Postal Code"
            required
            name="Zip Code"
            value={event?.eventZipCode || ""} // avoid undefined errors
            onChange={(e) =>
              setEvent({ ...event, eventZipCode: e.target.value })
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
            value={
              Array.isArray(event?.eventRequiredSkills)
                ? event.eventRequiredSkills
                : []
            }
            onChange={(e) =>
              setEvent({
                ...event,
                eventRequiredSkills: Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                ),
              })
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
            value={event?.eventUrgency || ""} // avoid undefined errors
            onChange={(e) =>
              setEvent({ ...event, eventUrgency: e.target.value })
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
            value={event?.eventDate || ""} // avoid undefined errors
            onChange={(e) => setEvent({ ...event, eventDate: e.target.value })}
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
