const express =
  require("express");

const router =
  express.Router();

const {
  getPhones,
  getStockLookup,
  getPhoneById,
  addPhone,
  updatePhone,
  bulkInventoryUpdate,
  getBulkInventoryPreview,
  getBulkOptions,
  deletePhone,
  transferPhone,
} = require(
  "../controllers/phoneController"
);

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
// STOCK LOOKUP
// Company-wide read-only stock view.
// ==============================
router.get(
  "/stock-lookup",
  protect,
  getStockLookup
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
// BULK INVENTORY OPTIONS
// ==============================
router.get(
  "/bulk-options",
  protect,
  getBulkOptions
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
// TRANSFER PHONE
// ==============================
router.put(
  "/transfer/:id",
  protect,
  transferPhone
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







module.exports =
  router;