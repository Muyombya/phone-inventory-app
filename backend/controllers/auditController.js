const Audit = require("../models/Audit");
const Sale = require("../models/Sale");

const getAuditLogs = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== "manager") {
      const branchId = req.user.branch?._id || req.user.branch;
      query = {
        $or: [
          { branch: branchId },
          { affectedBranches: branchId },
          { sourceBranch: branchId },
          { destinationBranch: branchId },
        ],
      };
    }

    const logs = await Audit.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "username role")
      .populate("branch", "name")
      .populate("sourceBranch", "name")
      .populate("destinationBranch", "name")
      .lean();

    // ---------------------------------------------------------
    // HISTORICAL AUDIT ENRICHMENT
    // ---------------------------------------------------------
    // Older CREATE_SALE / RETURN_SALE records may only contain
    // "Created sale GS-..." or "Returned sale GS-..." because
    // itemDetails were not persisted at the time.
    //
    // When the underlying Sale still exists, enrich the response
    // without mutating the audit record. This keeps the audit
    // history intact while giving the UI the phone-level context
    // needed for useful narratives.
    const saleAuditLogs = logs.filter(
      (log) =>
        ["CREATE_SALE", "SALE", "RETURN_SALE"].includes(log.action) &&
        (!log.itemDetails ||
          !Array.isArray(log.itemDetails?.items) ||
          log.itemDetails.items.length === 0) &&
        log.entityId
    );

    if (saleAuditLogs.length) {
      const saleIds = saleAuditLogs
        .map((log) => log.entityId)
        .filter(Boolean);

      const sales = await Sale.find({
        _id: { $in: saleIds },
      })
        .select(
          "receiptNumber customerName customerPhone paymentMethod status items"
        )
        .lean();

      const salesById = new Map(
        sales.map((sale) => [String(sale._id), sale])
      );

      for (const log of saleAuditLogs) {
        const sale = salesById.get(String(log.entityId));
        if (!sale) continue;

        log.itemName =
          log.itemName ||
          (sale.items?.length === 1
            ? `${sale.items[0].brand} ${sale.items[0].model} (${sale.items[0].imei})`
            : `${sale.items?.length || 0} item sale`);

        log.itemDetails = {
          receiptNumber: sale.receiptNumber || "",
          customerName: sale.customerName || "Walk-in Customer",
          customerPhone: sale.customerPhone || "",
          paymentMethod: sale.paymentMethod || "",
          status: sale.status || "",
          items: (sale.items || []).map((item) => ({
            brand: item.brand || "",
            model: item.model || "",
            ram: item.ram || "",
            storage: item.storage || "",
            color: item.color || "",
            imei: item.imei || "",
            buyingPrice: item.buyingPrice ?? null,
            sellingPrice: item.sellingPrice ?? null,
            finalPrice: item.finalPrice ?? null,
          })),
        };
      }
    }

    res.json(logs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const clearAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { period } = req.body;

    if (period === "all") {
      const result = await Audit.deleteMany({});
      return res.json({
        message: "All audit logs deleted successfully",
        deletedCount: result.deletedCount,
      });
    }

    const cutoffDate = new Date();
    if (period === "30days") cutoffDate.setDate(cutoffDate.getDate() - 30);
    else if (period === "90days") cutoffDate.setDate(cutoffDate.getDate() - 90);
    else if (period === "1year") cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    else return res.status(400).json({ message: "Invalid cleanup period" });

    const result = await Audit.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    res.json({
      message: "Audit logs cleaned successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getAuditLogs, clearAuditLogs };
