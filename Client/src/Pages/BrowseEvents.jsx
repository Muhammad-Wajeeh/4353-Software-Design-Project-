import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import "./BrowseEvents.css";

function BrowseEvents() {
  const [events, setEvents] = useState([]);

  const getEvents = async () => {
    try {
      const response = await fetch("http://localhost:5000/event/getall", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch events");

      const json = await response.json();

      // Server returns { events: [...] } → extract safely
      const eventsList = Array.isArray(json.events) ? json.events : [];

      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]); // ensures it never breaks render
    }
  };

  useEffect(() => {
    getEvents();
  }, []);

  return (
    <>
      <Sidebar />
      <div className="events-container">
        {Array.isArray(events) &&
          events.map((event) => {
            const urgency = event.urgency ?? event.eventUrgency ?? "Low";

            let urgencyClass = "";
            let urgencyInWordForm = " ";
            if (urgency === 1) {
              urgencyClass = "urgency-medium";
              urgencyInWordForm = "Medium";
            } else if (urgency === 2) {
              urgencyClass = "urgency-high";
              urgencyInWordForm = "High";
            } else if (urgency === 3) {
              urgencyClass = "urgency-critical";
              urgencyInWordForm = "Critical";
            } else {
              urgencyClass = "urgency-low";
              urgencyInWordForm = "Low";
            }

            return (
              <Card key={event.id} className="event-card">
                <div className={`urgency-badge ${urgencyClass}`}>
                  urgency : {urgencyInWordForm}
                </div>

                <Card.Header as="h5">
                  {event.organization ?? "VolunteerHub"}
                </Card.Header>
                <Card.Body>
                  <Card.Title>{event.name ?? event.eventName}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {event.location ?? event.eventLocation}
                  </Card.Subtitle>
                  <Card.Subtitle className="mb-2 text-muted">
                    {new Date(event.date ?? event.eventDate).toLocaleString()}
                  </Card.Subtitle>
                  <Card.Text>
                    {event.description ?? event.eventDescription}
                  </Card.Text>

                  {/* 🔹 Bottom Row: Skills + Button */}
                  <div className="bottom-row">
                    <div className="skills-container">
                      {Array.isArray(event.eventRequiredSkills) &&
                        event.eventRequiredSkills.length > 0 &&
                        event.eventRequiredSkills.map((skill, idx) => (
                          <span key={idx} className="skill-badge">
                            {skill}
                          </span>
                        ))}
                    </div>
                    <Button variant="success">Sign Up</Button>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
      </div>
    </>
  );
}

export default BrowseEvents;
