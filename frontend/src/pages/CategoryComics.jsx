// CategoryComics.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { showBackButton } from "../telegram";
import ComicCard from "../components/ComicCard";

export default function CategoryComics() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [comics, setComics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setComics(null);
    api
      .listComics({ tag })
      .then((data) => setComics(data.comics || []))
      .catch((e) => setError(e.message));
  }, [tag]);

  useEffect(() => {
    const cleanup = showBackButton(() => navigate("/categories"));
    return cleanup;
  }, [navigate]);

  return (
    <div>
      <div className="category-hero halftone">
        <button className="category-hero-back" onClick={() => navigate("/categories")}>
          ← All categories
        </button>
        <div className="category-hero-title">{tag}</div>
        {comics && comics.length > 0 && (
          <div className="category-hero-sub">
            {comics.length} {comics.length === 1 ? "title" : "titles"}
          </div>
        )}
      </div>

      {error && <div className="empty-state">Couldn't load this shelf. {error}</div>}
      {!error && comics === null && <div className="spinner" />}
      {!error && comics !== null && comics.length === 0 && (
        <div className="empty-state">
          <h3>Nothing filed here</h3>
          No comics are tagged "{tag}" yet.
        </div>
      )}

      {!error && comics && comics.length > 0 && (
        <div className="comic-grid">
          {comics.map((comic) => (
            <ComicCard key={comic.slug} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}