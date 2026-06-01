const Sale =
  require("../models/Sale");

const Phone =
  require("../models/Phone");

const Counter =
  require("../models/Counter");

const Return =
  require("../models/Return");

const logAudit =
  require("../utils/auditLogger");

// =========================
// RECEIPT NUMBER
// =========================
const generateReceiptNumber =
  async () => {
    const counter =
      await Counter.findOneAndUpdate(
        {
          name:
            "saleReceipt",
        },
        {
          $inc: {
            value: 1,
          },
        },
        {
          returnDocument:
            "after",

          upsert: true,
        }
      );

    const year =
      new Date().getFullYear();

    return `GS-${year}-${String(
      counter.value
    ).padStart(
      5,
      "0"
    )}`;
  };

// =========================
// RESTORE INVENTORY
// =========================
const restoreSaleInventory =
  async (sale) => {
    for (const item of sale.items) {
      const existingPhone =
        await Phone.findOne({
          imei:
            item.imei,
        });

      if (
        existingPhone
      ) {
        continue;
      }

      await Phone.create({
        brand:
          item.brand,

        model:
          item.model,

        imei:
          item.imei,

        buyingPrice:
          item.buyingPrice,

        sellingPrice:
          item.sellingPrice,

        branch:
          sale.branch,

        addedBy:
          sale.soldBy,

        soldPrice: 0,

        profit: 0,

        soldAt: null,
      });
    }
  };

// =========================
// MANAGER ONLY
// =========================
const ensureManager =
  (req, res) => {
    if (
      req.user.role !==
      "manager"
    ) {
      res
        .status(403)
        .json({
          message:
            "Managers only",
        });

      return false;
    }

    return true;
  };

// =========================
// CREATE SALE
// =========================
const createSale =
  async (
    req,
    res
  ) => {
    try {
      const {
        items,
        customerName,
        customerPhone,
        paymentMethod,
      } = req.body;

      if (
        !items ||
        items.length === 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "No items selected",
          });
      }

      const soldItems =
        [];

      let totalAmount =
        0;

      let totalProfit =
        0;

      let totalDiscount =
        0;

      for (const item of items) {
        const phone =
          await Phone.findById(
            item.phoneId
          );

        if (!phone) {
          return res
            .status(404)
            .json({
              message:
                "Phone not found",
            });
        }

        const discount =
          Number(
            item.discount ||
              0
          );

        const finalPrice =
          Number(
            phone.sellingPrice
          ) -
          (
            Number(
              phone.sellingPrice
            ) *
            discount
          ) /
            100;

        const profit =
          finalPrice -
          Number(
            phone.buyingPrice
          );

        soldItems.push({
          phoneId:
            phone._id,

          brand:
            phone.brand,

          model:
            phone.model,

          imei:
            phone.imei,

          buyingPrice:
            phone.buyingPrice,

          sellingPrice:
            phone.sellingPrice,

          finalPrice,

          profit,

          discount,
        });

        totalAmount +=
          finalPrice;

        totalProfit +=
          profit;

        totalDiscount +=
          discount;

        await Phone.findByIdAndDelete(
          phone._id
        );
      }

      const receiptNumber =
        await generateReceiptNumber();

      const sale =
        await Sale.create({
          items:
            soldItems,

          customerName:
            customerName ||
            "Walk-in Customer",

          customerPhone:
            customerPhone ||
            "",

          paymentMethod:
            paymentMethod ||
            "Cash",

          totalAmount,

          totalProfit,

          totalDiscount,

          returnedRevenue: 0,

          returnedProfit: 0,

          returnedDiscount: 0,

          returnedAt: null,

          status:
            "Completed",

          receiptNumber,

          soldBy:
            req.user._id,

          branch:
            req.user.branch,
        });

      await logAudit({
        user:
          req.user._id,

        branch:
          req.user.branch,

        action:
          "CREATE_SALE",

        entityType:
          "Sale",

        entityId:
          sale._id,

        description:
          `Created sale ${sale.receiptNumber}`,
      });

      res
        .status(201)
        .json(sale);
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
 
  // =========================
// GET ALL SALES
// WITH DATE FILTERING
// =========================
const getSales =
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

      const sales =
        await Sale.find(
          filter
        )
          .populate(
            "soldBy",
            "username"
          )
          .populate(
            "branch",
            "name location contact"
          )
          .sort({
            createdAt:
              -1,
          });

      res.json(
        sales
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

// =========================
// GET SINGLE SALE
// =========================
const getSaleById =
  async (
    req,
    res
  ) => {
    try {
      const sale =
        await Sale.findById(
          req.params.id
        )
          .populate(
            "soldBy",
            "username"
          )
          .populate(
            "branch",
            "name location contact"
          );

      if (!sale) {
        return res
          .status(404)
          .json({
            message:
              "Sale not found",
          });
      }

      res.json(
        sale
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

// =========================
// DELETE SALE
// RESTORE INVENTORY
// REMOVE COMPLETELY
// =========================
const deleteSale =
  async (
    req,
    res
  ) => {
    try {
      if (
        !ensureManager(
          req,
          res
        )
      ) {
        return;
      }

      const sale =
        await Sale.findById(
          req.params.id
        );

      if (!sale) {
        return res
          .status(404)
          .json({
            message:
              "Sale not found",
          });
      }

      await restoreSaleInventory(
        sale
      );

      await logAudit({
        user:
          req.user._id,

        branch:
          req.user.branch,

        action:
          "DELETE_SALE",

        entityType:
          "Sale",

        entityId:
          sale._id,

        description:
          `Deleted sale ${sale.receiptNumber} and restored inventory`,
      });

      await Sale.findByIdAndDelete(
        sale._id
      );

      res.json({
        message:
          "Sale deleted successfully",
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
  // =========================
// RETURN SALE
// FINANCIAL REVERSAL
// =========================
const returnSale =
  async (
    req,
    res
  ) => {
    try {
      if (
        !ensureManager(
          req,
          res
        )
      ) {
        return;
      }

      const {
        reason,
      } = req.body;

      if (
        !reason ||
        !reason.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Return reason is required",
          });
      }

      const sale =
        await Sale.findById(
          req.params.id
        );

      if (!sale) {
        return res
          .status(404)
          .json({
            message:
              "Sale not found",
          });
      }

      // =====================
      // ALREADY RETURNED
      // =====================
      if (
        sale.status ===
        "Returned"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Sale already returned",
          });
      }

      // =====================
      // CHECK RETURN RECORD
      // =====================
      const existingReturn =
        await Return.findOne({
          sale:
            sale._id,
        });

      if (
        existingReturn
      ) {
        return res
          .status(400)
          .json({
            message:
              "Return already exists",
          });
      }

      // =====================
      // CREATE RETURN RECORD
      // =====================
      const returnRecord =
        await Return.create({
          sale:
            sale._id,

          items:
            sale.items.map(
              (
                item
              ) => ({
                brand:
                  item.brand,

                model:
                  item.model,

                imei:
                  item.imei,

                buyingPrice:
                  item.buyingPrice,

                sellingPrice:
                  item.sellingPrice,

                finalPrice:
                  item.finalPrice,
              })
            ),

          reason,

          returnedBy:
            req.user._id,

          branch:
            sale.branch,
        });

      // =====================
      // RESTORE INVENTORY
      // =====================
      await restoreSaleInventory(
        sale
      );

      // =====================
      // STORE ORIGINALS
      // =====================
      sale.returnedRevenue =
        sale.totalAmount;

      sale.returnedProfit =
        sale.totalProfit;

      sale.returnedDiscount =
        sale.totalDiscount;

      sale.returnedAt =
        new Date();

      // =====================
      // FINANCIAL REVERSAL
      // =====================
      sale.totalAmount = 0;

      sale.totalProfit = 0;

      sale.totalDiscount = 0;

      // =====================
      // STATUS
      // =====================
      sale.status =
        "Returned";

      await sale.save();

      // =====================
      // AUDIT
      // =====================
      await logAudit({
        user:
          req.user._id,

        branch:
          req.user.branch,

        action:
          "RETURN_SALE",

        entityType:
          "Sale",

        entityId:
          sale._id,

        description:
          `Returned sale ${sale.receiptNumber}. Revenue reversed. Reason: ${reason}`,
      });

      res.json({
        message:
          "Sale returned successfully",

        returnRecord,
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

// =========================
// PURGE SALE
// TEST DATA CLEANUP
// =========================
const purgeSale =
  async (
    req,
    res
  ) => {
    try {
      if (
        !ensureManager(
          req,
          res
        )
      ) {
        return;
      }

      const sale =
        await Sale.findById(
          req.params.id
        );

      if (!sale) {
        return res
          .status(404)
          .json({
            message:
              "Sale not found",
          });
      }

      await logAudit({
        user:
          req.user._id,

        branch:
          req.user.branch,

        action:
          "PURGE_SALE",

        entityType:
          "Sale",

        entityId:
          sale._id,

        description:
          `Purged sale ${sale.receiptNumber}`,
      });

      await Sale.findByIdAndDelete(
        sale._id
      );

      res.json({
        message:
          "Sale permanently purged",
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

// =========================
// EXPORTS
// =========================
module.exports = {
  createSale,
  getSales,
  getSaleById,
  deleteSale,
  returnSale,
  purgeSale,
};