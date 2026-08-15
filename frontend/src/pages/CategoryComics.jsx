import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
      <Link to="/categories" className="tag-chip category-chip" style={{ marginBottom: 12, display: "inline-flex" }}>
        ← All categories
      </Link>
      <div className="section-label">{tag}</div>

      {error && <div className="empty-state">{error}</div>}
      {!error && comics === null && <div className="spinner" />}
      {!error && comics !== null && comics.length === 0 && (
        <div className="empty-state">No comics found in "{tag}".</div>
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