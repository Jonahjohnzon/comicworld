// api/tags.js
const { getDb } = require("../_lib/mongodb");
const { setCors } = require("../_lib/utils");

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const db = await getDb();
  const collection = db.collection("comics");

  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);

  const tags = await collection
    .aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ])
    .toArray();

  return res.status(200).json({ tags });
};