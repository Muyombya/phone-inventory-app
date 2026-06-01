const express =
  require("express");

const router =
  express.Router();

const {
  getReturns,
  getReturnById,
  getReturnsAnalytics,
} = require(
  "../controllers/returnController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

// =====================================
// GET RETURNS
// =====================================
router.get(
  "/",
  protect,
  getReturns
);

// =====================================
// RETURNS ANALYTICS
// =====================================
router.get(
  "/analytics",
  protect,
  getReturnsAnalytics
);

// =====================================
// GET SINGLE RETURN
// =====================================
router.get(
  "/:id",
  protect,
  getReturnById
);

module.exports =
  router;
  