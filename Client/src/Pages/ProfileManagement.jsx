import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Form, Button, Badge } from "react-bootstrap";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormGroup from "react-bootstrap/esm/FormGroup";
import Sidebar from "./Sidebar";

const fmt = (d) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : "";

function ProfileManagement() {
  const [validated, setValidated] = useState(false);
  // Multi-date availability state
  const [picked, setPicked] = useState(null); // current date shown in the picker
  const [availability, setAvailability] = useState([]); // array of ISO strings like "2025-10-05"

  const addDate = () => {
    if (!picked) return;
    const iso = fmt(picked);
    if (!availability.includes(iso)) {
      setAvailability((arr) => [...arr, iso].sort());
    }
    setPicked(null); // clear picker after adding
  };

  const removeDate = (iso) => {
    setAvailability((arr) => arr.filter((d) => d !== iso));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    const baseValid = form.checkValidity();
    const datesValid = availability.length > 0;

    setValidated(true);

    if (baseValid && datesValid) {
      // TODO: send all form values + `availability` to backend
      // console.log({ availability });
      // alert("Saved: " + availability.join(", "));
    }
  };


  return (
    <>
      <Sidebar></Sidebar>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicFirstName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="name"
            placeholder="Enter first name"
            maxLength={50}
            required
          />
          <Form.Control.Feedback type="invalid">
            Full name is required (max 50 characters).
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="fromBasicAddress2">
          <Form.Label>Address 1</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Address 1"
            maxLength={100}
            required
          />
          <Form.Control.Feedback type="invalid">
            Address 1 is required (max 100 characters).
          </Form.Control.Feedback>

        </Form.Group>

        <Form.Group className="mb-3" controlId="fromBasicAddress2">
          <Form.Label>Address 2</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Address 2"
            maxLength={100}
          />
          <Form.Text className="text-muted">
          Optional
        </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="City">
          <Form.Label>City</Form.Label>
          <Form.Control type="text" placeholder="City" maxLength={100} required/>
          <Form.Text className="text-muted"></Form.Text>
          <Form.Control.Feedback type="invalid">
            City is required (max 100 characters).
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="mySelectId">
          <Form.Label>State</Form.Label>
          <Form.Select required aria-label="Default select example">
            <option value="">Select State</option>
            <option value="1">TX</option>
            <option value="2">NY</option>
            <option value="3">LA</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please select a state.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="Zip">
          <Form.Label>Zip</Form.Label>
          <Form.Control
            type="text"               // number ignores maxLength; use text + pattern
            placeholder="Zip"
            inputMode="numeric"       // mobile numeric keypad
            pattern="^\d{5}(-?\d{4})?$"  // 12345 or 12345-6789 or 123456789
            maxLength={10}            // allows 5 or 10 with dash
            required
          />
          <Form.Text muted>Enter 5 digits or 9-digit ZIP (e.g., 77001 or 77001-1234).</Form.Text>
          <Form.Control.Feedback type="invalid">
            Please enter a valid ZIP (5 digits or 9 digits with optional dash).
          </Form.Control.Feedback>
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
          <Form.Control.Feedback type="invalid">
            Please select at least one skill.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="Preferences">
          <Form.Label>Preferences</Form.Label>
          <Form.Control type="text" placeholder="Preferences" />
          <Form.Text className="text-muted">Optional</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="pmAvailability">
          <Form.Label>Availability (multiple dates)</Form.Label>

          <div className="d-flex gap-2 align-items-start">
            <DatePicker
              selected={picked}
              onChange={(d) => setPicked(d)}
              placeholderText="Select a date"
              className={`form-control ${validated && availability.length === 0 ? "is-invalid" : ""}`}
              // optional: restrict past dates
              // minDate={new Date()}
            />
            <Button type="button" variant="outline-primary" onClick={addDate}>
              Add
            </Button>
          </div>

          {validated && availability.length === 0 && (
            <div className="invalid-feedback d-block">
              Please add at least one availability date.
            </div>
          )}

          {/* Selected dates as removable chips */}
          {availability.length > 0 && (
            <div className="mt-2">
              {availability.map((d) => (
                <Badge key={d} bg="secondary" className="me-2 mb-2">
                  {d}{" "}
                  <Button
                    size="sm"
                    variant="link"
                    className="text-white text-decoration-none p-0 ms-1"
                    onClick={() => removeDate(d)}
                    aria-label={`Remove ${d}`}
                  >
                    ✕
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          </Form.Group>

        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </>
  );
}

export default ProfileManagement;
