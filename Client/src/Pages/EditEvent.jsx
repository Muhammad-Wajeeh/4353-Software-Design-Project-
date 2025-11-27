// Client/src/Pages/EditEvent.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import Sidebar from "./Sidebar";

// convert DB time like "13:47:00" → "13:47" for <input type="time">
const dbTimeToInput = (dbTime) => {
  if (!dbTime) return "";
  const parts = String(dbTime).split(":");
  const h = parts[0]?.padStart(2, "0") || "00";
  const m = parts[1]?.padStart(2, "0") || "00";
  return `${h}:${m}`;
};

function EditEvent() {
  const { eventName } = useParams();
  const navigate = useNavigate();

  const [eventID, setEventID] = useState();
  const [event, setEvent] = useState(null);
  const [eventHours, setEventHours] = useState(""); // 👈 NEW
  const [skillNeeds, setSkillNeeds] = useState({
    firstAid: 0,
    foodService: 0,
    logistics: 0,
    teaching: 0,
    eventSetup: 0,
    dataEntry: 0,
    customerService: 0,
  });

  const onSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/event/edit/${encodeURIComponent(eventID)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName: event.eventName,
            eventDescription: event.eventDescription,
            eventLocation: event.eventLocation,
            eventZipcode: event.eventZipCode,
            eventUrgency: event.eventUrgency,
            eventDate: event.eventDate,
            eventTime: event.eventTime,
            organization: event.organization,
            hours: eventHours ? Number(eventHours) : null, // 👈 SEND HOURS
            skillNeeds: skillNeeds,
          }),
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
        `http://localhost:5000/event/${encodeURIComponent(eventName)}`
      );

      if (!response.ok) throw new Error("Fetch failed");

      const data = await response.json();

      setEventID(data.eventID);

      const urgencyMap = { 0: "Low", 1: "Medium", 2: "High", 3: "Critical" };

      setEvent({
        eventName: data.eventName,
        eventDescription: data.eventDescription,
        eventLocation: data.eventLocation,
        eventZipCode: data.eventZipCode,
        eventUrgency: urgencyMap[data.eventUrgency],
        eventDate: new Date(data.eventDate).toISOString().split("T")[0],
        eventTime: dbTimeToInput(data.eventTime),
        organization: data.organization || "",
      });

      setEventHours(data.hours ?? "");             // 👈 LOAD EVENT HOURS

      setSkillNeeds({
        firstAid: data.firstAid,
        foodService: data.foodService,
        logistics: data.logistics,
        teaching: data.teaching,
        eventSetup: data.eventSetup,
        dataEntry: data.dataEntry,
        customerService: data.customerService,
      });
    } catch (err) {
      console.error(err);
      alert("Could not load event.");
      navigate("/eventmanagement");
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventName]);

  if (!event) return <p>Loading...</p>;

  return (
    <>
      <Sidebar />
      <Form onSubmit={onSubmitForm} className="p-3" style={{ width: "50vw" }}>
        <Form.Group className="mb-3" controlId="emEventName">
          <Form.Label style={{ fontWeight: "bold" }}>Event Name</Form.Label>
          <Form.Control
            type="text"
            maxLength={100}
            required
            readOnly
            value={event.eventName}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Event Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={event.eventDescription}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventDescription: e.target.value }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Location</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={event.eventLocation}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventLocation: e.target.value }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Organization</Form.Label>
          <Form.Control
            value={event.organization}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, organization: e.target.value }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Zip Code</Form.Label>
          <Form.Control
            type="number"
            value={event.eventZipCode}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventZipCode: e.target.value }))
            }
          />
        </Form.Group>

        {/* NEW FIELD: EVENT DURATION */}
        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Event Duration (hours)</Form.Label>
          <Form.Control
            type="number"
            min="1"
            step="0.5"
            value={eventHours}
            onChange={(e) => setEventHours(e.target.value)}
          />
          <Form.Text muted>
            Volunteers will be credited these hours when signing up.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Required Skills</Form.Label>

          {[
            ["firstAid", "First Aid"],
            ["foodService", "Food Service"],
            ["logistics", "Logistics"],
            ["teaching", "Teaching"],
            ["eventSetup", "Event Setup"],
            ["dataEntry", "Data Entry"],
            ["customerService", "Customer Service"],
          ].map(([key, label]) => (
            <div key={key} className="mb-2">
              <Form.Label>{label}</Form.Label>
              <Form.Control
                type="number"
                value={skillNeeds[key]}
                onChange={(e) =>
                  setSkillNeeds({
                    ...skillNeeds,
                    [key]: Number(e.target.value),
                  })
                }
              />
            </div>
          ))}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Urgency</Form.Label>
          <Form.Select
            value={event.eventUrgency}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventUrgency: e.target.value }))
            }
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Event Date</Form.Label>
          <Form.Control
            type="date"
            value={event.eventDate}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventDate: e.target.value }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label style={{ fontWeight: "bold" }}>Event Time</Form.Label>
          <Form.Control
            type="time"
            value={event.eventTime}
            onChange={(e) =>
              setEvent((prev) => ({ ...prev, eventTime: e.target.value }))
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
