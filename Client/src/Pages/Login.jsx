import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

function Login({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
}) {
  const [redirectToHome, setRedirectToHome] = useState(false);

  const onSubmitForm = async (e) => {
    e.preventDefault(); // prevent full page reload

    try {
      const body = {
        username: loginUsername,
        password: loginPassword,
      };

      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log(response.status);

      if (response.ok) {
        setRedirectToHome(true);
        const data = await response.json();
        localStorage.setItem("token", data.token);
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (redirectToHome) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="Username"
            placeholder="Enter Username"
            required
            onChange={(e) => setLoginUsername(e.target.value)}
          />
          <Form.Text className="text-muted"></Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setLoginPassword(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicCheckbox">
          <Form.Check type="checkbox" label="Check me out" />
        </Form.Group>

        <Form.Group>
          <Button variant="primary" type="submit" onClick={onSubmitForm}>
            Submit
          </Button>
        </Form.Group>

        <a className="loginAndRegisterLinks" href="/register">
          {" "}
          Don't Have An Account? <br></br>Create Account Instead
        </a>
      </Form>
    </>
  );
}

export default Login;
