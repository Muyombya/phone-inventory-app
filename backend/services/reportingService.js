const Sale = require("../models/Sale");
const Phone = require("../models/Phone");
const Branch = require("../models/Branch");
const Transfer = require("../models/Transfer");
const InventoryEvent = require("../models/InventoryEvent");

const DEFAULT_THRESHOLD = 3;
const BUSINESS_OFFSET = "+03:00";

function parseDateOnly(value, endOfDay = false) {
  if (!value) return null;
  const date = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  return new Date(
    `${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}${BUSINESS_OFFSET}`
  );
}

function getDateRange(startDate, endDate) {
  const now = new Date();
  const start =
    parseDateOnly(startDate) ||
    new Date(now.getFullYear(), now.getMonth(), 1);

  const end =
    parseDateOnly(endDate, true) ||
    now;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid reporting date range.");
  }

  if (start > end) {
    throw new Error("Start date cannot be after end date.");
  }

  return { start, end };
}

function idOf(value) {
  if (!value) return null;
  if (typeof value === "object" && value._id) return value._id.toString();
  return value.toString();
}

function userBranchId(req) {
  return idOf(req.user?.branch);
}

function isManager(req) {
  return req.user?.role === "manager";
}

function resolveBranchId(req, requestedBranchId) {
  if (isManager(req)) return requestedBranchId || null;
  return userBranchId(req);
}

function numericMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function money(value) {
  return numericMoney(value);
}

function saleItems(sale) {
  if (Array.isArray(sale.items) && sale.items.length) {
    return sale.items;
  }

  // Compatibility fallback for older/legacy sale documents.
  if (sale.imei || sale.phoneId) {
    return [
      {
        phoneId: sale.phoneId,
        brand: sale.brand || "",
        model: sale.model || "",
        imei: sale.imei || "",
        color: sale.color || "",
        ram: sale.ram || "",
        storage: sale.storage || "",
        buyingPrice: money(sale.buyingPrice),
        sellingPrice: money(sale.sellingPrice || sale.originalPrice),
        finalPrice: money(sale.finalPrice || sale.totalAmount),
        profit: money(sale.profit || sale.totalProfit),
        discount: money(sale.discount),
        branch: sale.branch,
      },
    ];
  }

  return [];
}

function saleUnitCount(sale) {
  return saleItems(sale).length;
}

function completedSale(sale) {
  return sale.status === "Completed" || !sale.status;
}

function addToMap(map, key, valueFactory, mutate) {
  if (!map[key]) map[key] = valueFactory();
  mutate(map[key]);
}

async function getScopedBranches(req, requestedBranchId) {
  const scopeBranchId = resolveBranchId(req, requestedBranchId);
  const query = scopeBranchId ? { _id: scopeBranchId } : {};

  return Branch.find(query)
    .select("name")
    .sort({ name: 1 })
    .lean();
}

async function buildBranchSalesReport(req, options = {}) {
  const { start, end } = getDateRange(options.startDate, options.endDate);
  const branchId = resolveBranchId(req, options.branchId);

  const saleQuery = {
    createdAt: { $gte: start, $lte: end },
  };

  if (branchId) saleQuery.branch = branchId;

  const returnQuery = {
    returnedAt: { $gte: start, $lte: end },
    status: "Returned",
  };

  if (branchId) returnQuery.branch = branchId;

  const [sales, returnedSales] = await Promise.all([
    Sale.find(saleQuery)
      .populate("branch", "name")
      .populate("soldBy", "username name")
      .sort({ createdAt: 1 })
      .lean(),
    Sale.find(returnQuery)
      .populate("branch", "name")
      .populate("soldBy", "username name")
      .sort({ returnedAt: 1 })
      .lean(),
  ]);

  const completed = sales.filter(completedSale);

  const detail = [];
  const productMap = {};
  const attendantMap = {};
  const paymentMap = {};

  let grossRevenue = 0;
  let grossProfit = 0;
  let totalDiscount = 0;

  completed.forEach((sale) => {
    const items = saleItems(sale);
    const branchName = sale.branch?.name || "Unknown Branch";
    const attendant =
      sale.soldBy?.name ||
      sale.soldBy?.username ||
      "Unknown Attendant";

    items.forEach((item, index) => {
      const finalPrice = money(item.finalPrice);
      const profit = money(item.profit);
      const discount = money(item.discount);

      grossRevenue += finalPrice;
      grossProfit += profit;
      totalDiscount += discount;

      const productKey = [
        item.brand,
        item.model,
        item.ram,
        item.storage,
      ]
        .map((v) => String(v || "").trim())
        .join("|");

      addToMap(
        productMap,
        productKey,
        () => ({
          brand: item.brand || "",
          model: item.model || "",
          ram: item.ram || "",
          storage: item.storage || "",
          unitsSold: 0,
          revenue: 0,
          profit: 0,
        }),
        (row) => {
          row.unitsSold += 1;
          row.revenue += finalPrice;
          row.profit += profit;
        }
      );

      addToMap(
        attendantMap,
        attendant,
        () => ({ attendant, unitsSold: 0, revenue: 0 }),
        (row) => {
          row.unitsSold += 1;
          row.revenue += finalPrice;
        }
      );

      addToMap(
        paymentMap,
        sale.paymentMethod || "Unknown",
        () => ({ paymentMethod: sale.paymentMethod || "Unknown", units: 0, revenue: 0 }),
        (row) => {
          row.units += 1;
          row.revenue += finalPrice;
        }
      );

      detail.push({
        saleId: sale._id,
        receiptNumber: sale.receiptNumber || "—",
        date: sale.createdAt,
        branch: branchName,
        model: item.model || "",
        brand: item.brand || "",
        imei: item.imei || "—",
        color: item.color || "—",
        ram: item.ram || "—",
        storage: item.storage || "—",
        buyingPrice: money(item.buyingPrice),
        sellingPrice: money(item.sellingPrice),
        finalPrice,
        discount,
        profit,
        attendant,
        paymentMethod: sale.paymentMethod || "Unknown",
        customerName: sale.customerName || "Walk-in Customer",
        customerPhone: sale.customerPhone || "",
        itemIndex: index,
      });
    });
  });

  let returnedRevenue = 0;
  let returnedProfit = 0;
  let returnedUnits = 0;

  returnedSales.forEach((sale) => {
    returnedRevenue += money(sale.returnedRevenue);
    returnedProfit += money(sale.returnedProfit);
    returnedUnits += saleUnitCount(sale);
  });

  const netRevenue = grossRevenue - returnedRevenue;
  const netProfit = grossProfit - returnedProfit;

  const branchName =
    branchId
      ? (completed[0]?.branch?.name ||
        returnedSales[0]?.branch?.name ||
        (await Branch.findById(branchId).select("name").lean())?.name ||
        "Selected Branch")
      : "All Branches";

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    .slice(0, 10);

  const attendants = Object.values(attendantMap)
    .sort((a, b) => b.unitsSold - a.unitsSold);

  const payments = Object.values(paymentMap)
    .sort((a, b) => b.revenue - a.revenue);

  return {
    reportType: "BRANCH_SALES",
    generatedAt: new Date(),
    period: { start, end },
    scope: { branchId: branchId || null, branchName },
    summary: {
      unitsSold: detail.length,
      transactions: completed.length,
      grossRevenue,
      discounts: totalDiscount,
      returnedUnits,
      returnedRevenue,
      netRevenue,
      grossProfit,
      netProfit,
      modelsSold: new Set(detail.map((row) => `${row.brand}|${row.model}`)).size,
    },
    topProducts,
    attendants,
    payments,
    transactions: detail,
    narrative: buildSalesNarrative({
      branchName,
      start,
      end,
      unitsSold: detail.length,
      transactions: completed.length,
      grossRevenue,
      returnedRevenue,
      netRevenue,
      topProducts,
    }),
  };
}

function buildSalesNarrative(data) {
  const periodText = `${data.start.toLocaleDateString("en-GB")} – ${data.end.toLocaleDateString("en-GB")}`;
  const top =
    data.topProducts[0]
      ? `${data.topProducts[0].brand} ${data.topProducts[0].model} led unit sales with ${data.topProducts[0].unitsSold} unit(s).`
      : "No product sales were recorded in this period.";

  return `${data.branchName} recorded ${data.unitsSold} phone unit(s) across ${data.transactions} transaction(s) during ${periodText}. Gross revenue was UGX ${Math.round(data.grossRevenue).toLocaleString()}, with UGX ${Math.round(data.returnedRevenue).toLocaleString()} in returns, leaving UGX ${Math.round(data.netRevenue).toLocaleString()} in net revenue. ${top}`;
}

async function buildCurrentStockReport(req, options = {}) {
  const branchId = resolveBranchId(req, options.branchId);
  const phoneQuery = branchId ? { branch: branchId } : {};

  const [phones, branches] = await Promise.all([
    Phone.find(phoneQuery)
      .populate("branch", "name")
      .sort({ brand: 1, model: 1, color: 1 })
      .lean(),
    getScopedBranches(req, options.branchId),
  ]);

  const threshold = Number(options.threshold || DEFAULT_THRESHOLD);

  const groups = {};
  phones.forEach((phone) => {
    const key = [
      phone.brand,
      phone.model,
      phone.ram,
      phone.storage,
    ]
      .map((v) => String(v || "").trim())
      .join("|");

    addToMap(
      groups,
      key,
      () => ({
        brand: phone.brand,
        model: phone.model,
        ram: phone.ram,
        storage: phone.storage,
        total: 0,
        stockValue: 0,
        costValue: 0,
        branches: {},
        colors: {},
        phones: [],
      }),
      (row) => {
        row.total += 1;
        row.stockValue += numericMoney(phone.sellingPrice);
        row.costValue += numericMoney(phone.buyingPrice);

        const branchName = phone.branch?.name || "Unknown Branch";
        row.branches[branchName] = (row.branches[branchName] || 0) + 1;

        const color = phone.color || "Unknown";
        row.colors[color] = (row.colors[color] || 0) + 1;

        row.phones.push({
          id: phone._id,
          imei: phone.imei,
          color: phone.color,
          buyingPrice: money(phone.buyingPrice),
          sellingPrice: money(phone.sellingPrice),
          branch: branchName,
          addedAt: phone.createdAt,
        });
      }
    );
  });

  const models = Object.values(groups)
    .map((row) => ({
      ...row,
      status:
        row.total === 0
          ? "Out of Stock"
          : row.total <= 1
          ? "Critical"
          : row.total <= threshold
          ? "Low"
          : "Healthy",
    }))
    .sort((a, b) => a.total - b.total || a.brand.localeCompare(b.brand));

  // CURRENT STOCK VALUE is the current retail/selling value of physical stock.
  // Cost basis is kept separately so management can distinguish what the stock
  // could sell for from what it cost to acquire.
  const stockValue = phones.reduce(
    (sum, phone) => sum + numericMoney(phone.sellingPrice),
    0
  );

  const stockCostValue = phones.reduce(
    (sum, phone) => sum + numericMoney(phone.buyingPrice),
    0
  );

  const branchName =
    branchId
      ? branches[0]?.name || "Selected Branch"
      : "All Branches";

  return {
    reportType: "CURRENT_STOCK",
    generatedAt: new Date(),
    asAt: new Date(),
    scope: { branchId: branchId || null, branchName },
    summary: {
      units: phones.length,
      models: models.length,
      stockValue,
      stockSellingValue: stockValue,
      stockCostValue,
      criticalModels: models.filter((m) => m.status === "Critical").length,
      lowStockModels: models.filter((m) => m.status === "Low").length,
      outOfStockModels: 0,
    },
    branches: branches.map((branch) => {
      const branchPhones = phones.filter(
        (phone) => idOf(phone.branch) === idOf(branch._id)
      );

      return {
        id: branch._id,
        name: branch.name,
        units: branchPhones.length,
        models: new Set(
          branchPhones.map((phone) =>
            [phone.brand, phone.model, phone.ram, phone.storage]
              .map((v) => String(v || "").trim())
              .join("|")
          )
        ).size,
        stockValue: branchPhones.reduce(
          (sum, phone) => sum + numericMoney(phone.sellingPrice),
          0
        ),
        costValue: branchPhones.reduce(
          (sum, phone) => sum + numericMoney(phone.buyingPrice),
          0
        ),
      };
    }),
    models,
    narrative: `${branchName} currently has ${phones.length} phone unit(s) across ${models.length} model variant(s), with an estimated current retail stock value of UGX ${Math.round(stockValue).toLocaleString()}.`,
  };
}



async function buildProductCatalog(req, options = {}) {
  const branchId = resolveBranchId(req, options.branchId);
  const search = String(options.search || "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(options.limit) || 80, 1), 200);

  const phoneQuery = branchId ? { branch: branchId } : {};
  const saleQuery = branchId ? { branch: branchId } : {};

  const [phones, sales] = await Promise.all([
    Phone.find(phoneQuery)
      .select("brand model ram storage color imei branch createdAt")
      .lean(),
    Sale.find(saleQuery)
      .select("items branch createdAt status returnedAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const catalog = new Map();

  const ensure = (item) => {
    const brand = String(item.brand || "").trim();
    const model = String(item.model || "").trim();
    const ram = String(item.ram || "").trim();
    const storage = String(item.storage || "").trim();
    if (!brand || !model) return null;

    const key = [brand, model, ram, storage].join("|").toLowerCase();
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
      });
    }
    return catalog.get(key);
  };

  phones.forEach((phone) => {
    const row = ensure(phone);
    if (!row) return;
    row.currentStock += 1;
    if (phone.color) row.colours.add(phone.color);
    const created = phone.createdAt ? new Date(phone.createdAt) : null;
    if (created && !Number.isNaN(created.getTime()) && (!row.firstSeenAt || created < row.firstSeenAt)) {
      row.firstSeenAt = created;
    }
  });

  sales.forEach((sale) => {
    if (!completedSale(sale)) return;
    saleItems(sale).forEach((item) => {
      const row = ensure(item);
      if (!row) return;
      row.totalSold += 1;
      if (item.color) row.colours.add(item.color);
      const soldAt = sale.createdAt ? new Date(sale.createdAt) : null;
      if (soldAt && !Number.isNaN(soldAt.getTime())) {
        if (!row.firstSeenAt || soldAt < row.firstSeenAt) row.firstSeenAt = soldAt;
        if (!row.lastSoldAt || soldAt > row.lastSoldAt) row.lastSoldAt = soldAt;
      }
    });
  });

  const results = Array.from(catalog.values())
    .filter((row) => {
      if (!search) return true;
      const haystack = [
        row.brand,
        row.model,
        row.ram,
        row.storage,
        ...Array.from(row.colours),
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    })
    .map((row) => ({
      ...row,
      colours: Array.from(row.colours).sort(),
      status:
        row.currentStock === 0
          ? "Historical / Sold Out"
          : row.currentStock <= 1
          ? "Critical"
          : row.currentStock <= DEFAULT_THRESHOLD
          ? "Low"
          : "In Stock",
    }))
    .sort((a, b) => {
      const stockPriority = (x) => (x.currentStock === 0 ? 1 : 0);
      return (
        stockPriority(a) - stockPriority(b) ||
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
    scope: { branchId: branchId || null },
    products: results,
  };
}

async function buildProductHistoryReport(req, options = {}) {
  const brand = String(options.brand || "").trim();
  const model = String(options.model || "").trim();
  const ram = options.ram ? String(options.ram).trim() : null;
  const storage = options.storage ? String(options.storage).trim() : null;

  if (!brand || !model) {
    throw new Error("brand and model are required for product history.");
  }

  // Query by the stable product identity first, then apply RAM/storage in memory.
  // This keeps historical products discoverable even when older event records
  // were created without all variant fields populated consistently.
  const eventQuery = { brand, model };

  const saleQuery = {};
  const [rawEvents, sales, transfers, currentPhones] = await Promise.all([
    InventoryEvent.find(eventQuery).sort({ occurredAt: 1 }).lean(),
    Sale.find().populate("branch", "name").populate("soldBy", "username name").lean(),
    Transfer.find({ brand, model }).populate("fromBranch", "name").populate("toBranch", "name").populate("transferredBy", "username name").sort({ createdAt: 1 }).lean(),
    Phone.find({
      brand,
      model,
      ...(ram ? { ram } : {}),
      ...(storage ? { storage } : {}),
    }).populate("branch", "name").lean(),
  ]);

  const events = rawEvents.filter((event) =>
    (!ram || String(event.ram || '').trim() === ram) &&
    (!storage || String(event.storage || '').trim() === storage)
  );

  const matchingSales = sales.filter((sale) =>
    saleItems(sale).some((item) =>
      String(item.brand || "").trim() === brand &&
      String(item.model || "").trim() === model &&
      (!ram || String(item.ram || "").trim() === ram) &&
      (!storage || String(item.storage || "").trim() === storage)
    )
  );

  let purchased = 0;
  let eventSales = 0;
  let returned = 0;
  let transferIn = 0;
  let transferOut = 0;
  let adjustments = 0;
  let writeOffs = 0;

  events.forEach((event) => {
    const qty = Number(event.quantity || 0);
    switch (event.type) {
      case "PURCHASE":
        purchased += qty;
        break;
      case "SALE":
        eventSales += qty;
        break;
      case "RETURN":
        returned += qty;
        break;
      case "TRANSFER_IN":
        transferIn += qty;
        break;
      case "TRANSFER_OUT":
        transferOut += qty;
        break;
      case "ADJUSTMENT":
        adjustments += qty;
        break;
      case "WRITE_OFF":
        writeOffs += qty;
        break;
      default:
        break;
    }
  });

  let salesUnits = 0;
  let revenue = 0;
  let profit = 0;
  const branchPerformance = {};
  const salesHistory = [];

  matchingSales.forEach((sale) => {
    if (!completedSale(sale)) return;

    saleItems(sale).forEach((item) => {
      if (
        String(item.brand || "").trim() !== brand ||
        String(item.model || "").trim() !== model ||
        (ram && String(item.ram || "").trim() !== ram) ||
        (storage && String(item.storage || "").trim() !== storage)
      ) return;

      salesUnits += 1;
      revenue += money(item.finalPrice);
      profit += money(item.profit);

      const branchName = sale.branch?.name || "Unknown Branch";

      salesHistory.push({
        date: sale.createdAt,
        receiptNumber: sale.receiptNumber || "—",
        imei: item.imei || "—",
        color: item.color || "—",
        buyingPrice: money(item.buyingPrice),
        sellingPrice: money(item.sellingPrice),
        finalPrice: money(item.finalPrice),
        discount: money(item.discount),
        profit: money(item.profit),
        branch: branchName,
        paymentMethod: sale.paymentMethod || "Unknown",
        attendant:
          sale.soldBy?.name ||
          sale.soldBy?.username ||
          "Unknown Attendant",
        status: sale.status || "Completed",
      });
      addToMap(
        branchPerformance,
        branchName,
        () => ({ branchName, unitsSold: 0, revenue: 0, profit: 0 }),
        (row) => {
          row.unitsSold += 1;
          row.revenue += money(item.finalPrice);
          row.profit += money(item.profit);
        }
      );
    });
  });

  const purchaseEvents = events
    .filter((event) => event.type === "PURCHASE")
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
  const firstPurchaseEvent = purchaseEvents[0] || null;
  const lastSale = matchingSales
    .filter(completedSale)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  // First Stocked and First Purchased intentionally use the first PURCHASE
  // event rather than simply the first event of any type.
  const oldestCurrentPhone = currentPhones
    .filter((phone) => phone.createdAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  const firstStockedAt = firstPurchaseEvent?.occurredAt || oldestCurrentPhone?.createdAt || null;
  const firstPurchasedAt = firstPurchaseEvent?.occurredAt || null;
  const currentStock = currentPhones.length;

  return {
    reportType: "PRODUCT_HISTORY",
    generatedAt: new Date(),
    product: { brand, model, ram, storage },
    lifecycle: {
      firstStockedAt,
      firstPurchasedAt,
      lastSaleAt: lastSale?.createdAt || null,
      currentStock,
      totalPurchased: purchased,
      totalSold: salesUnits || eventSales,
      totalReturned: returned,
      totalTransferIn: transferIn,
      totalTransferOut: transferOut,
      adjustments,
      writeOffs,
      lifetimeRevenue: revenue,
      lifetimeProfit: profit,
    },
    branchPerformance: Object.values(branchPerformance).sort(
      (a, b) => b.unitsSold - a.unitsSold
    ),
    salesHistory: salesHistory.sort((a, b) => new Date(b.date) - new Date(a.date)),
    currentUnits: currentPhones.map((phone) => ({
      imei: phone.imei,
      color: phone.color,
      branch: phone.branch?.name || "Unknown Branch",
      buyingPrice: money(phone.buyingPrice),
      sellingPrice: money(phone.sellingPrice),
      addedAt: phone.createdAt,
    })),
    eventHistory: events.map((event) => ({
      type: event.type,
      quantity: event.quantity,
      branch: event.branch,
      occurredAt: event.occurredAt,
      buyingPrice: money(event.buyingPrice),
      sellingPrice: money(event.sellingPrice),
      source: event.source,
      reference: event.reference,
      notes: event.notes,
    })),
    transfers: transfers.map((transfer) => ({
      imei: transfer.imei,
      fromBranch: transfer.fromBranch?.name || "Unknown Branch",
      toBranch: transfer.toBranch?.name || "Unknown Branch",
      transferredBy:
        transfer.transferredBy?.name ||
        transfer.transferredBy?.username ||
        "Unknown",
      date: transfer.createdAt,
    })),
  };
}

async function buildDashboardReport(req, options = {}) {
  const { start, end } = getDateRange(options.startDate, options.endDate);
  const branchId = resolveBranchId(req, options.branchId);

  const [salesReport, stockReport] = await Promise.all([
    buildBranchSalesReport(req, {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      branchId,
    }),
    buildCurrentStockReport(req, { branchId, threshold: options.threshold }),
  ]);

  const [branches, allProducts, catalogReport] = await Promise.all([
    getScopedBranches(req, branchId),
    Promise.resolve(salesReport.topProducts),
    buildProductCatalog(req, { branchId, limit: 200 }),
  ]);

  const insights = buildLocalInsights(salesReport, stockReport, catalogReport);

  return {
    reportType: "MANAGEMENT_DASHBOARD",
    generatedAt: new Date(),
    period: { start, end },
    scope: salesReport.scope,
    summary: {
      ...salesReport.summary,
      inventoryUnits: stockReport.summary.units,
      inventoryModels: stockReport.summary.models,
      inventoryValue: stockReport.summary.stockValue,
    },
    sales: salesReport,
    stock: stockReport,
    branches,
    topProducts: allProducts,
    ai: insights,
  };
}

function buildStockAttentionMessage(stock) {
  const critical = stock.models
    .filter((m) => m.status === "Critical")
    .map((m) => `${m.brand} ${m.model}`);
  const low = stock.models
    .filter((m) => m.status === "Low")
    .map((m) => `${m.brand} ${m.model}`);

  const parts = [];
  if (critical.length) parts.push(`Critical: ${critical.join(", ")}.`);
  if (low.length) parts.push(`Low: ${low.join(", ")}.`);
  return parts.join(" ") || "No critical or low-stock models require attention.";
}

function productIdentity(brand, model, ram, storage) {
  return [
    String(brand || "").trim().toLowerCase(),
    String(model || "").trim().toLowerCase(),
    String(ram || "").trim().toLowerCase(),
    String(storage || "").trim().toLowerCase(),
  ].join("|");
}

function buildBranchDemandMap(sales) {
  const demand = {};

  for (const transaction of sales?.transactions || []) {
    const branch = String(transaction.branch || "").trim();
    if (!branch) continue;

    const key = productIdentity(
      transaction.brand,
      transaction.model,
      transaction.ram,
      transaction.storage
    );

    if (!demand[key]) demand[key] = {};
    demand[key][branch] = (demand[key][branch] || 0) + 1;
  }

  return demand;
}

function buildTransferCandidates(stock, sales) {
  const branchNames = (stock.branches || [])
    .map((branch) => String(branch.name || "").trim())
    .filter(Boolean);

  if (branchNames.length < 2) return [];

  const demandMap = buildBranchDemandMap(sales);
  const candidates = [];

  for (const model of stock.models || []) {
    const key = productIdentity(
      model.brand,
      model.model,
      model.ram,
      model.storage
    );

    const branchStock = model.branches || {};

    // Every active branch is considered. A branch with zero stock is a
    // replenishment candidate even when it has no recent sales; the
    // recommendation confidence is simply lower in that case.
    const destinations = branchNames
      .map((name) => ({
        name,
        stock: Number(branchStock[name] || 0),
        demand: Number(demandMap[key]?.[name] || 0),
      }))
      .filter((branch) => branch.stock === 0);

    if (!destinations.length) continue;

    const donors = branchNames
      .map((name) => ({
        name,
        stock: Number(branchStock[name] || 0),
        demand: Number(demandMap[key]?.[name] || 0),
      }))
      .filter((branch) => branch.stock > 0);

    if (!donors.length) continue;

    for (const destination of destinations) {
      const rankedDonors = [...donors].sort((a, b) => {
        const aSurplus = Math.max(0, a.stock - DEFAULT_THRESHOLD);
        const bSurplus = Math.max(0, b.stock - DEFAULT_THRESHOLD);

        return (
          bSurplus - aSurplus ||
          a.demand - b.demand ||
          b.stock - a.stock
        );
      });

      const donor = rankedDonors.find(
        (candidate) =>
          candidate.stock > DEFAULT_THRESHOLD ||
          (candidate.stock > 1 && candidate.demand === 0)
      );

      if (!donor) continue;

      const safeSurplus = Math.max(
        1,
        donor.stock - DEFAULT_THRESHOLD
      );

      const quantity = Math.max(
        1,
        Math.min(2, safeSurplus, destination.demand || 1)
      );

      const confidence = destination.demand > 0 ? "strong" : "review";

      candidates.push({
        brand: model.brand,
        model: model.model,
        ram: model.ram,
        storage: model.storage,
        fromBranch: donor.name,
        toBranch: destination.name,
        quantity,
        destinationStock: destination.stock,
        destinationDemand: destination.demand,
        sourceStock: donor.stock,
        sourceDemand: donor.demand,
        confidence,
        branchPosition: branchNames.map((name) => ({
          branch: name,
          units: Number(branchStock[name] || 0),
          recentSales: Number(demandMap[key]?.[name] || 0),
        })),
      });
    }
  }

  return candidates
    .sort((a, b) => {
      const confidenceScore = { strong: 2, review: 1 };
      return (
        confidenceScore[b.confidence] - confidenceScore[a.confidence] ||
        b.destinationDemand - a.destinationDemand ||
        b.sourceStock - a.sourceStock
      );
    })
    .slice(0, 5);
}

function buildLocalInsights(sales, stock, catalogReport) {
  const insights = [];

  if (sales.summary.unitsSold === 0) {
    insights.push({
      type: "attention",
      title: "No phone sales recorded",
      message: `No completed phone units were recorded for ${sales.scope.branchName} in the selected period.`,
      evidence: ["Units sold: 0"],
      drillDown: { label: "View sales report", path: "/reports", params: { tab: "sales" } },
    });
  }

  const top = sales.topProducts[0];
  if (top) {
    insights.push({
      type: "opportunity",
      title: "Leading product",
      message: `${top.brand} ${top.model} led the selected period with ${top.unitsSold} unit(s) sold.`,
      evidence: [`Units sold: ${top.unitsSold}`, `Revenue: UGX ${Math.round(top.revenue || 0).toLocaleString()}`],
      drillDown: { label: "View stock position", path: "/stock-lookup", params: { search: `${top.brand} ${top.model}` } },
    });
  }

  const criticalModels = stock.models.filter((m) => m.status === "Critical");
  const lowModels = stock.models.filter((m) => m.status === "Low");
  if (criticalModels.length || lowModels.length) {
    insights.push({
      type: "attention",
      title: "Low stock requires review",
      message: buildStockAttentionMessage(stock),
      evidence: [
        ...(criticalModels.length ? [`Critical: ${criticalModels.map((m) => `${m.brand} ${m.model}`).join(", ")}`] : []),
        ...(lowModels.length ? [`Low: ${lowModels.map((m) => `${m.brand} ${m.model}`).join(", ")}`] : []),
      ],
      drillDown: { label: "View stock lookup", path: "/stock-lookup", params: { search: criticalModels[0] ? `${criticalModels[0].brand} ${criticalModels[0].model}` : `${lowModels[0].brand} ${lowModels[0].model}` } },
    });
  }

  const finished = (catalogReport?.products || []).filter((item) => item.status === "Historical / Sold Out");
  if (finished.length) {
    const names = finished.slice(0, 8).map((item) => `${item.brand} ${item.model}`);
    insights.push({
      type: "attention",
      title: "Finished products detected",
      message: `${finished.length} product model(s) in the selected scope currently have zero physical units: ${names.join(", ")}.`,
      evidence: [`Finished: ${names.join(", ")}`],
      drillDown: { label: "View product history", path: "/inventory", params: { tab: "history", product: names[0] } },
    });
  }

  const transfers = buildTransferCandidates(stock, sales);
  if (transfers.length) {
    const t = transfers[0];
    insights.push({
      type: "opportunity",
      title: "Internal transfer opportunity",
      message:
        t.confidence === "strong"
          ? `${t.toBranch} has 0 ${t.brand} ${t.model} units and recorded ${t.destinationDemand} recent sale(s). Consider moving ${t.quantity} unit(s) from ${t.fromBranch}, which has ${t.sourceStock} available.`
          : `${t.toBranch} has 0 ${t.brand} ${t.model} units. ${t.fromBranch} has ${t.sourceStock} available, so a cautious ${t.quantity}-unit replenishment is available for management review.`,
      evidence: [
        `Destination: ${t.toBranch} — stock: 0`,
        `Destination recent sales: ${t.destinationDemand}`,
        `Source: ${t.fromBranch} — stock: ${t.sourceStock}`,
        `Source recent sales: ${t.sourceDemand}`,
        `Suggested quantity: ${t.quantity}`,
        `Confidence: ${t.confidence === "strong" ? "Strong" : "Review required"}`,
      ],
      transfer: {
        brand: t.brand,
        model: t.model,
        ram: t.ram,
        storage: t.storage,
        fromBranch: t.fromBranch,
        toBranch: t.toBranch,
        quantity: t.quantity,
        confidence: t.confidence,
        branchPosition: t.branchPosition,
      },
      drillDown: { label: "Review stock position", path: "/stock-lookup", params: { search: `${t.brand} ${t.model}` } },
    });
  }

  return {
    provider: "local-rules-v1",
    status: "ready",
    generatedAt: new Date(),
    insights,
    note: "These are deterministic business rules. LLM-based narrative analysis can add interpretation without replacing the underlying facts.",
  };
}

module.exports = {
  getDateRange,
  buildDashboardReport,
  buildBranchSalesReport,
  buildCurrentStockReport,
  buildProductHistoryReport,
  buildProductCatalog,
};
