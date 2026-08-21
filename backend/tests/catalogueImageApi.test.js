const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");

const {
  connectTestDatabase,
  disconnectTestDatabase,
  clearTestDatabase,
} = require("./testDatabase");

const app = require("../app");
const Branch = require("../models/Branch");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      branch: user.branch,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function startServer() {
  const server = http.createServer(app);

  await new Promise((resolve) =>
    server.listen(0, resolve)
  );

  return server;
}

async function uploadRequest(
  server,
  token,
  {
    filename = "phone.png",
    contentType = "image/png",
    bytes = Buffer.from("catalogue-image-test"),
  } = {}
) {
  const port = server.address().port;
  const boundary =
    `----CatalogueImageTest${Date.now()}`;

  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`
  );

  const footer = Buffer.from(
    `\r\n--${boundary}--\r\n`
  );

  const body = Buffer.concat([
    header,
    bytes,
    footer,
  ]);

  const response = await fetch(
    `http://127.0.0.1:${port}/api/catalogue/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          `multipart/form-data; boundary=${boundary}`,
        "Content-Length":
          String(body.length),
      },
      body,
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
}

async function getImageRequest(
  server,
  token,
  imageId
) {
  const port = server.address().port;

  return fetch(
    `http://127.0.0.1:${port}/api/catalogue/images/${imageId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

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
    name: `Catalogue Image Test Branch ${Date.now()}`,
    location: "Test",
    contact: "0000000000",
  });

  manager = await User.create({
    username:
      `image-manager-${Date.now()}`,
    password: "test-password",
    role: "manager",
    branch: branch._id,
  });

  cashier = await User.create({
    username:
      `image-cashier-${Date.now()}`,
    password: "test-password",
    role: "cashier",
    branch: branch._id,
  });

  managerToken = signToken(manager);
  cashierToken = signToken(cashier);
});

test("manager can upload a catalogue image", async () => {
  const server = await startServer();

  try {
    const response =
      await uploadRequest(
        server,
        managerToken
      );

    assert.equal(
      response.status,
      201
    );

    assert.equal(
      response.data.success,
      true
    );

    assert.match(
      response.data.imageUrl,
      /^\/api\/catalogue\/images\/[a-f0-9]{24}$/
    );

    assert.equal(
      response.data.image.contentType,
      "image/png"
    );
  } finally {
    await new Promise((resolve) =>
      server.close(resolve)
    );
  }
});

test("non-manager cannot upload a catalogue image", async () => {
  const server = await startServer();

  try {
    const response =
      await uploadRequest(
        server,
        cashierToken
      );

    assert.equal(
      response.status,
      403
    );

    assert.equal(
      response.data.success,
      false
    );
  } finally {
    await new Promise((resolve) =>
      server.close(resolve)
    );
  }
});

test("invalid catalogue image type is rejected", async () => {
  const server = await startServer();

  try {
    const response =
      await uploadRequest(
        server,
        managerToken,
        {
          filename: "phone.txt",
          contentType: "text/plain",
          bytes: Buffer.from(
            "not an image"
          ),
        }
      );

    assert.equal(
      response.status,
      400
    );

    assert.match(
      response.data.message,
      /Only JPG, PNG and WEBP/
    );
  } finally {
    await new Promise((resolve) =>
      server.close(resolve)
    );
  }
});

test("catalogue image larger than 5 MB is rejected cleanly", async () => {
  const server = await startServer();

  try {
    const oversized =
      Buffer.alloc(
        5 * 1024 * 1024 + 1,
        1
      );

    const response =
      await uploadRequest(
        server,
        managerToken,
        {
          filename: "large.png",
          contentType: "image/png",
          bytes: oversized,
        }
      );

    assert.equal(
      response.status,
      400
    );

    assert.equal(
      response.data.success,
      false
    );

    assert.match(
      response.data.message,
      /5 MB or smaller/
    );
  } finally {
    await new Promise((resolve) =>
      server.close(resolve)
    );
  }
});

test("uploaded catalogue image can be retrieved with its MIME type", async () => {
  const server = await startServer();

  try {
    const upload =
      await uploadRequest(
        server,
        managerToken
      );

    assert.equal(
      upload.status,
      201
    );

    const imageId =
      upload.data.image.id;

    const response =
      await getImageRequest(
        server,
        managerToken,
        imageId
      );

    assert.equal(
      response.status,
      200
    );

    assert.equal(
      response.headers.get(
        "content-type"
      ),
      "image/png"
    );

    const body =
      Buffer.from(
        await response.arrayBuffer()
      );

    assert.deepEqual(
      body,
      Buffer.from(
        "catalogue-image-test"
      )
    );
  } finally {
    await new Promise((resolve) =>
      server.close(resolve)
    );
  }
});
