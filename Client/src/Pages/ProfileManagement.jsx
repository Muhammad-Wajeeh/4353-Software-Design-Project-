import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Form, Button, Badge } from "react-bootstrap";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormGroup from "react-bootstrap/esm/FormGroup";
import Sidebar from "./Sidebar";

const fmt = (d) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : "";

function ProfileManagement() {
  const [validated, setValidated] = useState(false);

  // form state (controlled inputs)
  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");   // "TX", "NY", etc.
  const [zip, setZip] = useState("");
  const [skillsSel, setSkillsSel] = useState([]); // array of strings
  const [preferences, setPreferences] = useState("");

  // Multi-date availability state
  const [picked, setPicked] = useState(null); // current date shown in the picker
  const [availability, setAvailability] = useState([]); // array of ISO strings like "2025-10-05"

const fetchProfile = async () => {
  const { data } = await axios.get("http://localhost:5000/profile/u1");
  const u = data.user;

  setFullName(u.name ?? "");

  // ✅ robust parse: handle missing Address 2 correctly
  if (typeof u.location === "string" && u.location) {
    const raw = u.location
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0); // remove empties

    // Take values from the right end: zip, state, city
    const zipPart   = raw.length >= 1 ? raw[raw.length - 1] : "";
    const statePart = raw.length >= 2 ? raw[raw.length - 2] : "";
    const cityPart  = raw.length >= 3 ? raw[raw.length - 3] : "";

    // Whatever is left at the front is address lines
    const streetParts = raw.slice(0, Math.max(0, raw.length - 3));
    const addr1 = streetParts[0] || "";
    const addr2 = streetParts.slice(1).join(", "); // join any remaining pieces

    setAddress1(addr1);
    setAddress2(addr2);
    setCity(cityPart);
    setStateUS(statePart.length <= 3 ? statePart : ""); // basic 2–3 char guard
    setZip(zipPart);
  }

  setSkillsSel(Array.isArray(u.skills) ? u.skills : []);
  setPreferences(u?.preferences?.notes ?? "");

  // if backend normalizes to { dates: [...] }
  if (u?.availability?.dates && Array.isArray(u.availability.dates)) {
    setAvailability(u.availability.dates);
  }
};

useEffect(() => {
    fetchProfile().catch((e) => console.error("Load profile failed", e));
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    const baseValid = form.checkValidity();
    const datesValid = availability.length > 0;
    setValidated(true);
    if (!(baseValid && datesValid)) return;

    const location = [address1, address2, city, stateUS, zip]
      .filter(Boolean)
      .join(", ");

    const body = {
      name: fullName.trim(),
      location,
      skills: skillsSel,
      availability, // array of ISO date strings; backend normalizes to { dates: [...] }
      preferences: { notes: preferences },
    };

    try {
      await axios.put("http://localhost:5000/profile/u1", body);
      alert("Saved! Profile updated");

      // ✅ NEW: immediately re-fetch from backend so UI reflects source of truth
      await fetchProfile();
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.join(", ") ||
        err?.response?.data?.message ||
        err.message;
      alert("Error: " + msg);
    }
  };

  return (
    <>
      <Sidebar></Sidebar>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicFirstName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter full name"
            maxLength={50}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            Full name is required (max 50 characters).
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="Address1">
          <Form.Label>Address 1</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Address 1"
            maxLength={100}
            required
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            Address 1 is required (max 100 characters).
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="Address2">
          <Form.Label>Address 2</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Address 2"
            maxLength={100}
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
          />
          <Form.Text className="text-muted">Optional</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="City">
          <Form.Label>City</Form.Label>
          <Form.Control
            type="text"
            placeholder="City"
            maxLength={100}
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            City is required (max 100 characters).
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="State">
          <Form.Label>State</Form.Label>
          <Form.Select
            required
            value={stateUS}
            onChange={(e) => setStateUS(e.target.value)}
            aria-label="Select state"
          >
            <option value="">Select State</option>
            <option value="TX">TX</option>
            <option value="NY">NY</option>
            <option value="LA">LA</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            Please select a state.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="Zip">
          <Form.Label>Zip</Form.Label>
          <Form.Control
            type="text"
            placeholder="Zip"
            inputMode="numeric"
            pattern="^[0-9]{5}(-?[0-9]{4})?$"

            maxLength={10}
            required
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
          <Form.Text muted>
            Enter 5 digits or 9-digit ZIP (e.g., 77001 or 77001-1234).
          </Form.Text>
          <Form.Control.Feedback type="invalid">
            Please enter a valid ZIP (5 or 9 digits).
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="skills">
          <Form.Label>Skills</Form.Label>
          <Form.Select
            multiple
            required
            name="skills"
            style={{ maxHeight: 100 }}
            value={skillsSel}
            onChange={(e) =>
              setSkillsSel([...e.target.selectedOptions].map((o) => o.value))
            }
          >
            {/* values normalized to lowercase to match backend */}
            <option value="first aid">First Aid</option>
            <option value="food service">Food Service</option>
            <option value="logistics">Logistics</option>
            <option value="teaching">Teaching</option>
            <option value="event setup">Event Setup</option>
            <option value="data entry">Data Entry</option>
            <option value="customer service">Customer Service</option>
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
          <Form.Control
            type="text"
            placeholder="Preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
          <Form.Text className="text-muted">Optional</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="pmAvailability">
          <Form.Label>Availability (multiple dates)</Form.Label>
          <div className="d-flex gap-2 align-items-start">
            <DatePicker
              selected={picked}
              onChange={(d) => setPicked(d)}
              placeholderText="Select a date"
              className={`form-control ${
                validated && availability.length === 0 ? "is-invalid" : ""
              }`}
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
