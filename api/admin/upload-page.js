const { getAuth } = require("../_lib/telegramAuth");
const { setCors } = require("../_lib/utils");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STORAGE_CHANNEL_ID = process.env.TELEGRAM_STORAGE_CHANNEL_ID;

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { isAdmin } = getAuth(req);
  if (!isAdmin) return res.status(403).json({ error: "Admin access required" });

  if (!BOT_TOKEN || !STORAGE_CHANNEL_ID) {
    return res.status(500).json({ error: "Server missing TELEGRAM_BOT_TOKEN or TELEGRAM_STORAGE_CHANNEL_ID" });
  }

  const { imageBase64, filename, caption } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

  try {
    // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 9 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large (max ~9MB)" });
    }

    const form = new FormData();
    form.append("chat_id", STORAGE_CHANNEL_ID);
    // sendDocument keeps the original file untouched (no compression), important for comic pages.
    form.append("document", new Blob([buffer]), filename || "page.jpg");
    // Telegram channels have no folders, but captions ARE searchable via the channel's
    // built-in search (magnifying glass), so this is the practical substitute for organizing.
    if (caption) form.append("caption", caption.slice(0, 1024)); // Telegram's caption limit

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: form,
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(502).json({ error: "Telegram upload failed", details: tgData.description });
    }

    const fileId = tgData.result.document.file_id;
    const messageId = tgData.result.message_id;
    return res.status(200).json({ fileId, messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
};
