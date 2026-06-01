const express =
  require("express");

const router =
  express.Router();

const valuationController =
  require(
    "../controllers/valuationController"
  );

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );



// =====================================
// GET INVENTORY VALUATION
// =====================================
router.get(
  "/",
  authMiddleware.protect,
  valuationController.getInventoryValuation
);



// =====================================
// GET BRANCH VALUATION
// =====================================
router.get(
  "/branch/:branchId",
  authMiddleware.protect,
  valuationController.getBranchValuation
);



module.exports =
  router;