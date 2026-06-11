const mongoose =
  require("mongoose");

// =========================
// SOLD ITEM SCHEMA
// =========================
const soldItemSchema =
  new mongoose.Schema({
    phoneId: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "Phone",
    },

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

    buyingPrice: {
      type: Number,

      required: true,
    },

    sellingPrice: {
      type: Number,

      required: true,
    },

    finalPrice: {
      type: Number,

      required: true,
    },

    profit: {
      type: Number,

      required: true,
    },

    discount: {
      type: Number,

      default: 0,
    },

    branch: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "Branch",
    },
  });

// =========================
// MAIN SALE SCHEMA
// =========================
const saleSchema =
  new mongoose.Schema(
    {
      // =====================
      // ITEMS
      // =====================
      items: [
        soldItemSchema,
      ],

      // =====================
      // CUSTOMER
      // =====================
      customerName: {
        type: String,

        default:
          "Walk-in Customer",
      },

      customerPhone: {
        type: String,

        default: "",
      },

      // =====================
      // PAYMENT
      // =====================
      paymentMethod: {
        type: String,

        enum: [
          "Cash",
          "Mobile Money",
          "Bank",
        ],

        default: "Cash",
      },

      // =====================
      // ACTIVE FINANCIALS
      // =====================
      totalAmount: {
        type: Number,

        required: true,
      },

      totalProfit: {
        type: Number,

        required: true,
      },

      totalDiscount: {
        type: Number,

        default: 0,
      },

      // =====================
      // RETURN HISTORY
      // PRESERVES ORIGINALS
      // =====================
      returnedRevenue: {
        type: Number,

        default: 0,
      },

      returnedProfit: {
        type: Number,

        default: 0,
      },

      returnedDiscount: {
        type: Number,

        default: 0,
      },

      returnedAt: {
        type: Date,

        default: null,
      },

      // =====================
      // SALE STATUS
      // =====================
      status: {
        type: String,

        enum: [
          "Completed",
          "Returned",
        ],

        default:
          "Completed",
      },

      // =====================
      // RECEIPT
      // =====================
      receiptNumber: {
        type: String,

        unique: true,
      },

      // =====================
      // USER
      // =====================
      soldBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },

      // =====================
      // BRANCH
      // =====================
      branch: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Branch",
      },
    },

    {
      timestamps: true,
    }
  );

// =========================
// INDEXES
// =========================
saleSchema.index({
  createdAt: -1,
});

saleSchema.index({
  status: 1,
});

saleSchema.index({
  branch: 1,
});

saleSchema.index({
  returnedAt: -1,
});

// =========================
// EXPORT
// =========================
module.exports =
  mongoose.model(
    "Sale",
    saleSchema
  );
