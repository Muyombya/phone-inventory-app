const express =
  require("express");

const router =
  express.Router();

const transferController =
  require(
    "../controllers/transferController"
  );

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );



// =====================================
// GET ALL TRANSFERS
// =====================================
router.get(
  "/",
  authMiddleware.protect,
  transferController.getTransfers
);



// =====================================
// DELETE TRANSFER
// =====================================
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.managerOnly,
  transferController.deleteTransfer
);



module.exports =
  router;