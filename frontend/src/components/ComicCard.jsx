import { useEffect, useState } from "react";
import { api } from "../api";
import ComicCard from "../components/ComicCard";

export default function Home() {
  const [comics, setComics] = useState(null);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [error, setError] = useState("");

  // Popular tags load once — the browse row doesn't change as the user filters
  useEffect(() => {
    api
      .getTags(12)
      .then((data) => setTags(data.tags || []))
      .catch(() => {}); // non-critical — just don't show the row
  }, []);

  useEffect(() => {
    setComics(null);
    api
      .getComics({ tag: activeTag || undefined })
      .then((data) => setComics(data.comics || []))
      .catch((e) => setError(e.message));
  }, [activeTag]);

  function toggleTag(tag) {
    setActiveTag((current) => (current === tag ? null : tag));
  }

  return (
    <div>
      {tags.length > 0 && (
        <>
          <div className="section-label">Browse by category</div>
          <div className="tag-row">
            <button
              className={`tag-chip category-chip${activeTag === null ? " active" : ""}`}
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {tags.map(({ tag, count }) => (
              <button
                key={tag}
                className={`tag-chip category-chip${activeTag === tag ? " active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
                <span className="tag-count">{count}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="section-label">{activeTag ? `${activeTag} comics` : "Library"}</div>

      {error && <div className="empty-state">{error}</div>}
      {!error && comics === null && <div className="spinner" />}
      {!error && comics !== null && comics.length === 0 && (
        <div className="empty-state">No comics found{activeTag ? ` in "${activeTag}"` : ""}.</div>
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