import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";

function VolunteerMatching(){
    //fake data until database made
  const volunteers = [
    { id: "v1", fullName: "Tiara Tran", email: "tiara@example.com", skills: ["Food Service", "Logistics"] },
    { id: "v2", fullName: "Lee Park",   email: "lee@example.com",   skills: ["First Aid", "Event Setup"] },
  ];

  const events = [
    { id: "e1", name: "Food Drive",   date: "2025-10-05", requiredSkills: ["Food Service"] },
    { id: "e2", name: "Park Cleanup", date: "2025-10-12", requiredSkills: ["Event Setup", "Logistics"] },
    { id: "e3", name: "Health Fair",  date: "2025-10-20", requiredSkills: ["First Aid"] },
  ];

  // --- State ---
  const [volunteerId, setVolunteerId] = useState("");
  const [eventId, setEventId] = useState("");
  const [validated, setValidated] = useState(false);
  const [saved, setSaved] = useState(false);

  // --- Derived: selected volunteer ---
  const selectedVolunteer = useMemo(
    () => volunteers.find(v => v.id === volunteerId),
    [volunteers, volunteerId]
  );

  // --- Compute matched events whenever volunteer changes ---
  const matchedEvents = useMemo(() => {
    if (!selectedVolunteer) return [];
    // simple matching rule: event.requiredSkills ⊆ volunteer.skills (any overlap works here)
    return events.filter(ev =>
      ev.requiredSkills.some(rs => selectedVolunteer.skills.includes(rs))
    );
  }, [events, selectedVolunteer]);

  // Reset event selection when volunteer changes
  useEffect(() => {
    setEventId("");
  }, [volunteerId]);

  // --- Submit handler ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidated(true);
    if (!volunteerId || !eventId) return;

    // TODO: send to backend
    // console.log({ volunteerId, eventId });

    setSaved(true);
    // reset success banner after a bit
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <h2 className="mb-3">Volunteer Matching</h2>

      {saved && (
        <Alert variant="success" dismissible onClose={() => setSaved(false)}>
          Match saved (demo only). 🎉
        </Alert>
      )}

      <Form noValidate onSubmit={handleSubmit}>
        {/* Volunteer Name (Auto-fill from DB) */}
        <Form.Group className="mb-3" controlId="vmVolunteer">
          <Form.Label>Volunteer Name</Form.Label>
          <Form.Select
            required
            name="volunteerId"
            value={volunteerId}
            onChange={(e) => setVolunteerId(e.target.value)}
            isInvalid={validated && !volunteerId}
          >
            <option value="">Select volunteer...</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.fullName} ({v.email})
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please choose a volunteer.
          </Form.Control.Feedback>
        </Form.Group>

        {/* Matched Event (Auto-fill from DB based on volunteer profile) */}
        <Form.Group className="mb-3" controlId="vmMatchedEvent">
          <Form.Label>Matched Event</Form.Label>
          <Form.Select
            required
            name="eventId"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            disabled={!matchedEvents.length}
            isInvalid={validated && !eventId}
          >
            <option value="">
              {matchedEvents.length ? "Select matched event..." : "No matches available"}
            </option>
            {matchedEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} — {ev.date}
              </option>
            ))}
          </Form.Select>
          <Form.Text muted>
            Auto-populated based on volunteer skills vs event required skills.
          </Form.Text>
          <Form.Control.Feedback type="invalid">
            Please select a matched event.
          </Form.Control.Feedback>
        </Form.Group>

        <Button type="submit" variant="primary">Save Match</Button>
      </Form>
    </>
  );
}

export default VolunteerMatching;