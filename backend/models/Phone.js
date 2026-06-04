
const mongoose =
  require("mongoose");

const phoneSchema =
  new mongoose.Schema(
    {
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
        unique: true,
      },

      storage: {
        type: String,
        required: true,
      },

      ram: {
        type: String,
        required: true,
      },

      color: {
        type: String,
        required: true,
      },

      buyingPrice: {
        type: Number,
        required: true,
      },

      sellingPrice: {
        type: Number,
        required: true,
      },

      branch: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
      },

      addedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      soldPrice: {
        type: Number,
        default: 0,
      },

      profit: {
        type: Number,
        default: 0,
      },

      soldAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Phone",
    phoneSchema
  );

