const express =
  require("express");

const router =
  express.Router();

const branchController =
  require(
    "../controllers/branchController"
  );

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );



// =====================================
// GET ALL BRANCHES
// =====================================
router.get(
  "/",
  authMiddleware.protect,
  branchController.getBranches
);



// =====================================
// GET SINGLE BRANCH
// =====================================
router.get(
  "/:id",
  authMiddleware.protect,
  branchController.getBranchById
);



// =====================================
// CREATE BRANCH
// =====================================
router.post(
  "/",
  authMiddleware.protect,
  authMiddleware.managerOnly,
  branchController.createBranch
);



// =====================================
// UPDATE BRANCH
// =====================================
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.managerOnly,
  branchController.updateBranch
);



// =====================================
// DELETE BRANCH
// =====================================
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.managerOnly,
  branchController.deleteBranch
);



module.exports =
  router;