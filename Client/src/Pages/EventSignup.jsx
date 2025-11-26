import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import Sidebar from "./Sidebar";

const SKILL_FIELDS = [
  ["firstAid", "First Aid"],
  ["foodService", "Food Service"],
  ["logistics", "Logistics"],
  ["teaching", "Teaching"],
  ["eventSetup", "Event Setup"],
  ["dataEntry", "Data Entry"],
  ["customerService", "Customer Service"],
];

function EventSignup() {
  const { eventName } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState("");

  const fetchEvent = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/event/${encodeURIComponent(eventName)}`
      );
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load event details.");
      navigate("/browseevents");
    }
  };
  const onClickSignUpButton = async (eventNameToBeSignedUpFor, skill) => {
    try {
      const response = await fetch(
        `http://localhost:5000/event/signup/${encodeURIComponent(
          eventNameToBeSignedUpFor
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ skill }),
        }
      );

      if (!response.ok) throw new Error("Sign Up failed");
      alert("Signed up!");
      navigate("/browseevents");
    } catch (err) {
      console.error(err);
      alert("Could not sign up.");
    }
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  if (!event) return <p>Loading...</p>;

  return (
    <>
      <Sidebar />

      <div className="d-flex justify-content-center mt-4">
        <Card style={{ width: "40rem", padding: "1.5rem" }}>
          <Card.Title className="text-center mb-3">
            Select a Position for {event.eventName}
          </Card.Title>

          <Card.Subtitle className="text-muted text-center mb-4">
            {event.eventLocation} — {(event.eventDate || "").split("T")[0]}
          </Card.Subtitle>

          <Form>
            <Form.Group>
              <Form.Label className="fw-bold">Available Positions</Form.Label>

              {SKILL_FIELDS.map(([key, label]) => {
                const total = event[key] ?? 0;
                const filled = event[key + "Filled"] ?? 0;
                const remaining = total - filled;

                if (total === 0) return null; // skill not requested at all

                return (
                  <div
                    key={key}
                    className="d-flex justify-content-between align-items-center my-2 p-2 border rounded"
                    style={{ background: "#fafafa" }}
                  >
                    <div>
                      <strong>{label}</strong>{" "}
                      <span className="text-muted">
                        {filled}/{total}
                      </span>
                    </div>

                    {remaining > 0 ? (
                      <Form.Check
                        type="radio"
                        name="skillSelect"
                        checked={selectedSkill === key}
                        onChange={() => setSelectedSkill(key)}
                        label="Choose"
                      />
                    ) : (
                      <span className="text-danger fw-bold">Full</span>
                    )}
                  </div>
                );
              })}
            </Form.Group>

            <Button
              className="mt-3"
              variant="success"
              onClick={() =>
                onClickSignUpButton(event.eventName, selectedSkill)
              }
              disabled={!selectedSkill}
            >
              Confirm Signup
            </Button>
          </Form>
        </Card>
      </div>
    </>
  );
}

export default EventSignup;
