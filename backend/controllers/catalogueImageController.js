const multer = require("multer");

const {
  uploadCatalogueImage,
  getCatalogueImage,
} = require("../services/catalogueImageService");

function ensureManager(req, res) {
  if (req.user?.role !== "manager") {
    res.status(403).json({
      success: false,
      message: "Managers only",
    });

    return false;
  }

  return true;
}

async function uploadImage(req, res) {
  try {
    if (!ensureManager(req, res)) return;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required.",
      });
    }

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!allowedTypes.has(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Only JPG, PNG and WEBP images are supported.",
      });
    }

    const maxBytes = 5 * 1024 * 1024;

    if (req.file.size > maxBytes) {
      return res.status(400).json({
        success: false,
        message:
          "Image must be 5 MB or smaller.",
      });
    }

    const uploaded =
      await uploadCatalogueImage({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

    return res.status(201).json({
      success: true,
      imageUrl:
        `/api/catalogue/images/${uploaded.id}`,
      image: {
        id: String(uploaded.id),
        filename: uploaded.filename,
        contentType: uploaded.contentType,
      },
    });
  } catch (error) {
    console.error(
      "Upload Catalogue Image Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to upload catalogue image.",
    });
  }
}

async function getImage(req, res) {
  try {
    const result =
      await getCatalogueImage(
        req.params.id
      );

    if (!result) {
      return res.status(404).end();
    }

    const {
      file,
      stream,
    } = result;

    const contentType =
      file.metadata?.contentType ||
      file.contentType ||
      "application/octet-stream";

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

    if (file.length) {
      res.setHeader(
        "Content-Length",
        String(file.length)
      );
    }

    stream.on("error", (error) => {
      console.error(
        "Catalogue Image Stream Error:",
        error
      );

      if (!res.headersSent) {
        res.status(404).end();
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error(
      "Get Catalogue Image Error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).end();
    }

    res.end();
  }
}

function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "Image must be 5 MB or smaller.",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        "Unable to process the uploaded image.",
    });
  }

  return next(error);
}

module.exports = {
  uploadImage,
  getImage,
  handleUploadError,
};
