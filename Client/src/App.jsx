import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ProfileManagement from "./Pages/ProfileManagement";
import EventManagement from "./Pages/EventManagement";
import VolunteerHistory from "./Pages/VolunteerHistory";
import VolunteerMatching from "./Pages/VolunteerMatching";

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Router>
        <Routes>
          <Route path="/Login" element={<Login></Login>} />
          <Route path="/Register" element={<Register></Register>} />
          <Route
            path="/ProfileManagement"
            element={<ProfileManagement></ProfileManagement>}
          />

          <Route
            path="/EventManagement"
            element={<EventManagement></EventManagement>}
          />

          <Route
            path="/VolunteerHistory"
            element={<VolunteerHistory></VolunteerHistory>}
          />
          <Route
            path="/VolunteerMatching"
            element={<VolunteerMatching></VolunteerMatching>}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
