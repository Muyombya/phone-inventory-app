const test = require("node:test");
const assert = require("node:assert/strict");

const {
  connectTestDatabase,
  disconnectTestDatabase,
  clearTestDatabase,
} = require("./testDatabase");

const app = require("../app");
const Branch = require("../models/Branch");
const User = require("../models/User");
const Phone = require("../models/Phone");
const ProductCatalogue = require("../models/ProductCatalogue");

const jwt = require("jsonwebtoken");

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      branch: user.branch,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const request = async (
  method,
  path,
  token,
  body
) => {
  const server =
    require("http").createServer(app);

  await new Promise((resolve) =>
    server.listen(0, resolve)
  );

  const port = server.address().port;

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },
        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      data,
    };
  } finally {
    await new Promise((resolve) =>
      server.close(resolve)
    );
  }
};

let manager;
let cashier;
let branch;
let managerToken;
let cashierToken;

test.before(async () => {
  await connectTestDatabase();
});

test.after(async () => {
  await clearTestDatabase();
  await disconnectTestDatabase();
});

test.beforeEach(async () => {
  await clearTestDatabase();

  branch = await Branch.create({
    name: `Catalogue Test Branch ${Date.now()}`,
    location: "Test",
    contact: "0000000000",
  });

  manager = await User.create({
    username: `catalogue-manager-${Date.now()}`,
    password: "test-password",
    role: "manager",
    branch: branch._id,
  });

  cashier = await User.create({
    username: `catalogue-cashier-${Date.now()}`,
    password: "test-password",
    role: "cashier",
    branch: branch._id,
  });

  managerToken = signToken(manager);
  cashierToken = signToken(cashier);

  await Phone.create({
    brand: "TestBrand",
    model: "TestModel",
    imei: `${Date.now()}001`,
    storage: "128GB",
    ram: "8GB",
    color: "Black",
    buyingPrice: 500000,
    sellingPrice: 650000,
    branch: branch._id,
    addedBy: manager._id,
  });
});

test("authenticated users can read the live catalogue", async () => {
  const response = await request(
    "GET",
    "/api/catalogue",
    cashierToken
  );

  assert.equal(response.status, 200);

  assert.equal(
    response.data.reportType,
    "PRODUCT_CATALOG"
  );

  assert.equal(
    response.data.products.length,
    1
  );

  assert.equal(
    response.data.products[0].currentStock,
    1
  );

  assert.equal(
    response.data.products[0].sellingPrice,
    650000
  );
});

test("unauthenticated users cannot read the catalogue", async () => {
  const response = await request(
    "GET",
    "/api/catalogue"
  );

  assert.equal(response.status, 401);
});

test("non-managers cannot create catalogue metadata", async () => {
  const response = await request(
    "POST",
    "/api/catalogue",
    cashierToken,
    {
      brand: "TestBrand",
      model: "TestModel",
      ram: "8GB",
      storage: "128GB",
      title: "Cashier Attempt",
    }
  );

  assert.equal(response.status, 403);

  assert.equal(
    await ProductCatalogue.countDocuments(),
    0
  );
});

test("manager can create catalogue metadata", async () => {
  const response = await request(
    "POST",
    "/api/catalogue",
    managerToken,
    {
      brand: "TestBrand",
      model: "TestModel",
      ram: "8GB",
      storage: "128GB",
      title: "TestBrand TestModel",
      description: "Catalogue description.",
      highlights: [
        "8GB RAM",
        "128GB Storage",
      ],
      imageUrl:
        "https://example.com/test-phone.jpg",
      featured: true,
    }
  );

  assert.equal(response.status, 201);
  assert.equal(response.data.success, true);

  assert.equal(
    response.data.catalogue.title,
    "TestBrand TestModel"
  );

  assert.equal(
    response.data.catalogue.featured,
    true
  );
});

test("manager can update catalogue metadata without changing inventory price", async () => {
  const catalogue =
    await ProductCatalogue.create({
      brand: "TestBrand",
      model: "TestModel",
      ram: "8GB",
      storage: "128GB",
      title: "Original Title",
      createdBy: manager._id,
    });

  const response = await request(
    "PUT",
    `/api/catalogue/${catalogue._id}`,
    managerToken,
    {
      title: "Updated Title",
      description: "Updated description.",
      imageUrl:
        "https://example.com/updated.jpg",
      featured: true,
      displayOrder: 5,

      sellingPrice: 1,
      currentStock: 999,
    }
  );

  assert.equal(response.status, 200);

  assert.equal(
    response.data.catalogue.title,
    "Updated Title"
  );

  const phone = await Phone.findOne({
    brand: "TestBrand",
    model: "TestModel",
  });

  assert.ok(phone);

  assert.equal(
    phone.sellingPrice,
    650000
  );

  assert.equal(
    await Phone.countDocuments({
      brand: "TestBrand",
      model: "TestModel",
    }),
    1
  );
});

test("non-managers cannot update catalogue metadata", async () => {
  const catalogue =
    await ProductCatalogue.create({
      brand: "TestBrand",
      model: "TestModel",
      ram: "8GB",
      storage: "128GB",
      title: "Original Title",
      createdBy: manager._id,
    });

  const response = await request(
    "PUT",
    `/api/catalogue/${catalogue._id}`,
    cashierToken,
    {
      title: "Unauthorized Update",
    }
  );

  assert.equal(response.status, 403);

  const unchanged =
    await ProductCatalogue.findById(
      catalogue._id
    );

  assert.equal(
    unchanged.title,
    "Original Title"
  );
});

test("hidden catalogue products remain hidden from non-managers", async () => {
  await ProductCatalogue.create({
    brand: "TestBrand",
    model: "TestModel",
    ram: "8GB",
    storage: "128GB",
    title: "Hidden Product",
    visible: false,
    createdBy: manager._id,
  });

  const cashierResponse = await request(
    "GET",
    "/api/catalogue",
    cashierToken
  );

  assert.equal(
    cashierResponse.status,
    200
  );

  assert.equal(
    cashierResponse.data.products.length,
    0
  );

  const managerResponse = await request(
    "GET",
    "/api/catalogue?includeHidden=true",
    managerToken
  );

  assert.equal(
    managerResponse.status,
    200
  );

  assert.equal(
    managerResponse.data.products.length,
    1
  );

  assert.equal(
    managerResponse.data.products[0]
      .catalogue.visible,
    false
  );
});
