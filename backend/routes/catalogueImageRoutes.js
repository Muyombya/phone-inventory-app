const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  uploadImage,
  getImage,
} = require("../controllers/catalogueImageController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

// =====================================
// UPLOAD CATALOGUE IMAGE
// MANAGER ONLY
// =====================================
router.post(
  "/images",
  protect,
  upload.single("image"),
  uploadImage
);

// =====================================
// READ CATALOGUE IMAGE
// PUBLIC TO AUTHENTICATED USERS
// =====================================
router.get(
  "/images/:id",
  protect,
  getImage
);

module.exports = router;
