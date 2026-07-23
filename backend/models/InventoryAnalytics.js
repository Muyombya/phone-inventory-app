import mongoose from "mongoose";

const inventoryAnalyticsSchema = new mongoose.Schema(
  {
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

    // Inventory Metrics
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAdded: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Transfer Metrics
    totalTransferredIn: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTransferredOut: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Financial Metrics
    totalRevenue: {
      type: Number,
      default: 0,
    },

    totalCost: {
      type: Number,
      default: 0,
    },

    grossProfit: {
      type: Number,
      default: 0,
    },

    averageBuyingPrice: {
      type: Number,
      default: 0,
    },

    averageSellingPrice: {
      type: Number,
      default: 0,
    },

    // Important Dates
    firstAddedAt: {
      type: Date,
    },

    lastAddedAt: {
      type: Date,
    },

    lastSoldAt: {
      type: Date,
    },

    lastUpdatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// One analytics record per unique phone variant
inventoryAnalyticsSchema.index(
  {
    brand: 1,
    model: 1,
    ram: 1,
    storage: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "InventoryAnalytics",
  inventoryAnalyticsSchema
);