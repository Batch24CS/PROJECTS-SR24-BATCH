import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    soil: "",
    land: "",
    location: ""
  });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {

    e.preventDefault();

    localStorage.setItem(
      "farmerData",
      JSON.stringify(formData)
    );

    navigate("/dashboard");
  };

  return (
    <div className="login-page">

      <div className="login-box">

        <h1>🌱 Farmer Login</h1>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="soil"
            placeholder="Soil Type"
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="land"
            placeholder="Land Area (Acres)"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            onChange={handleChange}
            required
          />

          <button type="submit">
            Continue
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;