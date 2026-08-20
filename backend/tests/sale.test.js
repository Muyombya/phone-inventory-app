const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
  connectTestDatabase,
  disconnectTestDatabase,
  clearTestDatabase,
} = require("./testDatabase");

const Branch = require("../models/Branch");
const User = require("../models/User");
const Phone = require("../models/Phone");
const Sale = require("../models/Sale");
const Audit = require("../models/Audit");

const {
  createSale,
} = require("../controllers/saleController");

function createResponseRecorder() {
  const response = {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return response;
}

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

test("a phone cannot be sold twice", async () => {
  const branch =
    await Branch.create({
      name:
        "Automated Test Branch",
      location:
        "Automated Test Environment",
      contact:
        "0000000000",
    });

  const user =
    await User.create({
      username:
        `test-manager-${Date.now()}`,
      password:
        "test-password",
      role:
        "manager",
      branch:
        branch._id,
    });

  const phone =
    await Phone.create({
      brand:
        "TestBrand",

      model:
        "TestModel",

      imei:
        `TEST-IMEI-${Date.now()}`,

      storage:
        "128GB",

      ram:
        "8GB",

      color:
        "Black",

      buyingPrice:
        500000,

      sellingPrice:
        700000,

      branch:
        branch._id,

      addedBy:
        user._id,

      soldPrice:
        0,

      profit:
        0,
    });

  const saleRequest = {
    user: {
      _id:
        user._id,

      branch:
        branch._id,

      role:
        "manager",
    },

    body: {
      items: [
        {
          phoneId:
            phone._id.toString(),

          discount:
            0,
        },
      ],

      customerName:
        "Automated Test Customer",

      customerPhone:
        "0700000000",

      paymentMethod:
        "Cash",
    },
  };

  const firstResponse =
    createResponseRecorder();

  await createSale(
    saleRequest,
    firstResponse
  );

  assert.equal(
    firstResponse.statusCode,
    201
  );

  assert.equal(
    firstResponse.body.success,
    true
  );

  assert.ok(
    firstResponse.body.sale
  );

  const createdSale =
    await Sale.findOne({
      "items.phoneId":
        phone._id,
    });

  assert.ok(
    createdSale,
    "The first sale should exist."
  );

  const phoneAfterSale =
    await Phone.findById(
      phone._id
    );

  assert.equal(
    phoneAfterSale,
    null,
    "The sold phone should be removed from inventory."
  );

  const audit =
    await Audit.findOne({
      action:
        "CREATE_SALE",

      entityType:
        "Sale",

      entityId:
        createdSale._id,
    });

  assert.ok(
    audit,
    "The sale should create an audit record."
  );

  const secondResponse =
    createResponseRecorder();

  await createSale(
    saleRequest,
    secondResponse
  );

  assert.equal(
    secondResponse.statusCode,
    409
  );

  assert.equal(
    secondResponse.body.success,
    false
  );

  const saleCount =
    await Sale.countDocuments({
      "items.phoneId":
        phone._id,
    });

  assert.equal(
    saleCount,
    1,
    "The second sale must not create another sale record."
  );
});