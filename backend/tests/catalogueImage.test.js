const test = require("node:test");
const assert = require("node:assert/strict");

const {
  connectTestDatabase,
  disconnectTestDatabase,
  clearTestDatabase,
} = require("./testDatabase");

const app = require("../app");
const User = require("../models/User");

const {
  uploadCatalogueImage,
} = require("../services/catalogueImageService");

test.before(async () => {
  await connectTestDatabase();
});

test.after(async () => {
  await disconnectTestDatabase();
});

test.beforeEach(async () => {
  await clearTestDatabase();
});

test("catalogue image service rejects empty uploads", () => {
  assert.throws(
    () =>
      uploadCatalogueImage({
        buffer: Buffer.alloc(0),
        filename: "phone.jpg",
        contentType: "image/jpeg",
      }),
    /Image file is required/
  );
});

test("catalogue image service rejects non-buffer input", () => {
  assert.throws(
    () =>
      uploadCatalogueImage({
        buffer: "not-a-buffer",
        filename: "phone.jpg",
        contentType: "image/jpeg",
      }),
    /Image file is required/
  );
});