import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  redirect,
  Navigate,
} from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

function Register({
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
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  const onSubmitForm = async (e) => {
    e.preventDefault(); // prevent full page reload

    try {
      const body = {
        memberFirstName: memberFirstName,
        memberLastName: memberLastName,
        username: username,
        password: password,
        email: email,
      };

      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        setRedirectToLogin(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (redirectToLogin) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicCheckbox">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="name"
            placeholder="Enter first name"
            onChange={(e) => setMemberFirstName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicLastName">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="name"
            placeholder="Enter last name"
            required
            onChange={(e) => {
              setMemberLastName(e.target.value);
            }}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <Form.Text className="text-muted">
            We'll never share your email with anyone else.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit" onClick={onSubmitForm}>
          Submit
        </Button>
      </Form>
    </>
  );
}

export default Register;
