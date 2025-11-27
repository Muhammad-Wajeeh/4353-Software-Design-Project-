// Client/src/Pages/EventManagement.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card } from "react-bootstrap";
import Sidebar from "./Sidebar";
import "./EventManagement.css";

function EventManagement(props) {
  // Local fallbacks
  const [localEventName, setLocalEventName] = useState("");
  const [localEventDescription, setLocalEventDescription] = useState("");
  const [localEventLocation, setLocalEventLocation] = useState("");
  const [localEventZipCode, setLocalEventZipCode] = useState("");
  const [localEventRequiredSkills, setLocalEventRequiredSkills] = useState([]);
  const [localEventUrgency, setLocalEventUrgency] = useState("");
  const [localEventDate, setLocalEventDate] = useState("");
  const [localEventsList, setLocalEventsList] = useState([]);
  const [localEventTime, setLocalEventTime] = useState("");
  const [localEventOrganization, setLocalEventOrganization] = useState("");

  const [skillNeeds, setSkillNeeds] = useState({
    firstAid: 0,
    foodService: 0,
    logistics: 0,
    teaching: 0,
    eventSetup: 0,
    dataEntry: 0,
    customerService: 0,
  });

  const eventName = props.eventName ?? localEventName;
  const setEventName = props.setEventName ?? setLocalEventName;

  const eventDescription = props.eventDescription ?? localEventDescription;
  const setEventDescription =
    props.setEventDescription ?? setLocalEventDescription;

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

  const eventTime = props.eventTime ?? localEventTime;
  const setEventTime = props.setEventTime ?? setLocalEventTime;

  const eventOrganization =
    props.eventOrganization ?? localEventOrganization;
  const setEventOrganization =
    props.setEventOrganization ?? setLocalEventOrganization;

  const navigate = useNavigate();

  const onSubmitForm = async (e) => {
    e.preventDefault(); // prevent full page reload
    try {
      const body = {
        eventName,
        eventDescription,
        eventLocation,
        eventZipCode,
        skillNeeds,
        eventUrgency,
        eventDate,
        eventTime,
        organization: eventOrganization,
      };

      const response = await fetch("http://localhost:5000/event/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
      setSkillNeeds({
        firstAid: 0,
        foodService: 0,
        logistics: 0,
        teaching: 0,
        eventSetup: 0,
        dataEntry: 0,
        customerService: 0,
      });
      setEventUrgency("");
      setEventDate("");
      setEventTime("");
      setEventOrganization("");
      alert("Event created!");
    } catch (err) {
      console.error(err);
      alert("Could not create event.");
    }
  };

  const getEvents = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/event/getAllForThisUser",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch events");

      const json = await response.json();

      const eventsArray = Array.isArray(json.events) ? json.events : [];
      setEventsList(eventsArray);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEventsList([]);
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
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Event Name
            </Form.Label>
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
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Event Description
            </Form.Label>
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
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Location
            </Form.Label>
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

          <Form.Group className="mb-3" controlId="emOrganization">
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Organization
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter organization name"
              name="organization"
              value={eventOrganization}
              onChange={(e) => setEventOrganization(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="emZipCode">
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Zip Code
            </Form.Label>
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
            <Form.Label>Number Of People Required For Each Skill</Form.Label>

            <div className="skillsGrid">
              {[
                ["firstAid", "First Aid"],
                ["foodService", "Food Service"],
                ["logistics", "Logistics"],
                ["teaching", "Teaching"],
                ["eventSetup", "Event Setup"],
                ["dataEntry", "Data Entry"],
                ["customerService", "Customer Service"],
              ].map(([key, label]) => (
                <div className="skillRow" key={key}>
                  <Form.Label className="skillLabel">{label}</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={skillNeeds[key]}
                    onChange={(e) =>
                      setSkillNeeds({
                        ...skillNeeds,
                        [key]: Number(e.target.value),
                      })
                    }
                    className="skillInput"
                  />
                </div>
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="emUrgency">
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Urgency
            </Form.Label>
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
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Event Date
            </Form.Label>
            <Form.Control
              type="date"
              required
              name="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ paddingBottom: "5px", fontWeight: "bold" }}>
              Event Time
            </Form.Label>
            <Form.Control
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" variant="primary">
            Save Event
          </Button>
        </div>

        <div className="cardsContainer">
          {(Array.isArray(eventsList) ? eventsList : []).map((event) => (
            <Card key={event.id || event.eventName} style={{ width: "18rem" }}>
              <Card.Body>
                <Card.Title>{event.name ?? event.eventName}</Card.Title>
                <Card.Subtitle className="mb-1 text-muted">
                  {event.organization || "No organization"}
                </Card.Subtitle>
                <Card.Subtitle className="mb-1 text-muted">
                  {event.eventLocation || event.location}
                </Card.Subtitle>
                <Card.Subtitle className="mb-1 text-muted">
                  {(event.eventDate || event.date || "")
                    .toString()
                    .split("T")[0] || "No Date"}
                </Card.Subtitle>

                <Card.Subtitle className="mb-2 text-muted">
                  {event.eventTime || event.event_time || "TBD"}
                </Card.Subtitle>

                <Card.Text>
                  {event.eventDescription || event.description}
                </Card.Text>
              </Card.Body>

              <Card.Body>
                <div style={{ display: "flex" }}>
                  <Button
                    variant="primary"
                    className="editAndDeleteButtons"
                    onClick={() => handleEdit(event.name ?? event.eventName)}
                  >
                    View/Edit
                  </Button>
                  <Button
                    variant="primary"
                    className="editAndDeleteButtons"
                    onClick={() =>
                      onClickDeleteButton(event.name ?? event.eventName)
                    }
                  >
                    Delete
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
