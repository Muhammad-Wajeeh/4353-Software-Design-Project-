// src/Pages/Logout.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // 🔹 Clear everything related to user session
    localStorage.removeItem("token");
    localStorage.removeItem("vh_sidebar_collapsed");

    // legacy / older keys
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");

    // new keys set in Login.jsx
    localStorage.removeItem("vh_userId");
    localStorage.removeItem("vh_username");

    // Small delay just for UX before redirect
    const timer = setTimeout(() => {
      // notify anything listening (useAuth hook, Sidebar, etc.)
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("auth-changed"));

      navigate("/login"); // navigate without reloading app
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
