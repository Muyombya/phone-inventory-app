const express =
  require("express");

const router =
  express.Router();

const {
  createSale,
  getSales,
  getSaleById,
  deleteSale,
  returnSale,
  purgeSale,
} = require(
  "../controllers/saleController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

// =========================
// CREATE SALE
// =========================
router.post(
  "/",
  protect,
  createSale
);

// =========================
// GET ALL SALES
// =========================
router.get(
  "/",
  protect,
  getSales
);

// =========================
// GET SINGLE SALE
// =========================
router.get(
  "/:id",
  protect,
  getSaleById
);

// =========================
// RETURN SALE
// =========================
router.post(
  "/:id/return",
  protect,
  returnSale
);

// =========================
// DELETE SALE
// RESTORES INVENTORY
// =========================
router.delete(
  "/:id",
  protect,
  deleteSale
);

// =========================
// PURGE SALE
// TEST DATA CLEANUP
// =========================
router.delete(
  "/:id/purge",
  protect,
  purgeSale
);

module.exports =
  router;