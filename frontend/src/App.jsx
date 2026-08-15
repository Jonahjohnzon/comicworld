import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import ComicDetail from "./pages/ComicDetail";
import Reader from "./pages/Reader";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/comic/:slug" element={<ComicDetail />} />
        <Route path="/comic/:slug/chapter/:chapterNum" element={<Reader />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
        <span className="nav-icon">⌂</span>
        Library
      </NavLink>
      <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
        <span className="nav-icon">✎</span>
        Admin
      </NavLink>
    </nav>
  );
}
