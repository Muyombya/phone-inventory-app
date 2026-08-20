const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

async function connectTestDatabase() {
  const uri =
    process.env.MONGO_TEST_URI;

  if (!uri) {
    throw new Error(
      "MONGO_TEST_URI is required for tests. Tests will not fall back to MONGO_URI."
    );
  }

  await mongoose.connect(uri);
}

async function disconnectTestDatabase() {
  await mongoose.disconnect();
}

async function clearTestDatabase() {
  if (
    mongoose.connection.readyState !== 1
  ) {
    throw new Error(
      "Test database is not connected."
    );
  }

  const collections =
    mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

module.exports = {
  connectTestDatabase,
  disconnectTestDatabase,
  clearTestDatabase,
};