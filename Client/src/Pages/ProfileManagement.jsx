// Client/src/Pages/ProfileManagement.jsx
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Form, Button, Badge } from "react-bootstrap";
import Sidebar from "./Sidebar";

// ---- JWT helper (for fallback if vh_userId missing) ----
function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Helper to read logged-in user id consistently
const getUserId = () => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("vh_userId");
  if (stored) return stored;

  const token = localStorage.getItem("token");
  const payload = token ? decodeJwt(token) : null;
  if (payload?.id !== undefined && payload?.id !== null) {
    const idStr = String(payload.id);
    localStorage.setItem("vh_userId", idStr);
    return idStr;
  }
  return null;
};

const DAY_LABELS = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export default function ProfileManagement() {
  const [mode, setMode] = useState("view");
  const [validated, setValidated] = useState(false);

  const [fullName, setFullName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateUS, setStateUS] = useState("");
  const [zip, setZip] = useState("");
  const [skillsSel, setSkillsSel] = useState([]);
  const [preferences, setPreferences] = useState("");
  const [maxDistance, setMaxDistance] = useState("");

  // New: day-of-week availability (Sun–Sat)
  const [availability, setAvailability] = useState({
    sun: false,
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
  });

  const userId = getUserId();

  // ----- Fetch once on mount (and when userId changes) -----
  const fetchProfile = async () => {
    if (!userId) {
      console.warn("No vh_userId in localStorage – user not logged in?");
      return;
    }

    const { data } = await axios.get(
      `http://localhost:5000/profile/${userId}`
    );
    const u = data.user;

    setFullName(u.name ?? "");
    setAddress1(u.address1 ?? "");
    setAddress2(u.address2 ?? "");
    setCity(u.city ?? "");
    setStateUS(u.state ?? "");
    setZip(u.zip ?? "");
    setSkillsSel(Array.isArray(u.skills) ? u.skills : []);

    // preferences might be string or object
    if (u && typeof u.preferences === "object" && !Array.isArray(u.preferences)) {
      setPreferences(u.preferences.notes ?? "");
      setMaxDistance(
        typeof u.preferences.maxDistanceMiles === "number"
          ? u.preferences.maxDistanceMiles
          : ""
      );
    } else {
      setPreferences(u?.preferences || "");
      setMaxDistance("");
    }

    // ✅ New: hydrate availability from API's availability.days object
    const daysFromServer = (u.availability && u.availability.days) || {};

    setAvailability({
      sun: !!(daysFromServer.sun ?? u.isavailablesun ?? u.isAvailableSun),
      mon: !!(daysFromServer.mon ?? u.isavailablemon ?? u.isAvailableMon),
      tue: !!(daysFromServer.tue ?? u.isavailabletue ?? u.isAvailableTue),
      wed: !!(daysFromServer.wed ?? u.isavailablewed ?? u.isAvailableWed),
      thu: !!(daysFromServer.thu ?? u.isavailablethu ?? u.isAvailableThu),
      fri: !!(daysFromServer.fri ?? u.isavailablefri ?? u.isAvailableFri),
      sat: !!(daysFromServer.sat ?? u.isavailablesat ?? u.isAvailableSat),
    });
  };

  useEffect(() => {
    fetchProfile().catch((e) => console.error("Load profile failed", e));
  }, [userId]);

  const enterEdit = () => {
    setValidated(false);
    setMode("edit");
  };

  const cancelEdit = async () => {
    await fetchProfile();
    setValidated(false);
    setMode("view");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    const baseValid = form.checkValidity();

    // at least one day must be selected
    const hasAnyDay = Object.values(availability).some(Boolean);

    setValidated(true);
    if (!(baseValid && hasAnyDay)) return;

    const locParts = [city, stateUS, zip]
      .map((s) => (s || "").trim())
      .filter(Boolean);
    const location = locParts.length ? locParts.join(", ") : undefined;

    const body = {
      name: fullName.trim(),
      address1: address1.trim(),
      address2: address2.trim(),
      city: city.trim(),
      state: stateUS.trim(),
      zip: zip.trim(),
      skills: skillsSel,
      preferences: {
        notes: preferences,
        maxDistanceMiles:
          maxDistance === ""
            ? undefined
            : Number.isFinite(Number(maxDistance))
            ? Number(maxDistance)
            : undefined,
      },
      // New: day-of-week availability booleans for userprofiles table
      isavailablesun: availability.sun,
      isavailablemon: availability.mon,
      isavailabletue: availability.tue,
      isavailablewed: availability.wed,
      isavailablethu: availability.thu,
      isavailablefri: availability.fri,
      isavailablesat: availability.sat,
      // (optional, if you want to also send structured availability)
      availability: { days: availability },
    };

    if (location) {
      body.location = location;
    }

    try {
      await axios.put(`http://localhost:5000/profile/${userId}`, body);
      await fetchProfile();
      setMode("view");
      alert("Saved! Profile updated");
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.join(", ") ||
        err?.response?.data?.message ||
        err.message;
      alert("Error: " + msg);
    }
  };

  // ----- VIEW MODE -----
  if (mode === "view") {
    const infoItem = (label, value) => (
      <div className="d-flex flex-column mb-2">
        <span className="text-muted small">{label}</span>
        <span className="fw-semibold">{value || "—"}</span>
      </div>
    );

    const selectedDays = Object.entries(availability)
      .filter(([, v]) => v)
      .map(([k]) => DAY_LABELS[k]);

    return (
      <>
        <Sidebar />
        <div className="container mt-4" style={{ maxWidth: 960 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="m-0">Profile</h2>
            <Button variant="outline-primary" onClick={enterEdit}>
              ✏️ Edit
            </Button>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              {/* Name */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="text-muted small">Name</div>
                  <div className="fs-5 fw-semibold">{fullName || "—"}</div>
                </div>
              </div>

              {/* Address block */}
              <div className="row">
                <div className="col-12 col-md-6">
                  {infoItem("Address 1", address1)}
                </div>
                <div className="col-12 col-md-6">
                  {infoItem("Address 2", address2)}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-12 col-md-4">{infoItem("City", city)}</div>
                <div className="col-12 col-md-4">
                  {infoItem("State", stateUS)}
                </div>
                <div className="col-12 col-md-4">{infoItem("Zip", zip)}</div>
              </div>

              {/* Skills as chips */}
              <div className="mb-3">
                <div className="text-muted small">Skills</div>
                {skillsSel?.length ? (
                  <div className="mt-1 d-flex flex-wrap gap-2">
                    {skillsSel.map((s) => (
                      <span
                        key={s}
                        className="badge rounded-pill text-bg-secondary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="fw-semibold">—</div>
                )}
              </div>

              {/* Preferences */}
              <div className="row mb-3">
                <div className="col-12 col-md-8">
                  {infoItem("Preferences (notes)", preferences)}
                </div>
                <div className="col-12 col-md-4">
                  {infoItem(
                    "Max Distance (miles)",
                    maxDistance !== "" && maxDistance !== null
                      ? maxDistance
                      : "—"
                  )}
                </div>
              </div>

              {/* Availability as weekday pills */}
              <div>
                <div className="text-muted small">Availability (days)</div>
                {selectedDays.length ? (
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {selectedDays.map((label) => (
                      <Badge
                        key={label}
                        bg="light"
                        text="dark"
                        className="border"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="fw-semibold">—</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ----- EDIT MODE -----
  return (
    <>
      <Sidebar />
      <div className="container mt-4" style={{ maxWidth: 900 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Edit Profile</h2>
          <Button variant="outline-secondary" onClick={cancelEdit}>
            Cancel
          </Button>
        </div>

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

          <div className="row">
            <div className="col-12 col-md-6">
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
            </div>
            <div className="col-12 col-md-6">
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
            </div>
          </div>

          <div className="row">
            <div className="col-12 col-md-4">
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
            </div>
            <div className="col-12 col-md-4">
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
            </div>
            <div className="col-12 col-md-4">
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
            </div>
          </div>

          <Form.Group className="mb-3" controlId="skills">
            <Form.Label>Skills</Form.Label>
            <Form.Select
              multiple
              required
              name="skills"
              style={{ maxHeight: 120 }}
              value={skillsSel}
              onChange={(e) =>
                setSkillsSel([...e.target.selectedOptions].map((o) => o.value))
              }
            >
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

          <div className="row">
            <div className="col-12 col-md-8">
              <Form.Group className="mb-3" controlId="Preferences">
                <Form.Label>Preferences (notes)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Preferences"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
                <Form.Text className="text-muted">Optional</Form.Text>
              </Form.Group>
            </div>
            <div className="col-12 col-md-4">
              <Form.Group className="mb-3" controlId="MaxDistance">
                <Form.Label>Max Distance (miles)</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g., 25"
                  value={maxDistance}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMaxDistance(v === "" ? "" : Number(v));
                  }}
                />
                <Form.Text className="text-muted">
                  Optional — used for event matching.
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          {/* New: day-of-week availability selector */}
          <Form.Group className="mb-3" controlId="pmAvailability">
            <Form.Label>Availability (days of the week)</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {Object.entries(DAY_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={availability[key] ? "success" : "outline-secondary"}
                  onClick={() =>
                    setAvailability((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            {validated && !Object.values(availability).some(Boolean) && (
              <div className="invalid-feedback d-block">
                Please select at least one available day.
              </div>
            )}
            <Form.Text className="text-muted">
              Click the days you are generally available for events.
            </Form.Text>
          </Form.Group>

          <Button variant="primary" type="submit">
            Save Changes
          </Button>
        </Form>
      </div>
    </>
  );
}
