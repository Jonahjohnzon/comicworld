const { getDb } = require("../_lib/mongodb");
const { getAuth } = require("../_lib/telegramAuth");
const { slugify, setCors } = require("../_lib/utils");

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const db = await getDb();
  const collection = db.collection("comics");

  if (req.method === "GET") {
    const { q, tag } = req.query;
    const filter = {};
    if (q) filter.title = { $regex: q, $options: "i" };
    if (tag) filter.tags = tag;

    const comics = await collection
      .find(filter, {
        projection: {
          title: 1,
          slug: 1,
          description: 1,
          thumbnail: 1,
          tags: 1,
          status: 1,
          createdAt: 1,
          chapterCount: { $size: { $ifNull: ["$chapters", []] } },
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ comics });
  }

  if (req.method === "POST") {
    const { isAdmin } = getAuth(req);
    if (!isAdmin) return res.status(403).json({ error: "Admin access required" });

    const { title, description, thumbnail, tags, status, chapters, slug: bodySlug } = req.body || {};
    if (!title || !thumbnail) {
      return res.status(400).json({ error: "title and thumbnail are required" });
    }

    const slug = bodySlug ? slugify(bodySlug) : slugify(title);
    const now = new Date();

    const doc = {
      title,
      slug,
      description: description || "",
      thumbnail,
      tags: Array.isArray(tags) ? tags : [],
      status: status || "ongoing", // ongoing | completed
      chapters: Array.isArray(chapters) ? chapters : [],
      updatedAt: now,
    };

    const existing = await collection.findOne({ slug });
    if (existing) {
      await collection.updateOne({ slug }, { $set: doc });
      return res.status(200).json({ ok: true, slug, updated: true });
    }

    doc.createdAt = now;
    await collection.insertOne(doc);
    return res.status(201).json({ ok: true, slug, created: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
