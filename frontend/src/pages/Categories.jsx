// Categories.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

// Map a comic count to a visual weight bucket — more comics, bigger/louder chip.
// This is the whole point of the redesign: size = signal, not decoration.
function weightFor(count, max) {
  if (max <= 1) return 0;
  const ratio = count / max;
  if (ratio > 0.7) return 3;
  if (ratio > 0.4) return 2;
  if (ratio > 0.15) return 1;
  return 0;
}

export default function Categories() {
  const [tags, setTags] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTags(50)
      .then((data) => setTags(data.tags || []))
      .catch((e) => setError(e.message));
  }, []);

  const maxCount = tags && tags.length ? Math.max(...tags.map((t) => t.count)) : 0;

  return (
    <div>
      <div className="category-hero halftone">
        <div className="category-hero-eyebrow">Browse</div>
        <div className="category-hero-title">Categories</div>
        {tags && tags.length > 0 && (
          <div className="category-hero-sub">{tags.length} genres, sorted by volume</div>
        )}
      </div>

      {error && <div className="empty-state">Couldn't load the shelves. {error}</div>}

      {!error && tags === null && (
        <div className="tag-row">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="chip-skeleton" style={{ width: 60 + (i % 4) * 20 }} />
          ))}
        </div>
      )}

      {!error && tags !== null && tags.length === 0 && (
        <div className="empty-state">
          <h3>Nothing filed yet</h3>
          The archive's empty — check back once titles get tagged.
        </div>
      )}

      {!error && tags && tags.length > 0 && (
        <div className="tag-row">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              to={`/category/${encodeURIComponent(tag)}`}
              className="tag-chip category-chip"
              data-weight={weightFor(count, maxCount)}
            >
              {tag}
              <span className="tag-count">{count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}