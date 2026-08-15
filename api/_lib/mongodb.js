const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "comicapp";

if (!uri) {
  console.warn("MONGODB_URI is not set. API calls to the database will fail.");
}

// Reuse the client across warm serverless invocations.
let cachedClient = global._mongoClient;
let cachedDb = global._mongoDb;

async function getDb() {
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 5,
    });
    global._mongoClient = cachedClient;
  }

  if (!cachedClient.topology || !cachedClient.topology.isConnected()) {
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  global._mongoDb = cachedDb;
  return cachedDb;
}

module.exports = { getDb };
