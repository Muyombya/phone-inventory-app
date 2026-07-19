require("dotenv").config();

const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

const SOURCE_DB = "test";
const TARGET_DB = "PhoneInventoryDev";

if (!uri) {
  console.error("❌ MONGO_URI was not found in your .env file.");
  process.exit(1);
}

async function cloneDatabase() {
  const client = new MongoClient(uri);

  let collectionsCopied = 0;
  let totalDocuments = 0;

  try {
    console.log("======================================");
    console.log(" Phone Inventory Database Cloner");
    console.log("======================================\n");

    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("✅ Connected successfully.\n");

    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);

    const collections = await sourceDb.listCollections().toArray();

    console.log(`Found ${collections.length} collections.\n`);

    for (const { name } of collections) {
      try {
        console.log("--------------------------------------");
        console.log(`Cloning collection: ${name}`);

        const sourceCollection = sourceDb.collection(name);
        const targetCollection = targetDb.collection(name);

        const documents = await sourceCollection.find({}).toArray();

        await targetCollection.deleteMany({});

        if (documents.length > 0) {
          await targetCollection.insertMany(documents, {
            ordered: false,
          });
        }

        console.log(`✅ ${documents.length} documents copied.`);

        collectionsCopied++;
        totalDocuments += documents.length;
      } catch (collectionError) {
        console.error(`❌ Failed to clone collection "${name}"`);
        console.error(collectionError.message);
      }

      console.log();
    }

    console.log("======================================");
    console.log("Database clone completed.");
    console.log("======================================");
    console.log(`Collections copied : ${collectionsCopied}`);
    console.log(`Documents copied   : ${totalDocuments}`);
    console.log(`Source Database    : ${SOURCE_DB}`);
    console.log(`Target Database    : ${TARGET_DB}`);
    console.log("======================================");
  } catch (error) {
    console.error("\n❌ Database cloning failed.");
    console.error(error);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

cloneDatabase();