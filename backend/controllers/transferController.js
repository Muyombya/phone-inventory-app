const Transfer =
  require("../models/Transfer");

const logAudit =
  require("../utils/auditLogger");

// =====================================
// GET ALL TRANSFERS
// WITH DATE FILTERING
// =====================================
const getTransfers =
  async (
    req,
    res
  ) => {
    try {
      const {
        startDate,
        endDate,
      } = req.query;

      let filter =
        {};

      // =====================
      // DATE FILTERING
      // =====================
      if (
        startDate &&
        endDate
      ) {
        filter.createdAt =
          {
            $gte:
              new Date(
                `${startDate}T00:00:00.000Z`
              ),

            $lte:
              new Date(
                `${endDate}T23:59:59.999Z`
              ),
          };
      }

      const transfers =
        await Transfer.find(
          filter
        )
          .populate(
            "phone",
            "brand model imei"
          )
          .populate(
            "fromBranch",
            "name"
          )
          .populate(
            "toBranch",
            "name"
          )
          .populate(
            "transferredBy",
            "username"
          )
          .sort({
            createdAt:
              -1,
          });

      res.json(
        transfers
      );
    } catch (
      error
    ) {
      console.log(
        error
      );

      res.status(500).json({
        message:
          "Server Error",
      });
    }
  };

// =====================================
// DELETE TRANSFER
// =====================================
const deleteTransfer =
  async (req, res) => {
    try {
      const transfer =
        await Transfer.findById(
          req.params.id
        )
          .populate(
            "fromBranch",
            "name"
          )
          .populate(
            "toBranch",
            "name"
          );

      if (!transfer) {
        return res
          .status(404)
          .json({
            message:
              "Transfer not found",
          });
      }
            // =====================
      // AUDIT LOG
      // =====================
      await logAudit({
        user:
          req.user.id,

        branch:
          transfer.toBranch
            ?._id ||
          transfer.toBranch,

        action:
          "DELETE_TRANSFER",

        entityType:
          "Transfer",

        entityId:
          transfer._id,

        description:
          `Deleted transfer record for ${transfer.brand} ${transfer.model} (${transfer.imei}) from ${transfer.fromBranch?.name || "Unknown"} to ${transfer.toBranch?.name || "Unknown"}`,
      });

      await transfer.deleteOne();

      res.json({
        message:
          "Transfer deleted successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server Error",
      });
    }
  };

// =====================================
// EXPORTS
// =====================================
module.exports = {
  getTransfers,
  deleteTransfer,
};