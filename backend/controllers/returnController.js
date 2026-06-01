const Return =
  require("../models/Return");

// =====================================
// GET ALL RETURNS
// WITH DATE FILTERING
// =====================================
const getReturns =
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
      // BRANCH SCOPING
      // =====================
      if (
        req.user.role !==
        "manager"
      ) {
        filter.branch =
          req.user.branch;
      }

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

      const returns =
        await Return.find(
          filter
        )
          .populate(
            "sale",
            `
            receiptNumber
            customerName
            customerPhone
            returnedRevenue
            returnedProfit
            returnedAt
            status
            items
            `
          )
          .populate(
            "returnedBy",
            "username"
          )
          .populate(
            "branch",
            "name"
          )

         .sort({
            createdAt: -1
          });   

      res.json(
        returns
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
// GET SINGLE RETURN
// =====================================
const getReturnById =
  async (
    req,
    res
  ) => {
    try {
      const returnRecord =
        await Return.findById(
          req.params.id
        )
          .populate(
            "sale"
          )
          .populate(
            "returnedBy",
            "username"
          )
          .populate(
            "branch",
            "name"
          );

      if (
        !returnRecord
      ) {
        return res
          .status(404)
          .json({
            message:
              "Return not found",
          });
      }      // =====================
      // BRANCH SECURITY
      // =====================
      if (
        req.user.role !==
          "manager" &&
        returnRecord.branch
          ?._id
          ?.toString() !==
          req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }

      res.json(
        returnRecord
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
// GET RETURNS ANALYTICS
// =====================================
const getReturnsAnalytics =
  async (
    req,
    res
  ) => {
    try {
      let filter =
        {};

      // =====================
      // BRANCH SCOPING
      // =====================
      if (
        req.user.role !==
        "manager"
      ) {
        filter.branch =
          req.user.branch;
      }

      const returns =
        await Return.find(
          filter
        );

      const totalReturns =
        returns.length;

      const returnedPhones =
        returns.reduce(
          (
            total,
            record
          ) =>
            total +
            (
              record.items
                ?.length || 0
            ),
          0
        );

      const returnedRevenue =
        returns.reduce(
          (
            total,
            record
          ) =>
            total +
            (
              record.items?.reduce(
                (
                  itemTotal,
                  item
                ) =>
                  itemTotal +
                  Number(
                    item.finalPrice ||
                      0
                  ),
                0
              ) || 0
            ),
          0
        );

      const averageReturnValue =
        totalReturns > 0
          ? Math.round(
              returnedRevenue /
                totalReturns
            )
          : 0;

      // =====================
      // RETURN REASONS
      // =====================
      const reasonMap =
        {};

      returns.forEach(
        (
          record
        ) => {
          const reason =
            record.reason ||
            "Unspecified";

          if (
            !reasonMap[
              reason
            ]
          ) {
            reasonMap[
              reason
            ] = 0;
          }

          reasonMap[
            reason
          ] += 1;
        }
      );

      const topReasons =
        Object.entries(
          reasonMap
        )
          .map(
            (
              [
                reason,
                count,
              ]
            ) => ({
              reason,
              count,
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              b.count -
              a.count
          )
          .slice(
            0,
            10
          );

      res.json({
        totalReturns,

        returnedPhones,

        returnedRevenue,

        averageReturnValue,

        topReasons,
      });
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
// EXPORTS
// =====================================
module.exports = {
  getReturns,
  getReturnById,
  getReturnsAnalytics,
};