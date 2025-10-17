import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card } from "react-bootstrap";
import Sidebar from "./Sidebar";

function EventManagement(props) {
  // Support both “lifted state via props” AND local state (fallbacks)
  const [localEventName, setLocalEventName] = useState("");
  const [localEventDescription, setLocalEventDescription] = useState("");
  const [localEventLocation, setLocalEventLocation] = useState("");
  const [localEventZipCode, setLocalEventZipCode] = useState("");
  const [localEventRequiredSkills, setLocalEventRequiredSkills] = useState([]);
  const [localEventUrgency, setLocalEventUrgency] = useState("");
  const [localEventDate, setLocalEventDate] = useState("");
  const [localEventsList, setLocalEventsList] = useState([]);

  const eventName = props.eventName ?? localEventName;
  const setEventName = props.setEventName ?? setLocalEventName;

  const eventDescription = props.eventDescription ?? localEventDescription;
  const setEventDescription = props.setEventDescription ?? setLocalEventDescription;

  const eventLocation = props.eventLocation ?? localEventLocation;
  const setEventLocation = props.setEventLocation ?? setLocalEventLocation;

  const eventZipCode = props.eventZipCode ?? localEventZipCode;
  const setEventZipCode = props.setEventZipCode ?? setLocalEventZipCode;

  const eventRequiredSkills =
    props.eventRequiredSkills ?? localEventRequiredSkills;
  const setEventRequiredSkills =
    props.setEventRequiredSkills ?? setLocalEventRequiredSkills;

  const eventUrgency = props.eventUrgency ?? localEventUrgency;
  const setEventUrgency = props.setEventUrgency ?? setLocalEventUrgency;

  const eventDate = props.eventDate ?? localEventDate;
  const setEventDate = props.setEventDate ?? setLocalEventDate;

  const eventsList = props.eventsList ?? localEventsList;
  const setEventsList = props.setEventsList ?? setLocalEventsList;

  const navigate = useNavigate();

  const onSubmitForm = async (e) => {
    e.preventDefault(); // prevent full page reload
    try {
      const body = {
        eventName,
        eventDescription,
        eventLocation,
        eventZipCode,
        eventRequiredSkills,
        eventUrgency,
        eventDate,
      };

      const response = await fetch("http://localhost:5000/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Create failed");
      }

      // refresh list + clear form
      await getEvents();
      setEventName("");
      setEventDescription("");
      setEventLocation("");
      setEventZipCode("");
      setEventRequiredSkills([]);
      setEventUrgency("");
      setEventDate("");
      alert("Event created!");
    } catch (err) {
      console.error(err);
      alert("Could not create event.");
    }
  };

  const getEvents = async () => {
    try {
      const response = await fetch("http://localhost:5000/event/getall", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      const json = await response.json();
      // server returns { events: [...] }
      setEventsList(Array.isArray(json.events) ? json.events : []);
    } catch (error) {
      console.error(error);
      setEventsList([]); // never let it be non-array
    }
  };

  const onClickDeleteButton = async (eventNameToBeDeleted) => {
    try {
      const body = { eventName: eventNameToBeDeleted };
      const response = await fetch("http://localhost:5000/event/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Delete failed");
      const json = await response.json();
      setEventsList(Array.isArray(json.events) ? json.events : []);
    } catch (error) {
      console.error(error);
      alert("Could not delete event.");
    }
  };

  const handleEdit = (name) => {
    navigate(`/events/edit/${encodeURIComponent(name)}`);
  };

  useEffect(() => {
    getEvents();
  }, []);

  return (
    <>
      <Sidebar />
      <Form className="formAndCards" onSubmit={onSubmitForm}>
        <div className="formSection">
          <Form.Group className="mb-3" controlId="emEventName">
            <Form.Label>Event Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter event name"
              maxLength={100}
              required
              name="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
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
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
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
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="emZipCode">
            <Form.Label>Zip Code</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter Zip/Postal Code"
              required
              name="zip"
              value={eventZipCode}
              onChange={(e) => setEventZipCode(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="emRequiredSkills">
            <Form.Label>Required Skills</Form.Label>
            <Form.Select
              multiple
              required
              name="requiredSkills"
              style={{ minHeight: 140 }}
              value={eventRequiredSkills}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                setEventRequiredSkills(selected);
              }}
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
              value={eventUrgency}
              onChange={(e) => setEventUrgency(e.target.value)}
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
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" variant="primary">
            Save Event
          </Button>
        </div>

        <div className="cardsContainer">
          {(Array.isArray(eventsList) ? eventsList : []).map((event) => (
            <Card key={event.id} style={{ width: "18rem" }}>
              <Card.Body>
                <Card.Title>{event.name ?? event.eventName}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {event.location ?? event.eventLocation}
                </Card.Subtitle>
                <Card.Subtitle className="mb-2 text-muted">
                  {event.date ?? event.eventDate}
                </Card.Subtitle>
                <Card.Text>
                  {event.description ?? event.eventDescription}
                </Card.Text>
              </Card.Body>

              <Card.Body>
                <div>
                  <Button
                    variant="primary"
                    className="editAndDeleteButtons"
                    onClick={() => handleEdit(event.name ?? event.eventName)}
                  >
                    edit
                  </Button>
                  <Button
                    variant="primary"
                    className="editAndDeleteButtons"
                    onClick={() =>
                      onClickDeleteButton(event.name ?? event.eventName)
                    }
                  >
                    delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Form>
    </>
  );
}

export default EventManagement;
