const mongoose =
  require("mongoose");

const returnSchema =
  new mongoose.Schema(
    {
      sale: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Sale",

        required: true,
      },

      items: [
        {
          brand: String,

          model: String,

          imei: String,

          buyingPrice:
            Number,

          sellingPrice:
            Number,

          finalPrice:
            Number,
        },
      ],

      reason: {
        type: String,

        required: true,
      },

      returnedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      branch: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Branch",

        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Return",
    returnSchema
  );