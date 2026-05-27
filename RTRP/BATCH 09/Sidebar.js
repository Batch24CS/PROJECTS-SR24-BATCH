import React from "react";

import {
  useNavigate
} from "react-router-dom";

function Sidebar() {

  const navigate = useNavigate();

  const handleLogout = () => {

    localStorage.removeItem("farmerData");

    navigate("/");
  };

  return (

    <div className="sidebar">

      <h2>🌱 Agro AI</h2>

      <ul>

        <li
          onClick={() => navigate("/dashboard")}
        >
          🏠 Dashboard
        </li>

        <li
          onClick={() => navigate("/weather")}
        >
          🌦 Weather
        </li>

        <li
          onClick={() => navigate("/crops")}
        >
          🌾 Crops
        </li>

        <li
          onClick={() => navigate("/market")}
        >
          📈 Market
        </li>

        <li
          onClick={() => navigate("/schemes")}
        >
          🏛 Schemes
        </li>

        <li onClick={handleLogout}>

          🚪 Logout

        </li>

      </ul>

    </div>
  );
}

export default Sidebar;