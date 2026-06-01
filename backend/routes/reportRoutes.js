const express =
  require("express");

const router =
  express.Router();

const {
  getDashboardReport,
} = require(
  "../controllers/reportController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

// =========================
// REPORTS
// =========================
router.get(
  "/",
  protect,
  getDashboardReport
);

module.exports =
  router;