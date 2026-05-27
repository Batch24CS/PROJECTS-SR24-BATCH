import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import "./styles/main.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Weather from "./pages/Weather";
import Crops from "./pages/Crops";
import Market from "./pages/Market";
import Schemes from "./pages/Schemes";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/weather"
          element={<Weather />}
        />

        <Route
          path="/crops"
          element={<Crops />}
        />

        <Route
          path="/market"
          element={<Market />}
        />

        <Route
          path="/schemes"
          element={<Schemes />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;