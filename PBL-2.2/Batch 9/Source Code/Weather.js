import React from "react";

function Weather() {

  return (

    <div className="dashboard">

      <h1>🌦 Live Weather Report</h1>

      <div className="dash-card">

        <p>Temperature: 30°C</p>

        <p>Humidity: 65%</p>

        <p>Condition: Sunny</p>

        <p>Wind Speed: 12 km/h</p>

      </div>

    </div>
  );
}

export default Weather;