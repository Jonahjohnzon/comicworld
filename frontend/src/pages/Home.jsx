import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import ComicCard from "../components/ComicCard";
import AdSlot from "../components/AdSlot";

export default function Home() {
  const [comics, setComics] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const load = useCallback((q) => {
    api
      .listComics(q ? { q } : {})
      .then((data) => setComics(data.comics))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  return (
    <div>
      <header className="topbar">
        <div className="logo">
          Ink<span>feed</span>
        </div>
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Search comics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      {error && <div className="empty-state">{error}</div>}

      {comics === null && !error && <div className="spinner" />}

      {comics && comics.length === 0 && (
        <div className="empty-state">
          <h3>No comics yet</h3>
          <p>Check back soon — new titles are added regularly.</p>
        </div>
      )}

      {comics && comics.length > 0 && (
        <>
          <div className="grid">
            {comics.slice(0, 6).map((c) => (
              <ComicCard key={c.slug} comic={c} />
            ))}
          </div>
          {comics.length > 6 && <AdSlot />}
          <div className="grid">
            {comics.slice(6).map((c) => (
              <ComicCard key={c.slug} comic={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
