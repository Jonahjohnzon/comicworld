import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, imageUrl } from "../api";
import { showBackButton } from "../telegram";
import ImageZoomViewer from "../components/ImageZoomViewer";
import { showInterstitial } from "../ads/monetag";

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

  if (error) return <div className="empty-state">{error}</div>;
  if (!comic) return <div className="spinner" />;

  const chapters = [...(comic.chapters || [])].sort((a, b) => a.number - b.number);
  const currentIndex = chapters.findIndex((c) => String(c.number) === String(chapterNum));
  const chapter = chapters[currentIndex];

  if (!chapter) return <div className="empty-state">Chapter not found.</div>;

  const nextChapter = chapters[currentIndex + 1];
  const prevChapter = chapters[currentIndex - 1];
  const pages = [...(chapter.pages || [])].sort((a, b) => a.order - b.order);

  function handlePageChange(i) {
    if ((i + 1) % 7 === 0) showInterstitial();
  }

  function handlePastEnd() {
    if (nextChapter) {
      showInterstitial(); // chapter transition
      navigate(`/comic/${slug}/chapter/${nextChapter.number}`);
    } else {
      navigate(`/comic/${slug}`); // last chapter, last page — back to detail
    }
  }

  function handlePastStart() {
    if (prevChapter) {
      navigate(`/comic/${slug}/chapter/${prevChapter.number}`);
    }
    // else: already at chapter 1 page 1 — do nothing
  }

  return (
    <ImageZoomViewer
      urls={pages.map((p) => imageUrl(p.fileId))}
      initialIndex={0}
      title={`${comic.title} · Ch. ${chapter.number}`}
      onClose={() => navigate(`/comic/${slug}`)}
      onPageChange={handlePageChange}
      onPastEnd={handlePastEnd}
      onPastStart={handlePastStart}
    />
  );
}