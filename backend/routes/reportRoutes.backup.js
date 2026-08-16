const express = require("express");

const router = express.Router();

const {
  getDashboardReport,
  getBranchSalesReport,
  getCurrentStockReport,
  getProductHistoryReport,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");

// =====================================
// MANAGEMENT DASHBOARD
// =====================================
router.get(
  "/",
  protect,
  getDashboardReport
);

// =====================================
// BRANCH SALES
// =====================================
router.get(
  "/branch-sales",
  protect,
  getBranchSalesReport
);

// =====================================
// CURRENT STOCK
// =====================================
router.get(
  "/current-stock",
  protect,
  getCurrentStockReport
);

// =====================================
// PRODUCT LIFETIME HISTORY
// =====================================
router.get(
  "/product-history",
  protect,
  getProductHistoryReport
);

module.exports = router;
