const test = require("node:test");
const assert = require("node:assert/strict");

const {
  connectTestDatabase,
  disconnectTestDatabase,
  clearTestDatabase,
} = require("./testDatabase");

const ProductCatalogue = require("../models/ProductCatalogue");
const User = require("../models/User");

test.before(async () => {
  await connectTestDatabase();
});

test.after(async () => {
  await clearTestDatabase();
  await disconnectTestDatabase();
});

test.beforeEach(async () => {
  await clearTestDatabase();
});

test("ProductCatalogue enforces one record per product identity", async () => {
  const user = await User.create({
    username: `catalogue-test-${Date.now()}`,
    password: "test-password",
    role: "manager",
  });

  const product = {
    brand: "TestBrand",
    model: "TestModel",
    ram: "8GB",
    storage: "128GB",
    imageUrl: "",
    title: "TestBrand TestModel",
    description: "Automated catalogue test product.",
    highlights: ["Test highlight"],
    category: "Smartphones",
    visible: true,
    featured: false,
    displayOrder: 0,
    createdBy: user._id,
  };

  const first = await ProductCatalogue.create(product);

  assert.ok(first._id);
  assert.equal(first.brand, "TestBrand");
  assert.equal(first.model, "TestModel");
  assert.equal(first.ram, "8GB");
  assert.equal(first.storage, "128GB");

  await assert.rejects(
    ProductCatalogue.create({
      ...product,
      title: "Duplicate Test Product",
    }),
    (error) => {
      assert.equal(error.code, 11000);
      return true;
    }
  );

  const differentRam = await ProductCatalogue.create({
    ...product,
    ram: "12GB",
    title: "TestBrand TestModel 12GB",
  });

  assert.ok(differentRam._id);
  assert.equal(differentRam.ram, "12GB");

  const catalogueCount =
    await ProductCatalogue.countDocuments();

  assert.equal(
    catalogueCount,
    2
  );
});

test("ProductCatalogue requires the core product identity", async () => {
  const user = await User.create({
    username: `catalogue-required-${Date.now()}`,
    password: "test-password",
    role: "manager",
  });

  await assert.rejects(
    ProductCatalogue.create({
      model: "MissingBrandProduct",
      ram: "8GB",
      storage: "128GB",
      createdBy: user._id,
    }),
    (error) => {
      assert.equal(error.name, "ValidationError");
      assert.ok(error.errors.brand);
      return true;
    }
  );
});
