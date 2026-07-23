import mongoose from "mongoose";

const inventoryEventSchema = new mongoose.Schema(
  {
    // Event Information
    type: {
      type: String,
      required: true,
      enum: [
        "PURCHASE",
        "SALE",
        "TRANSFER_IN",
        "TRANSFER_OUT",
        "RETURN",
        "ADJUSTMENT",
        "WRITE_OFF",
      ],
    },

    // Product Identity
    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    ram: {
      type: String,
      required: true,
      trim: true,
    },

    storage: {
      type: String,
      required: true,
      trim: true,
    },

    // Transaction Details
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    buyingPrice: {
      type: Number,
      default: 0,
    },

    sellingPrice: {
      type: Number,
      default: 0,
    },

    // Traceability
    branch: {
      type: String,
      trim: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    source: {
      type: String,
      default: "SYSTEM",
    },

    reference: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
    },

    occurredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
inventoryEventSchema.index({
  occurredAt: -1,
});

inventoryEventSchema.index({
  type: 1,
});

inventoryEventSchema.index({
  brand: 1,
  model: 1,
});

inventoryEventSchema.index({
  branch: 1,
});

export default mongoose.model(
  "InventoryEvent",
  inventoryEventSchema
);