import React from "react";
import { Link } from "react-router-dom";

function Home() {

  return (
    <div className="home">

      <div className="hero">

        <h1>🌱 Smart Crop Advisory System</h1>

        <p>
          AI Powered Farming Assistant for Smart Agriculture
        </p>

        <Link to="/dashboard">
          <button>Open Dashboard</button>
        </Link>

      </div>

      <div className="features">

        <div className="feature-card">
          <h2>🌦 Weather Reports</h2>
          <p>Live farming weather updates.</p>
        </div>

        <div className="feature-card">
          <h2>🌾 Crop Recommendation</h2>
          <p>Best crops based on soil.</p>
        </div>

        <div className="feature-card">
          <h2>📈 Market Prices</h2>
          <p>Current crop market prices.</p>
        </div>

      </div>

    </div>
  );
}

export default Home;