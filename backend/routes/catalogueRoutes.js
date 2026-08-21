const express = require("express");

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
