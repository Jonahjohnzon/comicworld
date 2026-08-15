import { useEffect, useState, useRef } from "react";
import { api, imageUrl } from "../api";
import { isInsideTelegram } from "../telegram";

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadToCloudinary(file) {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    throw new Error("Cloudinary env vars are not configured (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)");
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
  return data.secure_url;
}

const emptyForm = {
  title: "",
  description: "",
  thumbnail: "",
  tags: "",
  status: "ongoing",
  chapters: [],
};

export default function Admin() {
  const [adminState, setAdminState] = useState("checking"); // checking | allowed | denied
  const [comics, setComics] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api
      .checkAdmin()
      .then((data) => setAdminState(data.isAdmin ? "allowed" : "denied"))
      .catch(() => setAdminState("denied"));
  }, []);

  useEffect(() => {
    if (adminState === "allowed") {
      api.listComics().then((data) => setComics(data.comics));
    }
  }, [adminState]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadForEdit(comicSummary) {
    // The Existing Comics list only has a summary (no full chapters/pages, just a count)
    // to keep that list fast. Fetch the real comic before populating the edit form,
    // otherwise chapters silently come through empty.
    setEditingSlug(comicSummary.slug);
    setLoadingEdit(true);
    try {
      const { comic } = await api.getComic(comicSummary.slug);
      setForm({
        title: comic.title,
        description: comic.description || "",
        thumbnail: comic.thumbnail,
        tags: (comic.tags || []).join(", "),
        status: comic.status || "ongoing",
        chapters: comic.chapters || [],
      });
      window.scrollTo(0, 0);
    } catch (err) {
      showToast(err.message);
      setEditingSlug(null);
    } finally {
      setLoadingEdit(false);
    }
  }

  function resetForm() {
    setEditingSlug(null);
    setForm(emptyForm);
  }

  async function handleThumbnailChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((f) => ({ ...f, thumbnail: url }));
    } catch (err) {
      showToast(err.message);
    } finally {
      setThumbUploading(false);
    }
  }

  function addChapter() {
    const nextNum = form.chapters.length ? Math.max(...form.chapters.map((c) => c.number)) + 1 : 1;
    setForm((f) => ({ ...f, chapters: [...f.chapters, { number: nextNum, title: "", pages: [] }] }));
  }

  function updateChapter(index, patch) {
    setForm((f) => {
      const chapters = [...f.chapters];
      chapters[index] = { ...chapters[index], ...patch };
      return { ...f, chapters };
    });
  }

  function removeChapter(index) {
    const chapter = form.chapters[index];
    const pageCount = chapter.pages?.length || 0;
    const label = chapter.title ? `"${chapter.title}"` : `Chapter ${chapter.number}`;
    if (!confirm(`Delete ${label}${pageCount ? ` and its ${pageCount} page(s)` : ""}? This can't be undone once you save.`)) {
      return;
    }
    setForm((f) => ({ ...f, chapters: f.chapters.filter((_, i) => i !== index) }));
  }

  async function handlePagesChange(e, chapterIndex) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const chapter = form.chapters[chapterIndex];
    let order = chapter.pages.length;

    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);
        const { fileId } = await api.uploadPage(base64, file.name);
        updateChapter(chapterIndex, {
          pages: [...form.chapters[chapterIndex].pages, { fileId, order: order++ }],
        });
      } catch (err) {
        showToast(`Failed to upload ${file.name}: ${err.message}`);
      }
    }
    e.target.value = "";
  }

  function removePage(chapterIndex, pageIndex) {
    const chapter = form.chapters[chapterIndex];
    const pages = chapter.pages.filter((_, i) => i !== pageIndex).map((p, i) => ({ ...p, order: i }));
    updateChapter(chapterIndex, { pages });
  }

  async function handleSave() {
    if (!form.title || !form.thumbnail) {
      showToast("Title and thumbnail are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        thumbnail: form.thumbnail,
        status: form.status,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        chapters: form.chapters,
        slug: editingSlug || undefined,
      };
      const data = await api.saveComic(payload);
      showToast(data.created ? "Comic created" : "Comic updated");
      const list = await api.listComics();
      setComics(list.comics);
      resetForm();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      await api.deleteComic(slug);
      setComics((c) => c.filter((x) => x.slug !== slug));
      if (editingSlug === slug) resetForm();
    } catch (err) {
      showToast(err.message);
    }
  }

  if (adminState === "checking") return <div className="spinner" />;

  if (adminState === "denied") {
    return (
      <div className="locked">
        <h3 style={{ color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 22 }}>Admin only</h3>
        <p>
          {isInsideTelegram
            ? "Your Telegram account isn't authorized to manage comics."
            : "Open this app inside Telegram to authenticate as admin."}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="topbar" style={{ padding: "18px 0 8px" }}>
        <div className="logo">{editingSlug ? "Edit Comic" : "New Comic"}</div>
      </div>

      <div className="field">
        <label>Title</label>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>

      <div className="field">
        <label>Tags (comma separated)</label>
        <input
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="action, fantasy, romance"
        />
      </div>

      <div className="field">
        <label>Status</label>
        <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="field">
        <label>Thumbnail</label>
        <input type="file" accept="image/*" onChange={handleThumbnailChange} disabled={thumbUploading} />
        {thumbUploading && <p style={{ color: "var(--muted)", fontSize: 12 }}>Uploading…</p>}
        {form.thumbnail && (
          <div className="thumb-preview">
            <img src={form.thumbnail} alt="thumbnail preview" />
          </div>
        )}
      </div>

      <div className="field">
        <label>Chapters</label>
        {form.chapters.map((chapter, ci) => (
          <ChapterEditor
            key={ci}
            chapter={chapter}
            onUpdate={(patch) => updateChapter(ci, patch)}
            onRemove={() => removeChapter(ci)}
            onPagesChange={(e) => handlePagesChange(e, ci)}
            onRemovePage={(pi) => removePage(ci, pi)}
          />
        ))}
        <button className="btn btn-ghost btn-block" onClick={addChapter}>
          + Add Chapter
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : editingSlug ? "Save Changes" : "Publish Comic"}
        </button>
        {editingSlug && (
          <button className="btn btn-ghost" onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>

      <div className="section-label" style={{ padding: "28px 0 8px" }}>
        Existing Comics ({comics.length})
      </div>
      <div className="chapter-list">
        {comics.map((c) => (
          <div key={c.slug} className="chapter-row">
            <span className="chapter-name">{c.title}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-ghost" onClick={() => loadForEdit(c)} disabled={loadingEdit}>
                {loadingEdit && editingSlug === c.slug ? "Loading…" : "Edit"}
              </button>
              <button className="btn btn-ghost" onClick={() => handleDelete(c.slug)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function ChapterEditor({ chapter, onUpdate, onRemove, onPagesChange, onRemovePage }) {
  const fileInputRef = useRef(null);
  const pages = [...chapter.pages].sort((a, b) => a.order - b.order);

  return (
    <div className="chapter-editor">
      <div className="chapter-editor-head">
        <input
          style={{ width: 70 }}
          type="number"
          value={chapter.number}
          onChange={(e) => onUpdate({ number: Number(e.target.value) })}
        />
        <input
          style={{ flex: 1, marginLeft: 8 }}
          placeholder="Chapter title (optional)"
          value={chapter.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
        <button className="btn btn-ghost" onClick={onRemove} style={{ marginLeft: 8 }}>
          ✕
        </button>
      </div>

      <div className="page-thumb-row">
        {pages.map((p, i) => (
          <div key={p.fileId} className="page-thumb">
            <img src={imageUrl(p.fileId)} alt={`page ${i + 1}`} />
            <button className="remove" onClick={() => onRemovePage(i)}>
              ✕
            </button>
          </div>
        ))}
        <div className="upload-slot" onClick={() => fileInputRef.current.click()}>
          +
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={onPagesChange}
      />
    </div>
  );
}