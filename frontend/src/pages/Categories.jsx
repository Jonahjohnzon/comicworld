import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Categories() {
  const [tags, setTags] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTags(50) // show more here than a homepage row would — this IS the browse page
      .then((data) => setTags(data.tags || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="section-label">Categories</div>

      {error && <div className="empty-state">{error}</div>}
      {!error && tags === null && <div className="spinner" />}
      {!error && tags !== null && tags.length === 0 && (
        <div className="empty-state">No categories yet.</div>
      )}

      {!error && tags && tags.length > 0 && (
        <div className="tag-row">
          {tags.map(({ tag, count }) => (
            <Link key={tag} to={`/category/${encodeURIComponent(tag)}`} className="tag-chip category-chip">
              {tag}
              <span className="tag-count">{count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}