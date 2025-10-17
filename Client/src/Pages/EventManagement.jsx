import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { Form, Button, Card, ListGroup } from "react-bootstrap";
import Sidebar from "./Sidebar";

function EventManagement({
  eventName,
  setEventName,
  eventDescription,
  setEventDescription,
  eventLocation,
  setEventLocation,
  eventZipCode,
  setEventZipCode,
  eventRequiredSkills,
  setEventRequiredSkills,
  eventUrgency,
  setEventUrgency,
  eventDate,
  setEventDate,
  eventsList,
  setEventsList,
}) {
  const onSubmitForm = async (e) => {
    try {
      const body = {
        eventName: eventName,
        eventDescription: eventDescription,
        eventLocation: eventLocation,
        eventZipCode: eventZipCode,
        eventRequiredSkills: eventRequiredSkills,
        eventUrgency: eventUrgency,
        eventDate: eventDate,
      };

      const response = await fetch("http://localhost:5000/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.log(err);
    }
  };

  const getEvents = async () => {
    try {
      // const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/event/getall", {
        method: "GET",
        headers: {
          // Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const jsonData = await response.json();
      setEventsList(jsonData);
    } catch (error) {
      console.log(error);
    }
  };

  const onClickDeleteButton = async (eventNameToBeDeleted) => {
    try {
      const body = {
        eventName: eventNameToBeDeleted,
      };
      const response = await fetch("http://localhost:5000/event/delete", {
        method: "DELETE",
        headers: {
          // Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const jsonData = await response.json();
      setEventsList(jsonData);
    } catch (error) {
      console.log(error);
    }
  };

  const navigate = useNavigate();

  const handleEdit = (eventName) => {
    navigate(`/events/edit/${encodeURIComponent(eventName)}`);
  };

  useEffect(() =>
    //use effect is interesting, it basically runs 'side effects' when the component that 'useEffect' is in runs. In our case, our side effect(s) is getTodos
    {
      getEvents();
    }, []); // this empty brackets tells the useEffect to only run the side effect once.

  return (
    <>
      <Sidebar></Sidebar>
      <Form className="formAndCards">
        <div className="formSection">
          <Form.Group className="mb-3" controlId="emEventName">
            <Form.Label>Event Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter event name"
              maxLength={100}
              required
              name="eventName"
              onChange={(e) => setEventName(e.target.value)}
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
              onChange={(e) => setEventLocation(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="emZipCode">
            <Form.Label>Zip Code</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter Zip/Postal Code"
              required
              name="location"
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
              onChange={(e) => setEventDate(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" variant="primary" onClick={onSubmitForm}>
            Save Event
          </Button>
        </div>

        <div className="cardsContainer">
          {eventsList.map((event, index) => (
            <Card style={{ width: "18rem" }}>
              <Card.Body>
                <Card.Title>{event.eventName}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {event.eventLocation}
                </Card.Subtitle>
                <Card.Subtitle className="mb-2 text-muted">
                  {event.eventDate}
                </Card.Subtitle>
                <Card.Text>{event.eventDescription}</Card.Text>
              </Card.Body>

              <Card.Body>
                <div>
                  <Button
                    variant="primary"
                    className="editAndDeleteButtons"
                    onClick={() => {
                      handleEdit(event.eventName);
                    }}
                  >
                    edit
                  </Button>
                  <Button
                    variant="primary"
                    className="editAndDeleteButtons"
                    onClick={() => onClickDeleteButton(event.eventName)}
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
