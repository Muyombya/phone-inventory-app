const express =
  require("express");

const router =
  express.Router();

const {
  getPhones,
  getPhoneById,
  addPhone,
  updatePhone,
  deletePhone,
  sellPhone,
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