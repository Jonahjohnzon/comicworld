const { getAuth } = require("../_lib/telegramAuth");
const { setCors } = require("../_lib/utils");

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { user, isAdmin } = getAuth(req);
  return res.status(200).json({ isAdmin, userId: user ? user.id : null });
};
