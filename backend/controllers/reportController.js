const {
  buildDashboardReport,
  buildBranchSalesReport,
  buildCurrentStockReport,
  buildProductHistoryReport,
  buildProductCatalog,
} = require("../services/reportingService");

// =====================================
// MANAGEMENT DASHBOARD REPORT
// GET /api/reports
// =====================================
const getDashboardReport = async (req, res) => {
  try {
    const report = await buildDashboardReport(req, req.query);
    return res.json(report);
  } catch (error) {
    console.error("Reporting Engine - dashboard:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate management report",
    });
  }
};

// =====================================
// BRANCH SALES REPORT
// GET /api/reports/branch-sales
// =====================================
const getBranchSalesReport = async (req, res) => {
  try {
    const report = await buildBranchSalesReport(req, req.query);
    return res.json(report);
  } catch (error) {
    console.error("Reporting Engine - branch sales:", error);
    return res.status(400).json({
      message: error.message || "Failed to generate branch sales report",
    });
  }
};

// =====================================
// CURRENT STOCK REPORT
// GET /api/reports/current-stock
// =====================================
const getCurrentStockReport = async (req, res) => {
  try {
    const report = await buildCurrentStockReport(req, req.query);
    return res.json(report);
  } catch (error) {
    console.error("Reporting Engine - current stock:", error);
    return res.status(400).json({
      message: error.message || "Failed to generate current stock report",
    });
  }
};


const getProductCatalog = async (req, res) => {
  try {
    const report = await buildProductCatalog(req, req.query);
    return res.json(report);
  } catch (error) {
    console.error("Reporting Engine - product catalog:", error);
    return res.status(400).json({
      message: error.message || "Failed to load product catalogue",
    });
  }
};

// =====================================
// PRODUCT LIFETIME HISTORY
// GET /api/reports/product-history
// =====================================
const getProductHistoryReport = async (req, res) => {
  try {
    const report = await buildProductHistoryReport(req, req.query);
    return res.json(report);
  } catch (error) {
    console.error("Reporting Engine - product history:", error);
    return res.status(400).json({
      message: error.message || "Failed to generate product history report",
    });
  }
};

module.exports = {
  getDashboardReport,
  getBranchSalesReport,
  getCurrentStockReport,
  getProductHistoryReport,
  getProductCatalog,
};
