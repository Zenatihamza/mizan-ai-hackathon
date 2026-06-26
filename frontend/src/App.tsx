import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./modules/Home";
import Scanner from "./modules/scanner/Scanner";
import GPS from "./modules/gps/GPS";
import RPG from "./modules/rpg/RPG";
import Chat from "./modules/chat/Chat";
import Emergency from "./modules/emergency/Emergency";
import Booklet from "./modules/booklet/Booklet";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/gps" element={<GPS />} />
        <Route path="/rpg" element={<RPG />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/booklet" element={<Booklet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
