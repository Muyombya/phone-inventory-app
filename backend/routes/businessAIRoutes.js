const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getBusinessAI } = require("../controllers/businessAIController");

router.get(
  "/",
  protect,
  getBusinessAI
);

module.exports = router;
