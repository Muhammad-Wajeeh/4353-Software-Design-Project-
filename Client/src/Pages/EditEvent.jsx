import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import Sidebar from "./Sidebar";

function EditEvent() {
  const { eventName } = useParams();
  const navigate = useNavigate();

  const [eventID, setEventID] = useState();
  const [event, setEvent] = useState(null);
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
            ...event,
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
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <Form.Label style={{ fontWeight: "bold" }}>
            Event Description
          </Form.Label>
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
          <Form.Label style={{ fontWeight: "bold" }}>Location</Form.Label>
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
          <Form.Label style={{ fontWeight: "bold" }}>Zip Code</Form.Label>
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
          <Form.Label className="fw-bold" style={{ fontWeight: "bold" }}>
            Number Of People Required For Each Skill
          </Form.Label>

          {[
            ["firstAid", "First Aid"],
            ["foodService", "Food Service"],
            ["logistics", "Logistics"],
            ["teaching", "Teaching"],
            ["eventSetup", "Event Setup"],
            ["dataEntry", "Data Entry"],
            ["customerService", "Customer Service"],
          ].map(([key, label]) => (
            <div key={key} className="d-flex flex-column mb-2">
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

        <Form.Group className="mb-3" controlId="emUrgency">
          <Form.Label style={{ fontWeight: "bold" }}>Urgency</Form.Label>
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
          <Form.Label style={{ fontWeight: "bold" }}>Event Date</Form.Label>
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
