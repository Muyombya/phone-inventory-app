const {
  buildCatalogue,
  getCatalogueProduct,
} = require("../services/catalogueService");

const ProductCatalogue =
  require("../models/ProductCatalogue");

const logAudit =
  require("../utils/auditLogger");

function ensureManager(req, res) {
  if (req.user?.role !== "manager") {
    res.status(403).json({
      success: false,
      message: "Managers only",
    });

    return false;
  }

  return true;
}

function normalizeHighlights(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeIdentity(body) {
  return {
    brand: String(body?.brand || "").trim(),
    model: String(body?.model || "").trim(),
    ram: String(body?.ram || "").trim(),
    storage: String(body?.storage || "").trim(),
  };
}

function normalizeMetadata(body) {
  return {
    imageUrl: String(body?.imageUrl || "").trim(),
    title: String(body?.title || "").trim(),
    description: String(
      body?.description || ""
    ).trim(),
    highlights:
      normalizeHighlights(body?.highlights),
    category:
      String(
        body?.category || "Smartphones"
      ).trim() || "Smartphones",
    visible:
      body?.visible !== false,
    featured:
      body?.featured === true,
    displayOrder:
      Number.isFinite(Number(body?.displayOrder))
        ? Number(body.displayOrder)
        : 0,
  };
}

async function getCatalogue(req, res) {
  try {
    const result =
      await buildCatalogue({
        branchId:
          req.query.branchId || null,
        search:
          req.query.search || "",
        limit:
          req.query.limit,
        includeHidden:
          req.user?.role === "manager" &&
          req.query.includeHidden === "true",
      });

    return res.json(result);
  } catch (error) {
    console.error(
      "Get Catalogue Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the product catalogue.",
    });
  }
}

async function getCatalogueItem(req, res) {
  try {
    const product =
      await getCatalogueProduct(
        req.params.key
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Catalogue product not found.",
      });
    }

    if (
      product.catalogue?.visible === false &&
      req.user?.role !== "manager"
    ) {
      return res.status(404).json({
        success: false,
        message: "Catalogue product not found.",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get Catalogue Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the catalogue product.",
    });
  }
}

async function createCatalogue(req, res) {
  try {
    if (!ensureManager(req, res)) return;

    const identity =
      normalizeIdentity(req.body);

    if (
      !identity.brand ||
      !identity.model ||
      !identity.ram ||
      !identity.storage
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Brand, model, RAM and storage are required.",
      });
    }

    const existing =
      await ProductCatalogue.findOne(
        identity
      );

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Catalogue entry already exists for this product.",
      });
    }

    const metadata =
      normalizeMetadata(req.body);

    const catalogue =
      await ProductCatalogue.create({
        ...identity,
        ...metadata,
        createdBy: req.user._id,
      });

    await logAudit({
      user: req.user._id,
      action: "CREATE_CATALOGUE_PRODUCT",
      entityType: "ProductCatalogue",
      entityId: catalogue._id,
      itemName:
        `${identity.brand} ${identity.model}`,
      itemDetails: {
        ...identity,
        ...metadata,
      },
      description:
        `Created catalogue entry for ${identity.brand} ${identity.model}.`,
    });

    return res.status(201).json({
      success: true,
      catalogue,
    });
  } catch (error) {
    console.error(
      "Create Catalogue Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Catalogue entry already exists for this product.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create catalogue entry.",
    });
  }
}

async function updateCatalogue(req, res) {
  try {
    if (!ensureManager(req, res)) return;

    const existing =
      await ProductCatalogue.findById(
        req.params.id
      );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Catalogue entry not found.",
      });
    }

    const metadata =
      normalizeMetadata(req.body);

    Object.assign(
      existing,
      metadata,
      {
        updatedBy: req.user._id,
      }
    );

    await existing.save();

    await logAudit({
      user: req.user._id,
      action: "UPDATE_CATALOGUE_PRODUCT",
      entityType: "ProductCatalogue",
      entityId: existing._id,
      itemName:
        `${existing.brand} ${existing.model}`,
      itemDetails: metadata,
      description:
        `Updated catalogue entry for ${existing.brand} ${existing.model}.`,
    });

    return res.json({
      success: true,
      catalogue: existing,
    });
  } catch (error) {
    console.error(
      "Update Catalogue Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update catalogue entry.",
    });
  }
}

module.exports = {
  getCatalogue,
  getCatalogueItem,
  createCatalogue,
  updateCatalogue,
};
