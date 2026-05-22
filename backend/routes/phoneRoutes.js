const express = require("express");

const {
  getPhones,
  getPhoneById,
  createPhone,
  updatePhone,
  deletePhone,
} = require("../controllers/phoneController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getPhones);

router.get("/:id", protect, getPhoneById);

router.post("/", protect, createPhone);

router.put("/:id", protect, updatePhone);

router.delete("/:id", protect, deletePhone);

module.exports = router;