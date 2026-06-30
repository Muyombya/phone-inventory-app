const express =
  require("express");

const router =
  express.Router();

const {
  getPhones,
  getPhoneById,
  addPhone,
  updatePhone,
  bulkInventoryUpdate,
  getBulkInventoryPreview,
  getBulkOptions,
  deletePhone,
  sellPhone,
  transferPhone,
} = require("../controllers/phoneController");

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);



// ==============================
// GET ALL PHONES
// ==============================
router.get(
  "/",
  protect,
  getPhones
);

// ==============================
// BULK INVENTORY OPTIONS
// ==============================
router.get(
  "/bulk-options",
  protect,
  getBulkOptions
);

// ==============================
// BULK INVENTORY PREVIEW
// ==============================
router.get(
  "/bulk-preview",
  protect,
  getBulkInventoryPreview
);

// ==============================
// GET SINGLE PHONE
// ==============================
router.get(
  "/:id",
  protect,
  getPhoneById
);

// ==============================
// ADD PHONE
// ==============================
router.post(
  "/",
  protect,
  addPhone
);

// ==============================
// BULK INVENTORY UPDATE
// ==============================
router.put(
  "/bulk-update",
  protect,
  bulkInventoryUpdate
);

// ==============================
// UPDATE PHONE
// ==============================
router.put(
  "/:id",
  protect,
  updatePhone
);

// ==============================
// DELETE PHONE
// ==============================
router.delete(
  "/:id",
  protect,
  deletePhone
);

// ==============================
// SELL PHONE
// ==============================
router.post(
  "/sell/:id",
  protect,
  sellPhone
);

// ==============================
// TRANSFER PHONE
// ==============================
router.put(
  "/transfer/:id",
  protect,
  transferPhone
);



module.exports =
  router;