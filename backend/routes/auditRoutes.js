const express =
  require("express");

const router =
  express.Router();

const {
  getAuditLogs,
  clearAuditLogs,
} = require(
  "../controllers/auditController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

// =========================
// GET AUDIT LOGS
// =========================
router.get(
  "/",
  protect,
  getAuditLogs
);

// =========================
// CLEAR AUDIT LOGS
// =========================
router.post(
  "/clear",
  protect,
  clearAuditLogs
);

module.exports =
  router;