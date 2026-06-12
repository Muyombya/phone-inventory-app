const Phone =
  require("../models/Phone");

const Branch =
  require("../models/Branch");

const Transfer =
  require("../models/Transfer");

const Sale =
  require("../models/Sale");

const logAudit =
  require("../utils/auditLogger");

// ===================================
// GET ALL PHONES
// ===================================
const getPhones =
  async (req, res) => {
    try {
      let query = {};

      // =========================
      // MANAGER SEES EVERYTHING
      // =========================
      if (
        req.user.role !==
        "manager"
      ) {
        query.branch =
          req.user.branch;
      }

      const phones =
        await Phone.find(
          query
        )
          .populate(
            "branch",
            "name"
          )
          .sort({
            createdAt:
              -1,
          });

      res.json(
        phones
      );
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };

// ===================================
// GET SINGLE PHONE
// ===================================
const getPhoneById =
  async (req, res) => {
    try {
      const phone =
        await Phone.findById(
          req.params.id
        ).populate(
          "branch",
          "name"
        );

      if (!phone) {
        return res
          .status(404)
          .json({
            message:
              "Phone not found",
          });
      }

      // =========================
      // BRANCH SECURITY
      // =========================
      if (
        req.user.role !==
          "manager" &&
        phone.branch?._id.toString() !==
          req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }

      res.json(phone);
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };

// ===================================
// ADD PHONE
// ===================================
const addPhone =
  async (req, res) => {
    try {
      const {
              brand,
              model,
              imei,
              storage,
              ram,
              color,
              buyingPrice,
              sellingPrice,
              branch,
            } = req.body;

      const existingPhone =
        await Phone.findOne(
          {
            imei,
          }
        );

      if (
        existingPhone
      ) {
        return res
          .status(400)
          .json({
            message:
              "Phone with this IMEI already exists",
          });
      }

      const assignedBranch =
        branch ||
        req.user.branch;

      if (!assignedBranch) {
        return res
          .status(400)
          .json({
            message:
              "Please select a branch for this phone",
          });
      }

      const branchExists =
        await Branch.findById(
          assignedBranch
        );

      if (!branchExists) {
        return res
          .status(400)
          .json({
            message:
              "Selected branch was not found",
          });
      }

      const phone =
        await Phone.create(
              {
                brand,
                model,
                imei,
                storage,
                ram,
                color,
                buyingPrice,
                sellingPrice,
                branch:
                  assignedBranch,
                addedBy:
                  req.user.id,
          }
  );
      // =========================
      // AUDIT LOG
      // =========================
      await logAudit({
        user:
          req.user.id,

        branch:
          assignedBranch,

        action:
          "ADD_PHONE",

        entityType:
          "Phone",

        entityId:
          phone._id,

        description:
          `Added ${phone.brand} ${phone.model} (${phone.imei}) to inventory`,
      });

      res
        .status(201)
        .json(phone);
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };

// ===================================
// UPDATE PHONE
// ===================================
const updatePhone =
  async (req, res) => {
    try {
      const phone =
        await Phone.findById(
          req.params.id
        );

      if (!phone) {
        return res
          .status(404)
          .json({
            message:
              "Phone not found",
          });
      }

      if (
        req.user.role !==
          "manager" &&
        phone.branch?.toString() !==
          req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }

      const oldBrand =
        phone.brand;

      const oldModel =
        phone.model;

      const oldImei =
        phone.imei;

      phone.brand =
        req.body.brand ||
        phone.brand;

      phone.model =
        req.body.model ||
        phone.model;

      phone.imei =
        req.body.imei ||
        phone.imei;

      phone.buyingPrice =
        req.body
          .buyingPrice ||
        phone.buyingPrice;

      phone.sellingPrice =
        req.body
          .sellingPrice ||
        phone.sellingPrice;

      phone.storage =
        req.body.storage ||
        phone.storage;

      phone.ram =
        req.body.ram ||
        phone.ram;

      phone.color =
        req.body.color ||
        phone.color;

      if (
        req.user.role ===
        "manager"
      ) {
        phone.branch =
          req.body.branch ||
          phone.branch;
      }

      const updatedPhone =
        await phone.save();

      await logAudit({
        user:
          req.user.id,

        branch:
          phone.branch,

        action:
          "UPDATE_PHONE",

        entityType:
          "Phone",

        entityId:
          phone._id,

        description:
          `Updated ${oldBrand} ${oldModel} (${oldImei})`,
      });

      res.json(
        updatedPhone
      );
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };
  // ===================================
// DELETE PHONE
// ===================================
const deletePhone =
  async (req, res) => {
    try {
      const phone =
        await Phone.findById(
          req.params.id
        );

      if (!phone) {
        return res
          .status(404)
          .json({
            message:
              "Phone not found",
          });
      }

      // =========================
      // BRANCH SECURITY
      // =========================
      if (
        req.user.role !==
          "manager" &&
        phone.branch?.toString() !==
          req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }

      await logAudit({
        user:
          req.user.id,

        branch:
          phone.branch,

        action:
          "DELETE_PHONE",

        entityType:
          "Phone",

        entityId:
          phone._id,

        description:
          `Deleted ${phone.brand} ${phone.model} (${phone.imei}) from inventory`,
      });

      await phone.deleteOne();

      res.json({
        message:
          "Phone deleted successfully",
      });
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };

// ===================================
// TRANSFER PHONE
// ===================================
const transferPhone =
  async (req, res) => {
    try {
      const phone =
        await Phone.findById(
          req.params.id
        );

      if (!phone) {
        return res
          .status(404)
          .json({
            message:
              "Phone not found",
          });
      }

      const {
        branchId,
      } = req.body;

      const newBranch =
        await Branch.findById(
          branchId
        );

      if (!newBranch) {
        return res
          .status(404)
          .json({
            message:
              "Branch not found",
          });
      }

      // =========================
      // SECURITY
      // =========================
      if (
        req.user.role !==
          "manager" &&
        phone.branch?.toString() !==
          req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }
const oldBranchData =
  await Branch.findById(
    phone.branch
  );

const oldBranchName =
  oldBranchData?.name ||
  "Unknown Branch";

      // =========================
      // SAVE TRANSFER
      // =========================
      const transfer =
        await Transfer.create({
          phone:
            phone._id,

          brand:
            phone.brand,

          model:
            phone.model,

          imei:
            phone.imei,

          fromBranch:
            phone.branch,

          toBranch:
            branchId,

          transferredBy:
            req.user.id,
        });

      // =========================
      // UPDATE BRANCH
      // =========================
      phone.branch =
        branchId;

      await phone.save();

      // =========================
      // AUDIT LOG
      // =========================
      await logAudit({
  user:
    req.user.id,

  branch:
    branchId,

  sourceBranch:
    oldBranchData._id,

  destinationBranch:
    newBranch._id,

  affectedBranches: [
    oldBranchData._id,
    newBranch._id,
  ],

  action:
    "TRANSFER",

  entityType:
    "Phone",

  entityId:
    phone._id,

  description:
    `Transferred ${phone.brand} ${phone.model} (${phone.imei}) from ${oldBranchName} to ${newBranch.name}`,
});

      res
        .status(201)
        .json({
          message:
            "Phone transferred successfully",

          transfer,
        });
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };
  // ===================================
// SELL PHONE
// ===================================
const sellPhone =
  async (req, res) => {
    try {
      const phone =
        await Phone.findById(
          req.params.id
        );

      if (!phone) {
        return res
          .status(404)
          .json({
            message:
              "Phone not found",
          });
      }

      // =========================
      // BRANCH SECURITY
      // =========================
      if (
        req.user.role !==
          "manager" &&
        phone.branch?.toString() !==
          req.user.branch?.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied",
          });
      }

      const {
        customerName,
        customerPhone,
        paymentMethod,
        discount,
        notes,
      } = req.body;

      const discountPercent =
        Number(
          discount || 0
        );

      const originalPrice =
        Number(
          phone.sellingPrice
        );

      const discountAmount =
        (
          originalPrice *
          discountPercent
        ) /
        100;

      const finalPrice =
        originalPrice -
        discountAmount;

      const profit =
        finalPrice -
        Number(
          phone.buyingPrice
        );

      const receiptNumber =
        `RCPT-${Date.now()}`;

      const sale =
        await Sale.create({
          phone:
            phone._id,

          brand:
            phone.brand,

          model:
            phone.model,

          imei:
            phone.imei,

          branch:
            phone.branch,

          soldBy:
            req.user.id,

          customerName,

          customerPhone,

          paymentMethod,

          originalPrice,

          discount:
            discountPercent,

          finalPrice,

          buyingPrice:
            phone.buyingPrice,

          profit,

          receiptNumber,

          notes,
        });

      // =========================
      // AUDIT LOG
      // =========================
      await logAudit({
        user:
          req.user.id,

        branch:
          phone.branch,

        action:
          "SALE",

        entityType:
          "Phone",

        entityId:
          phone._id,

        description:
          `Sold ${phone.brand} ${phone.model} (${phone.imei}) to ${customerName}`,
      });

      // =========================
      // REMOVE PHONE
      // =========================
      await phone.deleteOne();

      res
        .status(201)
        .json({
          message:
            "Phone sold successfully",

          sale,
        });
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Server error",
        });
    }
  };

// ===================================
// EXPORTS
// ===================================
module.exports = {
  getPhones,
  getPhoneById,
  addPhone,
  updatePhone,
  deletePhone,
  transferPhone,
  sellPhone,
};
