import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Sidebar from "./Sidebar";

/** Optional helpers so we can guard against visiting /register when already authed */
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
 * Props kept for backwards-compat with your App.jsx.
 * If any setter props are missing, we use local state so this file still works standalone.
 */
export default function Register({
  memberFirstName,
  setMemberFirstName,
  memberLastName,
  setMemberLastName,
  email,
  setEmail,
  username,
  setUsername,
  password,
  setPassword,
}) {
  const navigate = useNavigate();

  // Fallback local state if parent didn't pass setters
  const usePropState =
    typeof setMemberFirstName === "function" &&
    typeof setMemberLastName === "function" &&
    typeof setEmail === "function" &&
    typeof setUsername === "function" &&
    typeof setPassword === "function";

  const [fnLocal, setFnLocal] = useState(memberFirstName || "");
  const [lnLocal, setLnLocal] = useState(memberLastName || "");
  const [emLocal, setEmLocal] = useState(email || "");
  const [unLocal, setUnLocal] = useState(username || "");
  const [pwLocal, setPwLocal] = useState(password || "");

  const firstName = usePropState ? memberFirstName : fnLocal;
  const lastName = usePropState ? memberLastName : lnLocal;
  const emailVal = usePropState ? email : emLocal;
  const usernameVal = usePropState ? username : unLocal;
  const passwordVal = usePropState ? password : pwLocal;

  const setFirstName = usePropState ? setMemberFirstName : setFnLocal;
  const setLastName = usePropState ? setMemberLastName : setLnLocal;
  const setEmailVal = usePropState ? setEmail : setEmLocal;
  const setUsernameVal = usePropState ? setUsername : setUnLocal;
  const setPasswordVal = usePropState ? setPassword : setPwLocal;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  const authed = useMemo(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return isTokenValid(t);
  }, []);

  // 🧈 UX sugar: if already authed, show a quick notice then redirect home
  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(() => navigate("/"), 1200);
    return () => clearTimeout(t);
  }, [authed, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Match server’s expected keys (see authRoutes.js)
      const body = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        username: usernameVal?.trim(),
        email: emailVal?.trim(),
        password: passwordVal,
      };

      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Registration failed (${res.status})`);
      }

      // After account creation, send users to Login:
      setRedirectToLogin(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (redirectToLogin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* ✅ Limited, auth-aware sidebar (Home/Browse visible when logged out) */}
      <Sidebar />

      {/* If already logged in, show brief toast-like notice and spinner before redirect */}
      {authed ? (
        <div className="container d-flex flex-column justify-content-center align-items-center" style={{ maxWidth: 720, minHeight: "50vh" }}>
          <Alert variant="info" className="w-100 text-center">
            You’re already logged in — redirecting you to your dashboard…
          </Alert>
          <Spinner animation="border" role="status" className="mt-2" />
        </div>
      ) : (
        <div className="container d-flex justify-content-center" style={{ maxWidth: 620 }}>
          <Form className="w-100 mt-5" onSubmit={onSubmit}>
            <h3 className="text-center mb-4">Create Account</h3>

            <div className="row">
              <div className="col-12 col-md-6">
                <Form.Group className="mb-3" controlId="formBasicFirstName">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </Form.Group>
              </div>
              <div className="col-12 col-md-6">
                <Form.Group className="mb-3" controlId="formBasicLastName">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="name@example.com"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                required
                autoComplete="email"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Choose a username"
                value={usernameVal}
                onChange={(e) => setUsernameVal(e.target.value)}
                required
                autoComplete="username"
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Create a password"
                value={passwordVal}
                onChange={(e) => setPasswordVal(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
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
              <Link className="loginAndRegisterLinks" to="/login">
                Already Have An Account?
                <br />
                Login Instead
              </Link>
            </div>
          </Form>
        </div>
      )}
    </>
  );
}
