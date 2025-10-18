import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { fileURLToPath } from "url";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_NAME = "wynnpool";

const ChangelogSchema = new mongoose.Schema({}, { strict: false });
export const ChangelogModel = mongoose.model(
  "ItemChangelog",
  ChangelogSchema,
  "item_changelog"
);

async function generateStaticChangelogs() {
  // 🧩 Ensure the URI uses the correct database
  let mongoUri = process.env.MONGODB_URI!;
  if (!mongoUri.includes(`/${DB_NAME}`)) {
    // Append the database name if not included
    if (mongoUri.endsWith("/")) mongoUri = `${mongoUri}${DB_NAME}`;
    else mongoUri = `${mongoUri}/${DB_NAME}`;
  }

  await mongoose.connect(mongoUri, { dbName: DB_NAME });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Failed to get database connection");
  }
  console.log(`✅ Connected to MongoDB (database: ${db.databaseName})`);

  const collections = await db.listCollections().toArray();
  console.log("🧭 Collections in this DB:", collections.map(c => c.name));

  // 🧪 Check how many documents are there
  const total = await ChangelogModel.countDocuments({});
  console.log(`📊 Total documents in item_changelog: ${total}`);

  const timestamps: number[] = await ChangelogModel.distinct("timestamp").exec() as number[];
  console.log(`📦 Found ${timestamps.length} timestamps`);

  const outputDir = path.resolve(__dirname, "../apps/static/item-changelog-data");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const timestamp of timestamps) {
    const outputFile = path.join(outputDir, `${timestamp}.json`);

    if (fs.existsSync(outputFile)) {
      console.log(`⏩ Skipped ${timestamp}.json (already exists)`);
      continue;
    }

    console.log(`🧩 Generating changelog for timestamp ${timestamp}...`);

    const pipeline = [
      { $match: { timestamp } },
      {
        $group: {
          _id: "$status",
          items: { $push: "$$ROOT" },
        },
      },
      { $project: { _id: 0, status: "$_id", items: 1 } },
    ];

    const categorizedData = await ChangelogModel.aggregate(pipeline).exec();
    const result = categorizedData.reduce((acc, entry) => {
      acc[entry.status] = entry.items;
      return acc;
    }, {} as Record<string, any[]>);

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`✅ Saved ${timestamp}.json`);
  }

  await mongoose.disconnect();
  console.log("🏁 All changelogs generated!");
}

generateStaticChangelogs().catch(console.error);
