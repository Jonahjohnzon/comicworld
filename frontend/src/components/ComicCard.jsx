import { Link } from "react-router-dom";

export default function ComicCard({ comic }) {
  return (
    <Link to={`/comic/${comic.slug}`} className="comic-card">
      <div className="comic-cover">
        {comic.status === "completed" && <span className="comic-badge">Done</span>}
        <img src={comic.thumbnail} alt={comic.title} loading="lazy" />
      </div>
      <div className="comic-title">{comic.title}</div>
    </Link>
  );
}
