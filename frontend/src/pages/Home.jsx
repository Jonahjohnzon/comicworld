// Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import ComicCard from "../components/ComicCard";

export default function Home() {
  const [comics, setComics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listComics()
      .then((data) => setComics(data.comics || []))
      .catch((e) => setError(e.message));
  }, []);

  const [spotlight, ...rest] = comics || [];

  return (
    <div>
      {error && <div className="empty-state">Couldn't load the library. {error}</div>}

      {!error && comics === null && (
        <>
          <div className="spotlight-skeleton" />
          <div className="comic-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-skeleton" />
            ))}
          </div>
        </>
      )}

      {!error && comics !== null && comics.length === 0 && (
        <div className="empty-state">
          <h3>The shelves are empty</h3>
          Nothing's been published yet — check back soon.
        </div>
      )}

      {!error && spotlight && (
        <>
          <Link to={`/comic/${spotlight.slug}`} className="spotlight halftone">
            <div className="spotlight-cover">
              <img src={spotlight.thumbnail} alt="" />
              <div className="spotlight-scrim" />
            </div>
            <div className="spotlight-body">
              <div className="spotlight-eyebrow">Cover story</div>
              <div className="spotlight-title">{spotlight.title}</div>
              {spotlight.tags && spotlight.tags.length > 0 && (
                <div className="spotlight-tags">
                  {spotlight.tags.slice(0, 3).map((t) => (
                    <span key={t} className="tag-chip">{t}</span>
                  ))}
                </div>
              )}
              <span className="btn btn-primary spotlight-cta">Start reading</span>
            </div>
          </Link>

          {rest.length > 0 && (
            <>
              <div className="section-label">All titles</div>
              <div className="comic-grid">
                {rest.map((comic) => (
                  <ComicCard key={comic.slug} comic={comic} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}