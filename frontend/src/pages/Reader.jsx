import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, imageUrl } from "../api";
import { showBackButton } from "../telegram";
import AdSlot from "../components/AdSlot";

export default function Reader() {
  const { slug, chapterNum } = useParams();
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
    const cleanup = showBackButton(() => navigate(`/comic/${slug}`));
    return cleanup;
  }, [navigate, slug]);

  // Scroll to top whenever the chapter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterNum]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!comic) return <div className="spinner" />;

  const chapters = [...(comic.chapters || [])].sort((a, b) => a.number - b.number);
  const currentIndex = chapters.findIndex((c) => String(c.number) === String(chapterNum));
  const chapter = chapters[currentIndex];

  if (!chapter) return <div className="empty-state">Chapter not found.</div>;

  const nextChapter = chapters[currentIndex + 1];
  const prevChapter = chapters[currentIndex - 1];
  const pages = [...(chapter.pages || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="reader">
      <div className="reader-topbar">
        <Link to={`/comic/${slug}`} className="reader-title">
          {comic.title}
        </Link>
        <span className="reader-title">Ch. {chapter.number}</span>
      </div>

      {pages.map((p, i) => (
        <div key={p.fileId}>
          <img className="reader-page" src={imageUrl(p.fileId)} alt={`Page ${i + 1}`} loading="lazy" />
          {/* Ad every 6 pages keeps it unobtrusive without breaking reading flow */}
          {(i + 1) % 6 === 0 && i !== pages.length - 1 && <AdSlot />}
        </div>
      ))}

      <div className="reader-end">
        <p>End of Chapter {chapter.number}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          {prevChapter && (
            <button className="btn btn-ghost" onClick={() => navigate(`/comic/${slug}/chapter/${prevChapter.number}`)}>
              ← Prev
            </button>
          )}
          {nextChapter ? (
            <button className="btn btn-primary" onClick={() => navigate(`/comic/${slug}/chapter/${nextChapter.number}`)}>
              Next Chapter →
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={() => navigate(`/comic/${slug}`)}>
              Back to comic
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
