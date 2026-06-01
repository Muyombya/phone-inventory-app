const Audit =
  require("../models/Audit");

// =========================
// GET AUDIT LOGS
// =========================
const getAuditLogs =
  async (
    req,
    res
  ) => {
    try {
      if (
        req.user.role !==
        "manager"
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }

      const logs =
        await Audit.find()
          .sort({
            createdAt:
              -1,
          })
          .populate(
            "user",
            "username role"
          )
          .populate(
            "branch",
            "name"
          );

      res.json(logs);
    } catch (
      error
    ) {
      console.log(error);

      res.status(500).json({
        message:
          "Server Error",
      });
    }
  };

// =========================
// CLEAR AUDIT LOGS
// =========================
const clearAuditLogs =
  async (
    req,
    res
  ) => {
    try {
      if (
        req.user.role !==
        "manager"
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }

      const {
        period,
      } = req.body;

      let result;

      if (
        period ===
        "all"
      ) {
        result =
          await Audit.deleteMany(
            {}
          );

        return res.json({
          message:
            "All audit logs deleted successfully",

          deletedCount:
            result.deletedCount,
        });
      }

      const cutoffDate =
        new Date();
              if (
        period ===
        "30days"
      ) {
        cutoffDate.setDate(
          cutoffDate.getDate() -
            30
        );
      } else if (
        period ===
        "90days"
      ) {
        cutoffDate.setDate(
          cutoffDate.getDate() -
            90
        );
      } else if (
        period ===
        "1year"
      ) {
        cutoffDate.setFullYear(
          cutoffDate.getFullYear() -
            1
        );
      } else {
        return res
          .status(400)
          .json({
            message:
              "Invalid cleanup period",
          });
      }

      result =
        await Audit.deleteMany(
          {
            createdAt: {
              $lt:
                cutoffDate,
            },
          }
        );

      res.json({
        message:
          "Audit logs cleaned successfully",

        deletedCount:
          result.deletedCount,
      });
    } catch (
      error
    ) {
      console.log(error);

      res.status(500).json({
        message:
          "Server Error",
      });
    }
  };

// =========================
// EXPORTS
// =========================
module.exports = {
  getAuditLogs,
  clearAuditLogs,
};