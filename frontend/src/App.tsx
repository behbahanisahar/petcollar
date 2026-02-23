import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Demo from "./pages/Demo";
import Admin from "./pages/Admin";
import Collar from "./pages/Collar";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/p/:id" element={<Collar />} />
    </Routes>
  );
}
