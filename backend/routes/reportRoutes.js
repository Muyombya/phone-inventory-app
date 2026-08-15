const express = require("express");

const router = express.Router();

const {
  getDashboardReport,
  getBranchSalesReport,
  getCurrentStockReport,
  getProductHistoryReport,
  getProductCatalog,
} = require("../controllers/reportController");

const {
  getBusinessAI,
} = require("../controllers/businessAIController");

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
// HISTORICAL PRODUCT CATALOGUE
// =====================================
router.get(
  "/product-catalog",
  protect,
  getProductCatalog
);


// =====================================
// BUSINESS AI
// =====================================
router.get(
  "/ai",
  protect,
  getBusinessAI
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
