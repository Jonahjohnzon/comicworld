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

  const { messageIds } = req.body || {};
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: "messageIds (array) is required" });
  }

  // Best-effort: delete each message, but don't let one failure (e.g. already deleted
  // manually, or an old page uploaded before message_id was tracked) block the rest.
  const results = await Promise.allSettled(
    messageIds.map(async (messageId) => {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: STORAGE_CHANNEL_ID, message_id: messageId }),
      });
      const tgData = await tgRes.json();
      if (!tgData.ok) throw new Error(tgData.description || "delete failed");
      return messageId;
    })
  );

  const deleted = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - deleted;

  return res.status(200).json({ deleted, failed, total: messageIds.length });
};
