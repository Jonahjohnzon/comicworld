const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

module.exports = async function handler(req, res) {
  const { fileId } = req.query;
  if (!fileId) return res.status(400).json({ error: "fileId is required" });
  if (!BOT_TOKEN) return res.status(500).json({ error: "Server missing TELEGRAM_BOT_TOKEN" });

  try {
    const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const infoData = await infoRes.json();

    if (!infoData.ok) {
      return res.status(404).json({ error: "File not found on Telegram" });
    }

    const filePath = infoData.result.file_path;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);

    if (!fileRes.ok || !fileRes.body) {
      return res.status(502).json({ error: "Failed to fetch file from Telegram" });
    }

    const ext = filePath.split(".").pop().toLowerCase();
    const contentType =
      { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }[ext] ||
      "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    // file_id -> file_path can change, but the same file_id always resolves to the same bytes,
    // so it's safe to cache aggressively on the client/CDN.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const buffer = Buffer.from(await fileRes.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load image" });
  }
};
