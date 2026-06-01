const mongoose =
  require("mongoose");

const transferSchema =
  new mongoose.Schema(
    {
      phone: {
        type:
          mongoose.Schema
            .Types.ObjectId,

        ref: "Phone",

        required: true,
      },

      // =========================
      // PHONE DETAILS SNAPSHOT
      // =========================
      brand: {
        type: String,
        required: true,
      },

      model: {
        type: String,
        required: true,
      },

      imei: {
        type: String,
        required: true,
      },

      // =========================
      // BRANCHES
      // =========================
      fromBranch: {
        type:
          mongoose.Schema
            .Types.ObjectId,

        ref: "Branch",

        required: true,
      },

      toBranch: {
        type:
          mongoose.Schema
            .Types.ObjectId,

        ref: "Branch",

        required: true,
      },

      // =========================
      // USER
      // =========================
      transferredBy: {
        type:
          mongoose.Schema
            .Types.ObjectId,

        ref: "User",

        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Transfer",
    transferSchema
  );