import { getInitData } from "./telegram";

// Same-origin: frontend and API are deployed together on Vercel.
const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-telegram-init-data": getInitData(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  listComics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/comics${qs ? `?${qs}` : ""}`);
  },
  getComic: (slug) => request(`/comics/${slug}`),
  saveComic: (payload) => request(`/comics`, { method: "POST", body: JSON.stringify(payload) }),
  deleteComic: (slug) => request(`/comics/${slug}`, { method: "DELETE" }),
  checkAdmin: () => request(`/admin/check`),
  uploadPage: (imageBase64, filename) =>
    request(`/admin/upload-page`, { method: "POST", body: JSON.stringify({ imageBase64, filename }) }),
};

export function imageUrl(fileId) {
  return `${BASE}/image/${fileId}`;
}
