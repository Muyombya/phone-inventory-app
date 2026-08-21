const mongoose = require("mongoose");

const BUCKET_NAME = "catalogueImages";

function getBucket() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected.");
  }

  return new mongoose.mongo.GridFSBucket(
    mongoose.connection.db,
    { bucketName: BUCKET_NAME }
  );
}

function uploadCatalogueImage({
  buffer,
  filename,
  contentType,
}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Image file is required.");
  }

  const bucket = getBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(
      filename,
      {
        contentType,
        metadata: {
          type: "catalogue-image",
          contentType,
        },
      }
    );

    uploadStream.on("error", reject);

    uploadStream.on("finish", () => {
      resolve({
        id: uploadStream.id,
        filename,
        contentType,
      });
    });

    uploadStream.end(buffer);
  });
}

async function getCatalogueImage(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const bucket = getBucket();

  const files = await bucket
    .find({
      _id: new mongoose.Types.ObjectId(id),
    })
    .limit(1)
    .toArray();

  if (!files.length) {
    return null;
  }

  return {
    file: files[0],
    stream: bucket.openDownloadStream(files[0]._id),
  };
}

module.exports = {
  uploadCatalogueImage,
  getCatalogueImage,
};
