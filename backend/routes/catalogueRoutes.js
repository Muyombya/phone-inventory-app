const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  getCatalogue,
  getCatalogueItem,
  createCatalogue,
  updateCatalogue,
} = require("../controllers/catalogueController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  uploadImage,
  getImage,
  handleUploadError,
} = require("../controllers/catalogueImageController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

// =====================================
// CATALOGUE IMAGE UPLOAD
// MUST COME BEFORE /:key
// MANAGER ONLY
// =====================================
router.post(
  "/images",
  protect,
  upload.single("image"),
  handleUploadError,
  uploadImage
);

// =====================================
// CATALOGUE IMAGE READ
// MUST COME BEFORE /:key
// AUTHENTICATED USERS
// =====================================
router.get(
  "/images/:id",
  protect,
  getImage
);

// =========================
// READ CATALOGUE
// AVAILABLE TO ALL USERS
// =========================
router.get(
  "/",
  protect,
  getCatalogue
);

// =========================
// READ SINGLE PRODUCT
// AVAILABLE TO ALL USERS
// =========================
router.get(
  "/:key",
  protect,
  getCatalogueItem
);

// =========================
// CREATE CATALOGUE ENTRY
// MANAGER ONLY
// =========================
router.post(
  "/",
  protect,
  createCatalogue
);

// =========================
// UPDATE CATALOGUE ENTRY
// MANAGER ONLY
// =========================
router.put(
  "/:id",
  protect,
  updateCatalogue
);

module.exports = router;
