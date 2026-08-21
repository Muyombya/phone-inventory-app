const mongoose = require("mongoose");

const productCatalogueSchema =
  new mongoose.Schema(
    {
      // =========================
      // PRODUCT IDENTITY
      // =========================
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

      // =========================
      // CATALOGUE PRESENTATION
      // =========================
      imageUrl: {
        type: String,
        default: "",
        trim: true,
      },

      title: {
        type: String,
        default: "",
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      highlights: {
        type: [String],
        default: [],
      },

      category: {
        type: String,
        default: "Smartphones",
        trim: true,
      },

      // =========================
      // CATALOGUE VISIBILITY
      // =========================
      visible: {
        type: Boolean,
        default: true,
      },

      featured: {
        type: Boolean,
        default: false,
      },

      displayOrder: {
        type: Number,
        default: 0,
      },

      // =========================
      // AUDIT OWNERSHIP
      // =========================
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

// =====================================
// ONE CATALOGUE RECORD PER PRODUCT
// =====================================
productCatalogueSchema.index(
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

const ProductCatalogue =
  mongoose.model(
    "ProductCatalogue",
    productCatalogueSchema
  );

module.exports =
  ProductCatalogue;