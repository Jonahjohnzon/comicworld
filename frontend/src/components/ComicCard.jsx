// ComicCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ComicCard({ comic }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const initial = comic.title?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <Link to={`/comic/${comic.slug}`} className="comic-card">
      <div className="comic-cover">
        {comic.status === "completed" && <span className="comic-badge">Done</span>}

        {!failed && comic.thumbnail && (
          <img
            src={comic.thumbnail}
            alt=""
            loading="lazy"
            className={loaded ? "loaded" : ""}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}

        {(failed || !comic.thumbnail) && (
          <div className="comic-cover-fallback halftone">
            <span>{initial}</span>
          </div>
        )}

        <div className="comic-cover-scrim" />
        <div className="comic-cover-title">{comic.title}</div>
      </div>
    </Link>
  );
}