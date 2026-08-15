const { getDb } = require("../_lib/mongodb");
const { getAuth } = require("../_lib/telegramAuth");
const { setCors } = require("../_lib/utils");

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { slug } = req.query;
  const db = await getDb();
  const collection = db.collection("comics");

  if (req.method === "GET") {
    const comic = await collection.findOne({ slug });
    if (!comic) return res.status(404).json({ error: "Comic not found" });
    return res.status(200).json({ comic });
  }

  if (req.method === "DELETE") {
    const { isAdmin } = getAuth(req);
    if (!isAdmin) return res.status(403).json({ error: "Admin access required" });

    const result = await collection.deleteOne({ slug });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Comic not found" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
