const express = require("express");
const router = express.Router();
const { getAuditLogs, clearAuditLogs } = require("../controllers/auditController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAuditLogs);
router.post("/clear", protect, clearAuditLogs);

module.exports = router;
