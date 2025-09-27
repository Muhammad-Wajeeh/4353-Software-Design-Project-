import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Sidebar from "./Sidebar";

function EventManagement() {

  return (
    <>
    <Sidebar></Sidebar>
    <Form>
      <Form.Group className="mb-3" controlId="emEventName">
        <Form.Label>Event Name</Form.Label>
        <Form.Control type="text" placeholder="Enter event name" maxLength={100} required name="eventName"/>
        <Form.Text muted>Maximum 100 characters.</Form.Text>
      </Form.Group>

      <Form.Group className="mb-3" controlId="emDescription">
        <Form.Label>Event Description</Form.Label>
        <Form.Control as="textarea" rows={4} placeholder="Describe the event..." required name ="description"/>
      </Form.Group>

      <Form.Group className="mb-3" controlId="emLocation">
        <Form.Label>Location</Form.Label>
        <Form.Control as="textarea" rows={2} placeholder="Enter location (address or venue)" required name="location"/>
      </Form.Group>  
    

      <Form.Group className="mb-3" controlId="emRequiredSkills">
        <Form.Label>Required Skills</Form.Label>
        <Form.Select multiple required name="requiredSkills" style={{ minHeight: 140 }}>
            <option value="First Aid">First Aid</option>
            <option value="Food Service">Food Service</option>
            <option value="Logistics">Logistics</option>
            <option value="Teaching">Teaching</option>
            <option value="Event Setup">Event Setup</option>
            <option value="Data Entry">Data Entry</option>
            <option value="Customer Service">Customer Service</option>
        </Form.Select>
        <Form.Text muted>Select one or more skills (Ctrl/Cmd + click).</Form.Text>
      </Form.Group>
      

      <Form.Group className="mb-3" controlId="emUrgency">
        <Form.Label>Urgency</Form.Label>
        <Form.Select required name="urgency">
            <option value="">Select urgency...</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
        </Form.Select>
      </Form.Group>
     <Form.Group className="mb-3" controlId="emEventDate">
        <Form.Label>Event Date</Form.Label>
        <Form.Control type="date" required name="eventDate" />
     </Form.Group>


   

      <Button type="submit" variant="primary">Save Event</Button>
    </Form>
    </>
  )
}

export default EventManagement