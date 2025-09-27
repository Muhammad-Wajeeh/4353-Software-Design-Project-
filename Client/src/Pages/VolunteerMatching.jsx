import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";

function VolunteerMatching(){
    //fake data until database made
    //Volunteer Data
  const volunteers = [
    { id: "v1", fullName: "Tiara Tran", email: "tiara@example.com", skills: ["Food Service", "Logistics"] },
    { id: "v2", fullName: "Lee Park",   email: "lee@example.com",   skills: ["First Aid", "Event Setup"] },
  ];
  //Event Data
  const events = [
    { id: "e1", name: "Food Drive",   date: "2025-10-05", requiredSkills: ["Food Service"] },
    { id: "e2", name: "Park Cleanup", date: "2025-10-12", requiredSkills: ["Event Setup", "Logistics"] },
    { id: "e3", name: "Health Fair",  date: "2025-10-20", requiredSkills: ["First Aid"] },
  ];

  //Reading which Volunteer and Event is chosen
  //Read whether we have tried to submit
  //And whether to show a saved successfully banner
  const [volunteerId, setVolunteerId] = useState("");
  const [eventId, setEventId] = useState("");
  const [validated, setValidated] = useState(false);
  const [saved, setSaved] = useState(false);

  //Using the selected Volunteer Id we find the name, email and skills of the volunteer
  // use memo is there to make sure this is only recalculated when a new input is made
  const selectedVolunteer = useMemo(
    () => volunteers.find(v => v.id === volunteerId),
    [volunteers, volunteerId]
  );

  //if no volunteer, no event match
  //when a volunteer is selected, find events that share skills required that the volunteer possesses
  const matchedEvents = useMemo(() => {
    if (!selectedVolunteer) return [];
    
    return events.filter(ev =>
      ev.requiredSkills.some(rs => selectedVolunteer.skills.includes(rs))
    );
  }, [events, selectedVolunteer]);

  //When a different volunteer is chosen, the previously chosen event is cleared.
  useEffect(() => {
    setEventId("");
  }, [volunteerId]);

  //The Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault(); //stops the browser from relaoding the page on a submit
    setValidated(true); //tells UI to show error message for missing fields.
    if (!volunteerId || !eventId) return; //if both selections exist, we show a success banner

    // TODO: send to backend
    // console.log({ volunteerId, eventId });

    setSaved(true);
    // reset success banner after a bit
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
    {/* gives the user feedback that their action worked */}
      <h2 className="mb-3">Volunteer Matching</h2>

      {saved && (
        <Alert variant="success" dismissible onClose={() => setSaved(false)}>
          Match saved (demo only). 🎉
        </Alert>
      )}

       <Form noValidate onSubmit={handleSubmit}> {/*wraps all the input, OnSubmit calls handler, noo validate lets us control validation messages. Need a container to know what to submit and when to validate */}
        {/* creates and displays the dropdown list using the data of volunteers in our database */}
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

        {/* shows events that match the selected volunteer skills */}
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
        {/* Triggers the form submission */}
        <Button type="submit" variant="primary">Save Match</Button>
      </Form>
    </>
  );
}

export default VolunteerMatching;