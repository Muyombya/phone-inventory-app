const express = require("express");

const router = express.Router();

const dashboardController = require(
  "../controllers/dashboardController"
);

const authMiddleware = require(
  "../middleware/authMiddleware"
);



// =====================================
// GET DASHBOARD DATA
// =====================================
router.get(
  "/",
  authMiddleware.protect,
  dashboardController.getDashboardData
);



module.exports = router;