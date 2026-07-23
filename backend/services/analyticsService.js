import InventoryAnalytics from "../models/InventoryAnalytics.js";

/**
 * Updates lifetime analytics whenever stock
 * is added into inventory.
 */
export async function recordPurchase(phone) {
  const now = new Date();

  const analytics =
    await InventoryAnalytics.findOne({
      brand: phone.brand.trim(),
      model: phone.model.trim(),
      ram: phone.ram.trim(),
      storage: phone.storage.trim(),
    });

  // ======================================
  // FIRST TIME THIS PRODUCT HAS EVER EXISTED
  // ======================================
  if (!analytics) {
    return await InventoryAnalytics.create({
      brand: phone.brand.trim(),
      model: phone.model.trim(),
      ram: phone.ram.trim(),
      storage: phone.storage.trim(),

      currentStock: 1,
      totalAdded: 1,

      averageBuyingPrice:
        phone.buyingPrice || 0,

      averageSellingPrice:
        phone.sellingPrice || 0,

      totalCost:
        phone.buyingPrice || 0,

      firstAddedAt: now,
      lastAddedAt: now,
      lastUpdatedAt: now,
    });
  }

  // ======================================
  // PRODUCT ALREADY EXISTS
  // ======================================

  analytics.currentStock += 1;

  analytics.totalAdded += 1;

  // Running average buying price

  analytics.averageBuyingPrice =
    (
      (analytics.averageBuyingPrice *
        (analytics.totalAdded - 1))
      +
      (phone.buyingPrice || 0)
    )
    /
    analytics.totalAdded;

  // Running average selling price

  analytics.averageSellingPrice =
    (
      (analytics.averageSellingPrice *
        (analytics.totalAdded - 1))
      +
      (phone.sellingPrice || 0)
    )
    /
    analytics.totalAdded;

  analytics.totalCost +=
    phone.buyingPrice || 0;

  analytics.lastAddedAt = now;

  analytics.lastUpdatedAt = now;

  return await analytics.save();
}