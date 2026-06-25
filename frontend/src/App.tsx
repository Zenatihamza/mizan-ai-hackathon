import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./modules/Home";
import Scanner from "./modules/scanner/Scanner";
import GPS from "./modules/gps/GPS";
import RPG from "./modules/rpg/RPG";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/gps" element={<GPS />} />
        <Route path="/rpg" element={<RPG />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
