import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { showBackButton } from "../telegram";

export default function ComicDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [comic, setComic] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getComic(slug)
      .then((data) => setComic(data.comic))
      .catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    const cleanup = showBackButton(() => navigate(-1));
    return cleanup;
  }, [navigate]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!comic) return <div className="spinner" />;

  const chapters = [...(comic.chapters || [])].sort((a, b) => a.number - b.number);

  return (
    <div>
      <div className="detail-hero halftone">
        <div className="detail-hero-row">
          <div className="detail-cover">
            <img src={comic.thumbnail} alt={comic.title} />
          </div>
          <div>
            <h1 className="detail-title">{comic.title}</h1>
            <div className="detail-tags">
              {(comic.tags || []).map((t) => (
                <span key={t} className="tag-chip">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        {comic.description && <p className="detail-desc">{comic.description}</p>}
      </div>

      <div className="section-label">Chapters ({chapters.length})</div>
      <div className="chapter-list">
        {chapters.length === 0 && <div className="empty-state">No chapters uploaded yet.</div>}
        {chapters
          .slice()
          .reverse()
          .map((ch) => (
            <Link key={ch.number} to={`/comic/${slug}/chapter/${ch.number}`} className="chapter-row">
              <span className="chapter-num">{String(ch.number).padStart(2, "0")}</span>
              <span className="chapter-name">{ch.title || `Chapter ${ch.number}`}</span>
              <span className="chapter-meta">{(ch.pages || []).length}p</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
