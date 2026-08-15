const crypto = require("crypto");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Validates the initData string Telegram gives every Mini App session.
 * Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * Returns the parsed user object if valid, or null if invalid/missing.
 */
function verifyInitData(initData) {
  if (!initData || !BOT_TOKEN) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  // Optional freshness check: reject initData older than 24h
  const authDate = Number(params.get("auth_date")) * 1000;
  if (authDate && Date.now() - authDate > 24 * 60 * 60 * 1000) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

function isAdminUser(user) {
  if (!user || !user.id) return false;
  return ADMIN_IDS.includes(String(user.id));
}

/**
 * Express/Vercel-style helper: reads x-telegram-init-data header, validates it,
 * and returns { user, isAdmin }. Never throws.
 */
function getAuth(req) {
  const initData = req.headers["x-telegram-init-data"];
  const user = verifyInitData(initData);
  return { user, isAdmin: isAdminUser(user) };
}

module.exports = { verifyInitData, isAdminUser, getAuth };
