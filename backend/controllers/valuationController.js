const Phone =
  require("../models/Phone");



// =====================================
// GET INVENTORY VALUATION
// =====================================
const getInventoryValuation =
  async (req, res) => {
    try {
      const phones =
        await Phone.find({
          status:
            "available",
        });

      const totalPhones =
        phones.length;

      const totalBuyingValue =
        phones.reduce(
          (acc, phone) =>
            acc +
            phone.buyingPrice,
          0
        );

      const totalSellingValue =
        phones.reduce(
          (acc, phone) =>
            acc +
            phone.sellingPrice,
          0
        );

      const expectedProfit =
        totalSellingValue -
        totalBuyingValue;

      res.json({
        totalPhones,
        totalBuyingValue,
        totalSellingValue,
        expectedProfit,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// =====================================
// GET BRANCH VALUATION
// =====================================
const getBranchValuation =
  async (req, res) => {
    try {
      const phones =
        await Phone.find({
          branch:
            req.params.branchId,

          status:
            "available",
        });

      const totalPhones =
        phones.length;

      const totalBuyingValue =
        phones.reduce(
          (acc, phone) =>
            acc +
            phone.buyingPrice,
          0
        );

      const totalSellingValue =
        phones.reduce(
          (acc, phone) =>
            acc +
            phone.sellingPrice,
          0
        );

      const expectedProfit =
        totalSellingValue -
        totalBuyingValue;

      res.json({
        totalPhones,
        totalBuyingValue,
        totalSellingValue,
        expectedProfit,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// =====================================
// EXPORTS
// =====================================
module.exports = {
  getInventoryValuation,
  getBranchValuation,
};