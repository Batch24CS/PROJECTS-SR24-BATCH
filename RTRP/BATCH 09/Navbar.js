import React from "react";
import { Link } from "react-router-dom";

function Navbar() {

  return (
    <nav className="navbar">

      <h2>🌱 Smart Crop Advisory</h2>

      <div className="nav-links">

        <Link to="/">Home</Link>

        <Link to="/dashboard">Dashboard</Link>

        <Link to="/market">Market</Link>

        <Link to="/weather">Weather</Link>

        <Link to="/schemes">Schemes</Link>

        <Link to="/login">Login</Link>

      </div>

    </nav>
  );
}

export default Navbar;