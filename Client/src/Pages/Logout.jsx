import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear everything related to user session
    localStorage.removeItem("token");
    localStorage.removeItem("vh_sidebar_collapsed");

    // Optionally clear other persisted user data if used
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");

    // Small delay just for UX before redirect
    const timer = setTimeout(() => {
        window.dispatchEvent(new Event("storage")); // tell other components token changed
        navigate("/login"); // navigate without reloading the whole app
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <Spinner animation="border" role="status" />
      <div className="mt-3">Logging out...</div>
    </div>
  );
}
