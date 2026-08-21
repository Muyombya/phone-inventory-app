const Phone = require("../models/Phone");
const Sale = require("../models/Sale");
const ProductCatalogue = require("../models/ProductCatalogue");

const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 200;

function productKey(brand, model, ram, storage) {
  return [
    String(brand || "").trim().toLowerCase(),
    String(model || "").trim().toLowerCase(),
    String(ram || "").trim().toLowerCase(),
    String(storage || "").trim().toLowerCase(),
  ].join("|");
}

function completedSale(sale) {
  return sale?.status === "Completed";
}

function saleItems(sale) {
  return Array.isArray(sale?.items) ? sale.items : [];
}

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCatalogueMetadata(metadata) {
  if (!metadata) return null;

  return {
    id: metadata._id,
    imageUrl: metadata.imageUrl || "",
    title: metadata.title || "",
    description: metadata.description || "",
    highlights: Array.isArray(metadata.highlights)
      ? metadata.highlights
      : [],
    category: metadata.category || "Smartphones",
    visible: metadata.visible !== false,
    featured: metadata.featured === true,
    displayOrder: Number(metadata.displayOrder || 0),
  };
}

function buildBranchPositionMap(phones, branches) {
  const branchMap = new Map();

  for (const branch of branches || []) {
    const id = String(branch?._id || branch?.id || "");
    if (!id) continue;

    branchMap.set(id, {
      branchId: branch._id || branch.id,
      branchName: branch.name || "Unknown Branch",
      units: 0,
    });
  }

  for (const phone of phones || []) {
    const id = String(phone?.branch?._id || phone?.branch || "");
    if (!id) continue;

    if (!branchMap.has(id)) {
      branchMap.set(id, {
        branchId: phone.branch?._id || phone.branch,
        branchName:
          phone.branch?.name ||
          "Unknown Branch",
        units: 0,
      });
    }

    branchMap.get(id).units += 1;
  }

  return branchMap;
}

async function buildCatalogue(options = {}) {
  const branchId = options.branchId
    ? String(options.branchId)
    : null;
  const search = normalizeSearch(options.search);
  const limit = normalizeLimit(options.limit);
  const includeHidden = options.includeHidden === true;

  const phoneQuery = branchId
    ? { branch: branchId }
    : {};

  const saleQuery = branchId
    ? { branch: branchId }
    : {};

  const [phones, sales, metadataRecords] =
    await Promise.all([
      Phone.find(phoneQuery)
        .select(
          "brand model ram storage color branch sellingPrice createdAt"
        )
        .populate("branch", "name")
        .lean(),

      Sale.find(saleQuery)
        .select(
          "items branch createdAt status returnedAt"
        )
        .sort({ createdAt: -1 })
        .lean(),

      ProductCatalogue.find()
        .lean(),
    ]);

  const metadataMap = new Map(
    metadataRecords.map((record) => [
      productKey(
        record.brand,
        record.model,
        record.ram,
        record.storage
      ),
      record,
    ])
  );

  const catalog = new Map();

  const ensure = (item) => {
    const brand = String(item?.brand || "").trim();
    const model = String(item?.model || "").trim();
    const ram = String(item?.ram || "").trim();
    const storage = String(item?.storage || "").trim();

    if (!brand || !model) return null;

    const key = productKey(
      brand,
      model,
      ram,
      storage
    );

    if (!catalog.has(key)) {
      catalog.set(key, {
        key,
        brand,
        model,
        ram,
        storage,
        currentStock: 0,
        totalSold: 0,
        firstSeenAt: null,
        lastSoldAt: null,
        colours: new Set(),
        sellingPrices: [],
        branchUnits: new Map(),
      });
    }

    return catalog.get(key);
  };

  for (const phone of phones) {
    const row = ensure(phone);
    if (!row) continue;

    row.currentStock += 1;

    if (phone.color) {
      row.colours.add(phone.color);
    }

    if (Number.isFinite(Number(phone.sellingPrice))) {
      row.sellingPrices.push(
        Number(phone.sellingPrice)
      );
    }

    const created = phone.createdAt
      ? new Date(phone.createdAt)
      : null;

    if (
      created &&
      !Number.isNaN(created.getTime()) &&
      (!row.firstSeenAt ||
        created < row.firstSeenAt)
    ) {
      row.firstSeenAt = created;
    }

    const branchIdValue = String(
      phone.branch?._id ||
        phone.branch ||
        ""
    );

    if (branchIdValue) {
      row.branchUnits.set(
        branchIdValue,
        (row.branchUnits.get(branchIdValue) || 0) + 1
      );
    }
  }

  for (const sale of sales) {
    if (!completedSale(sale)) continue;

    for (const item of saleItems(sale)) {
      const row = ensure(item);
      if (!row) continue;

      row.totalSold += 1;

      if (item.color) {
        row.colours.add(item.color);
      }

      const soldAt = sale.createdAt
        ? new Date(sale.createdAt)
        : null;

      if (
        soldAt &&
        !Number.isNaN(soldAt.getTime())
      ) {
        if (
          !row.firstSeenAt ||
          soldAt < row.firstSeenAt
        ) {
          row.firstSeenAt = soldAt;
        }

        if (
          !row.lastSoldAt ||
          soldAt > row.lastSoldAt
        ) {
          row.lastSoldAt = soldAt;
        }
      }
    }
  }

  const branchIds = new Set();

  for (const phone of phones) {
    const id = String(
      phone?.branch?._id ||
        phone?.branch ||
        ""
    );

    if (id) branchIds.add(id);
  }

  const Branch = require("../models/Branch");

  const branches = await Branch.find(
    branchIds.size
      ? { _id: { $in: Array.from(branchIds) } }
      : {}
  )
    .select("name location contact")
    .lean();

  const branchPositionMap =
    buildBranchPositionMap(
      phones,
      branches
    );

  let results = Array.from(catalog.values())
    .map((row) => {
      const metadata =
        metadataMap.get(row.key);

      const prices =
        row.sellingPrices.filter(
          (value) => Number.isFinite(value)
        );

      const sellingPrice =
        prices.length
          ? prices[0]
          : null;

      const branchAvailability =
        Array.from(
          row.branchUnits.entries()
        )
          .map(([id, units]) => {
            const branch =
              branchPositionMap.get(id);

            return {
              branchId:
                branch?.branchId || id,
              branchName:
                branch?.branchName ||
                "Unknown Branch",
              units,
            };
          })
          .sort((a, b) =>
            a.branchName.localeCompare(
              b.branchName
            )
          );

      return {
        key: row.key,
        brand: row.brand,
        model: row.model,
        ram: row.ram,
        storage: row.storage,
        currentStock: row.currentStock,
        totalSold: row.totalSold,
        firstSeenAt: row.firstSeenAt,
        lastSoldAt: row.lastSoldAt,
        colours: Array.from(row.colours).sort(),
        sellingPrice,

        status:
          row.currentStock === 0
            ? "Historical / Sold Out"
            : row.currentStock <= 1
            ? "Critical"
            : row.currentStock <= 3
            ? "Low"
            : "In Stock",

        branchAvailability,

        catalogue:
          normalizeCatalogueMetadata(
            metadata
          ),
      };
    })
    .filter((product) => {
      if (
        !includeHidden &&
        product.catalogue &&
        product.catalogue.visible === false
      ) {
        return false;
      }

      if (!search) return true;

      const haystack = [
        product.brand,
        product.model,
        product.ram,
        product.storage,
        ...product.colours,
        product.catalogue?.title,
        product.catalogue?.description,
        ...(product.catalogue?.highlights || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    })
    .sort((a, b) => {
      const aFeatured =
        a.catalogue?.featured === true ? 1 : 0;
      const bFeatured =
        b.catalogue?.featured === true ? 1 : 0;

      return (
        bFeatured - aFeatured ||
        Number(
          a.catalogue?.displayOrder || 0
        ) -
          Number(
            b.catalogue?.displayOrder || 0
          ) ||
        (a.currentStock === 0 ? 1 : 0) -
          (b.currentStock === 0 ? 1 : 0) ||
        a.brand.localeCompare(b.brand) ||
        a.model.localeCompare(b.model) ||
        a.ram.localeCompare(b.ram) ||
        a.storage.localeCompare(b.storage)
      );
    })
    .slice(0, limit);

  return {
    reportType: "PRODUCT_CATALOG",
    generatedAt: new Date(),
    scope: {
      branchId: branchId || null,
    },
    products: results,
  };
}

async function getCatalogueProduct(key) {
  const catalog = await buildCatalogue({
    includeHidden: true,
    limit: MAX_LIMIT,
  });

  const product = catalog.products.find(
    (item) => item.key === key
  );

  return product || null;
}

module.exports = {
  buildCatalogue,
  getCatalogueProduct,
  productKey,
};
