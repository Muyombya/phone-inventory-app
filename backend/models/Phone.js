const mongoose = require("mongoose");

const phoneSchema = new mongoose.Schema(
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
    },

    ram: {
      type: String,
    },

    color: {
      type: String,
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Phone", phoneSchema);