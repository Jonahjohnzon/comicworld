import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import CategoryComics from "./pages/CategoryComics";
import ComicDetail from "./pages/ComicDetail";
import Reader from "./pages/Reader";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:tag" element={<CategoryComics />} />
        <Route path="/comic/:slug" element={<ComicDetail />} />
        <Route path="/comic/:slug/chapter/:chapterNum" element={<Reader />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11.5L12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth={active ? 2.6 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function CategoryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.6 : 2} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.6 : 2} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.6 : 2} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.6 : 2} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
    </svg>
  );
}

function AdminIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth={active ? 2.6 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function BottomNav() {
  const location = useLocation();
  const onHomeTab = location.pathname === "/";
  const onCategoryTab = location.pathname.startsWith("/categor");
  const onAdminTab = location.pathname.startsWith("/admin");

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={`nav-item${onHomeTab ? " active" : ""}`}>
        <span className="nav-indicator" />
        <span className="nav-icon"><HomeIcon active={onHomeTab} /></span>
        <span className="nav-label">All</span>
      </NavLink>
      <NavLink to="/categories" className={`nav-item${onCategoryTab ? " active" : ""}`}>
        <span className="nav-indicator" />
        <span className="nav-icon"><CategoryIcon active={onCategoryTab} /></span>
        <span className="nav-label">Category</span>
      </NavLink>
      <NavLink to="/admin" className={`nav-item${onAdminTab ? " active" : ""}`}>
        <span className="nav-indicator" />
        <span className="nav-icon"><AdminIcon active={onAdminTab} /></span>
        <span className="nav-label">Admin</span>
      </NavLink>
    </nav>
  );
}