import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Sidebar from "./Sidebar";

/** Safe decode (optional) to guard /login for already-authed users */
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
function isTokenValid(token) {
  if (!token) return false;
  const d = decodeJwt(token);
  if (!d?.exp) return true;
  return d.exp > Math.floor(Date.now() / 1000);
}

/**
 * Props kept for backwards-compat with your App.jsx
 * If they aren't passed, we use local component state.
 */
export default function Login({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
}) {
  const navigate = useNavigate();

  // Fallback local state if props aren't supplied
  const [u, setU] = useState(loginUsername || "");
  const [p, setP] = useState(loginPassword || "");
  const usePropState = typeof setLoginUsername === "function" && typeof setLoginPassword === "function";

  const username = usePropState ? loginUsername : u;
  const password = usePropState ? loginPassword : p;
  const setUsername = usePropState ? setLoginUsername : setU;
  const setPassword = usePropState ? setLoginPassword : setP;

  const [submitting, setSubmitting] = useState(false);
  const [redirectToHome, setRedirectToHome] = useState(false);
  const [error, setError] = useState("");

  const authed = useMemo(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return isTokenValid(t);
  }, []);

  useEffect(() => {
    if (authed) {
      // Already logged in? push away from /login.
      navigate("/");
    }
  }, [authed, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const body = { username, password };
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Login failed (${res.status})`);
      }

      const data = await res.json();
      if (!data?.token) throw new Error("No token returned from server.");

      localStorage.setItem("token", data.token);
      // Tell listeners (Sidebar, Inbox badge, etc.)
      window.dispatchEvent(new Event("storage"));

      setRedirectToHome(true);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (redirectToHome) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {/* ✅ Limited nav shows Home/Browse/Login/Register for logged-out users */}
      <Sidebar />

      <div className="container d-flex justify-content-center" style={{ maxWidth: 520 }}>
        <Form className="w-100 mt-5" onSubmit={onSubmit}>
          <h3 className="text-center mb-4">Log In</h3>

          <Form.Group className="mb-3" controlId="loginUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="loginPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3 d-flex align-items-center gap-2" controlId="checkMeOut">
            <Form.Check type="checkbox" />
            <Form.Label className="m-0">Check me out</Form.Label>
          </Form.Group>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <Form.Group className="mb-4">
            <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </Form.Group>

          <div className="text-center">
            <Link className="loginAndRegisterLinks" to="/register">
              Don&apos;t Have An Account?
              <br />
              Create Account Instead
            </Link>
          </div>
        </Form>
      </div>
    </>
  );
}
