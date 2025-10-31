import axios from "axios";
import React, { useEffect, useState } from "react";
import { Form, Button, Badge } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Sidebar from "./Sidebar";

const prettyDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
});
const fmtPretty = (iso) => {
  try {
    return prettyDateFormatter.format(new Date(iso));
  } catch {
    return iso || "";
  }
};

const fmt = (d) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : "";

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

  const [picked, setPicked] = useState(null);
  const [availability, setAvailability] = useState([]);

  // ----- Fetch once on mount (✅ now uses numeric id from JWT) -----
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    const decoded = token ? decodeJwt(token) : null;
    const numericId = decoded?.id; // your JWT shows id like "10"

    if (!numericId) {
      throw new Error("Not authenticated");
    }

    const { data } = await axios.get(`http://localhost:5000/profile/${numericId}`);
    const u = data.user || {};

    setFullName(u.fullname ?? u.name ?? "");
    setAddress1(u.address1 ?? "");
    setAddress2(u.address2 ?? "");
    setCity(u.city ?? "");
    setStateUS(u.state ?? "");
    setZip(u.zip ?? "");
    setSkillsSel(Array.isArray(u.skills) ? u.skills : []);
    setPreferences(u?.preferences ?? u?.preferences?.notes ?? "");
    setMaxDistance(
      typeof u?.maxdistancemfromevents === "number"
        ? u.maxdistancemfromevents
        : typeof u?.preferences?.maxDistanceMiles === "number"
        ? u.preferences.maxDistanceMiles
        : ""
    );

    if (u?.availability?.dates && Array.isArray(u.availability.dates)) {
      setAvailability(u.availability.dates);
    } else {
      setAvailability([]);
    }
  };

  useEffect(() => {
    fetchProfile().catch((e) => console.error("Load profile failed", e));
  }, []);

  const addDate = () => {
    if (!picked) return;
    const iso = fmt(picked);
    setAvailability((arr) => (arr.includes(iso) ? arr : [...arr, iso].sort()));
    setPicked(null);
  };

  const removeDate = (iso) => setAvailability((arr) => arr.filter((d) => d !== iso));

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
    const datesValid = availability.length > 0;
    setValidated(true);
    if (!(baseValid && datesValid)) return;

    const body = {
      name: fullName.trim(),
      address1: address1.trim(),
      address2: address2.trim(),
      city: city.trim(),
      state: stateUS.trim(),
      zip: zip.trim(),
      skills: skillsSel,
      availability: { dates: availability },
      preferences: {
        notes: preferences,
        maxDistanceMiles:
          maxDistance === ""
            ? undefined
            : Number.isFinite(Number(maxDistance))
            ? Number(maxDistance)
            : undefined,
      },
    };

    try {
      const token = localStorage.getItem("token");
      const decoded = token ? decodeJwt(token) : null;
      const numericId = decoded?.id;
      if (!numericId) throw new Error("Not authenticated");

      await axios.put(`http://localhost:5000/profile/${numericId}`, body);
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
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="text-muted small">Name</div>
                  <div className="fs-5 fw-semibold">{fullName || "—"}</div>
                </div>
              </div>

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
                <div className="col-12 col-md-4">{infoItem("State", stateUS)}</div>
                <div className="col-12 col-md-4">{infoItem("Zip", zip)}</div>
              </div>

              <div className="mb-3">
                <div className="text-muted small">Skills</div>
                {skillsSel?.length ? (
                  <div className="mt-1 d-flex flex-wrap gap-2">
                    {skillsSel.map((s) => (
                      <span key={s} className="badge rounded-pill text-bg-secondary">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="fw-semibold">—</div>
                )}
              </div>

              <div className="row mb-3">
                <div className="col-12 col-md-8">
                  {infoItem("Preferences (notes)", preferences)}
                </div>
                <div className="col-12 col-md-4">
                  {infoItem(
                    "Max Distance (miles)",
                    maxDistance !== "" && maxDistance !== null ? maxDistance : "—"
                  )}
                </div>
              </div>

              <div>
                <div className="text-muted small">Availability (dates)</div>
                {availability?.length ? (
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {availability.map((d) => (
                      <span key={d} className="badge rounded-pill text-bg-light border">
                        {fmtPretty(d)}
                      </span>
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
          {/* keep the rest of your form unchanged */}
          {/* ... your existing fields and UI ... */}
          {/* Submit */}
          <Button type="submit" variant="primary">
            Save
          </Button>
        </Form>
      </div>
    </>
  );
}
