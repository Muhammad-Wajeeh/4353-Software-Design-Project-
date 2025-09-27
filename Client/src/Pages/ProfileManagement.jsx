import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormGroup from "react-bootstrap/esm/FormGroup";
import Sidebar from "./Sidebar";

function ProfileManagement() {
  const [startDate, setStartDate] = useState(new Date());

  return (
    <>
      <Sidebar></Sidebar>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicFirstName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="name"
            placeholder="Enter first name"
            maxLength={50}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="fromBasicAddress2">
          <Form.Label>Address 1</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Address 1"
            maxLength={100}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="fromBasicAddress2">
          <Form.Label>Address 2</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Address 2"
            maxLength={100}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="City">
          <Form.Label>City</Form.Label>
          <Form.Control type="text" placeholder="City" maxLength={100} />
          <Form.Text className="text-muted"></Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="mySelectId">
          <Form.Label>State</Form.Label>
          <Form.Select aria-label="Default select example">
            <option>Select State</option>
            <option value="1">TX</option>
            <option value="2">NY</option>
            <option value="3">LA</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="Zip Code">
          <Form.Label>Zip</Form.Label>
          <Form.Control type="Number" placeholder="Zip" maxLength={9} />
          <Form.Text className="text-muted"></Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="skills">
          <Form.Label>Skills</Form.Label>
          <Form.Select
            multiple
            required
            name="skills"
            style={{ maxHeight: 100 }}
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

        <Form.Group className="mb-3" controlId="Preferences">
          <Form.Label>Preferences</Form.Label>
          <Form.Control type="text" placeholder="Preferences" />
          <Form.Text className="text-muted"></Form.Text>
        </Form.Group>

        <Form.Label>Availability</Form.Label>
        <Form.Group className="mb-3">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </>
  );
}

export default ProfileManagement;
