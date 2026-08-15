const Audit = require("../models/Audit");

const getAuditLogs = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== "manager") {
      const branchId = req.user.branch?._id || req.user.branch;
      query = {
        $or: [
          { branch: branchId },
          { affectedBranches: branchId },
          { sourceBranch: branchId },
          { destinationBranch: branchId },
        ],
      };
    }

    const logs = await Audit.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "username role")
      .populate("branch", "name")
      .populate("sourceBranch", "name")
      .populate("destinationBranch", "name")
      .lean();

    res.json(logs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const clearAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { period } = req.body;

    if (period === "all") {
      const result = await Audit.deleteMany({});
      return res.json({
        message: "All audit logs deleted successfully",
        deletedCount: result.deletedCount,
      });
    }

    const cutoffDate = new Date();
    if (period === "30days") cutoffDate.setDate(cutoffDate.getDate() - 30);
    else if (period === "90days") cutoffDate.setDate(cutoffDate.getDate() - 90);
    else if (period === "1year") cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    else return res.status(400).json({ message: "Invalid cleanup period" });

    const result = await Audit.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    res.json({
      message: "Audit logs cleaned successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getAuditLogs, clearAuditLogs };
