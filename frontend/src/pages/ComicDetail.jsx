import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { showBackButton } from "../telegram";

const CHAPTERS_PER_PAGE = 10;

export default function ComicDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [comic, setComic] = useState(null);
  const [error, setError] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [page, setPage] = useState(1);

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

  // Reset to page 1 and collapse the description whenever the comic changes
  useEffect(() => {
    setPage(1);
    setDescExpanded(false);
  }, [slug]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!comic) return <div className="spinner" />;

  const chapters = [...(comic.chapters || [])].sort((a, b) => a.number - b.number).reverse();
  const totalPages = Math.max(1, Math.ceil(chapters.length / CHAPTERS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * CHAPTERS_PER_PAGE;
  const pageChapters = chapters.slice(pageStart, pageStart + CHAPTERS_PER_PAGE);

  function goToPage(p) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // Scroll the chapter list back into view so paging doesn't leave the user
    // staring at the bottom of a list that just changed above them
    document.querySelector(".section-label")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
        {comic.description && (
          <div className="detail-desc-wrap">
            <p className={`detail-desc ${descExpanded ? "" : "clamp-3"}`}>{comic.description}</p>
            <button className="desc-toggle" onClick={() => setDescExpanded((v) => !v)}>
              {descExpanded ? "Show less" : "Read more"}
            </button>
          </div>
        )}
      </div>

      <div className="section-label">Chapters ({chapters.length})</div>
      <div className="chapter-list">
        {chapters.length === 0 && <div className="empty-state">No chapters uploaded yet.</div>}
        {pageChapters.map((ch) => (
          <Link key={ch.number} to={`/comic/${slug}/chapter/${ch.number}`} className="chapter-row">
            <span className="chapter-num">{String(ch.number).padStart(2, "0")}</span>
            <span className="chapter-name">{ch.title || `Chapter ${ch.number}`}</span>
            <span className="chapter-meta">{(ch.pages || []).length}p</span>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            ← Prev
          </button>
          <span className="pagination-label">
            Page {currentPage} / {totalPages}
          </span>
          <button className="btn btn-ghost" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}