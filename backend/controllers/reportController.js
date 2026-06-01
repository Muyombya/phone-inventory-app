const Sale =
  require("../models/Sale");

const Phone =
  require("../models/Phone");

const Branch =
  require("../models/Branch");

// =====================================
// GET REPORTS
// =====================================
const getDashboardReport =
  async (req, res) => {
    try {
      // =========================
      // USER CONTEXT
      // =========================
      const isManager =
        req.user.role ===
        "manager";

      const userBranchId =
        req.user.branch?._id?.toString();

      // =========================
      // DATE FILTERS
      // =========================
      const {
        startDate,
        endDate,
      } = req.query;

      const now =
        new Date();

      let reportStartDate;
      let reportEndDate;

      // CUSTOM RANGE
      if (
        startDate &&
        endDate
      ) {
        reportStartDate =
          new Date(
            startDate
          );

        reportEndDate =
          new Date(
            endDate
          );

        reportEndDate.setHours(
          23,
          59,
          59,
          999
        );
      } else {
        // DEFAULT:
        // CURRENT MONTH
        reportStartDate =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

        reportEndDate =
          new Date();
      }

      // =========================
      // TODAY
      // =========================
      const todayStart =
        new Date();

      todayStart.setHours(
        0,
        0,
        0,
        0
      );

      // =========================
      // WEEK
      // =========================
      const weekStart =
        new Date();

      weekStart.setDate(
        weekStart.getDate() -
          7
      );

      // =========================
      // LOAD SALES
      // =========================
      let sales =
        await Sale.find()
          .populate(
            "branch",
            "name"
          )
          .lean();

      // =========================
      // BRANCH FILTER
      // =========================
      if (
        !isManager &&
        userBranchId
      ) {
        sales =
          sales.filter(
            (sale) =>
              sale.branch &&
              sale.branch._id
                ?.toString() ===
                userBranchId
          );
      }

      // =========================
      // COMPLETED SALES
      // =========================
      const completedSales =
        sales.filter(
          (sale) =>
            (
              sale.status ===
                "Completed" ||
              !sale.status
            ) &&
            new Date(
              sale.createdAt
            ) >=
              reportStartDate &&
            new Date(
              sale.createdAt
            ) <=
              reportEndDate
        );

      // =========================
      // RETURNED SALES
      // =========================
      const returnedSales =
        sales.filter(
          (sale) =>
            sale.status ===
              "Returned" &&
            sale.returnedAt &&
            new Date(
              sale.returnedAt
            ) >=
              reportStartDate &&
            new Date(
              sale.returnedAt
            ) <=
              reportEndDate
        );

      // =========================
      // EXECUTIVE SUMMARY
      // FILTERED PERIOD
      // =========================
      const grossRevenue =
        completedSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.totalAmount ||
                0
            ),
          0
        );

      const grossProfit =
        completedSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.totalProfit ||
                0
            ),
          0
        );

      const returnedRevenue =
        returnedSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.returnedRevenue ||
                0
            ),
          0
        );

      const returnedProfit =
        returnedSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.returnedProfit ||
                0
            ),
          0
        );

      const netRevenue =
        grossRevenue -
        returnedRevenue;

      const netProfit =
        grossProfit -
        returnedProfit;

      const transactions =
        completedSales.length;

      const returnsCount =
        returnedSales.length;

      const phonesSold =
        completedSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            (
              sale.items
                ?.length || 0
            ),
          0
        );

      // =========================
      // DAILY REPORT
      // =========================
      const todayCompleted =
        completedSales.filter(
          (sale) =>
            new Date(
              sale.createdAt
            ) >=
            todayStart
        );

      const todayReturned =
        returnedSales.filter(
          (sale) =>
            sale.returnedAt &&
            new Date(
              sale.returnedAt
            ) >=
              todayStart
        );

      const todayGrossRevenue =
        todayCompleted.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.totalAmount ||
                0
            ),
          0
        );

      const todayGrossProfit =
        todayCompleted.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.totalProfit ||
                0
            ),
          0
        );

      const todayReturnedRevenue =
        todayReturned.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.returnedRevenue ||
                0
            ),
          0
        );

      const todayReturnedProfit =
        todayReturned.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.returnedProfit ||
                0
            ),
          0
        );

      const todayNetRevenue =
        todayGrossRevenue -
        todayReturnedRevenue;

      const todayNetProfit =
        todayGrossProfit -
        todayReturnedProfit;

      const todayTransactions =
        todayCompleted.length;

      const todayReturns =
        todayReturned.length;

      const todayPhonesSold =
        todayCompleted.reduce(
          (
            total,
            sale
          ) =>
            total +
            (
              sale.items
                ?.length || 0
            ),
          0
        );
              // =========================
      // WEEKLY REPORT
      // LAST 7 DAYS
      // =========================
      const weekCompleted =
        completedSales.filter(
          (sale) =>
            new Date(
              sale.createdAt
            ) >=
            weekStart
        );

      const weekReturned =
        returnedSales.filter(
          (sale) =>
            sale.returnedAt &&
            new Date(
              sale.returnedAt
            ) >=
              weekStart
        );

      const weekGrossRevenue =
        weekCompleted.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.totalAmount ||
                0
            ),
          0
        );

      const weekGrossProfit =
        weekCompleted.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.totalProfit ||
                0
            ),
          0
        );

      const weekReturnedRevenue =
        weekReturned.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.returnedRevenue ||
                0
            ),
          0
        );

      const weekReturnedProfit =
        weekReturned.reduce(
          (
            total,
            sale
          ) =>
            total +
            Number(
              sale.returnedProfit ||
                0
            ),
          0
        );

      const weekNetRevenue =
        weekGrossRevenue -
        weekReturnedRevenue;

      const weekNetProfit =
        weekGrossProfit -
        weekReturnedProfit;

      const weekTransactions =
        weekCompleted.length;

      const weekReturns =
        weekReturned.length;

      const weekPhonesSold =
        weekCompleted.reduce(
          (
            total,
            sale
          ) =>
            total +
            (
              sale.items
                ?.length || 0
            ),
          0
        );

      // =========================
      // SELECTED PERIOD
      // (CUSTOM RANGE OR MONTH)
      // =========================
      const periodAnalytics =
        {
          startDate:
            reportStartDate,

          endDate:
            reportEndDate,

          grossRevenue,

          returnedRevenue,

          netRevenue,

          grossProfit,

          returnedProfit,

          netProfit,

          transactions,

          returnsCount,

          phonesSold,
        };

      // =========================
      // INVENTORY
      // BRANCH SCOPED
      // =========================
      let inventoryPhones =
        await Phone.find()
          .lean();

      if (
        !isManager &&
        userBranchId
      ) {
        inventoryPhones =
          inventoryPhones.filter(
            (phone) =>
              phone.branch
                ?.toString() ===
              userBranchId
          );
      }

      const inventoryCount =
        inventoryPhones.length;

      const inventoryValue =
        inventoryPhones.reduce(
          (
            total,
            phone
          ) =>
            total +
            Number(
              phone.buyingPrice ||
                0
            ),
          0
        );

      // =========================
      // RETURNS ANALYTICS
      // =========================
      const averageReturnValue =
        returnsCount > 0
          ? Math.round(
              returnedRevenue /
                returnsCount
            )
          : 0;

      const returnsAnalytics =
        {
          returnsCount,

          returnedRevenue,

          returnedProfit,

          averageReturnValue,
        };

      // =========================
      // BRANCH PERFORMANCE
      // =========================
      let branches =
        await Branch.find()
          .lean();

      if (
        !isManager &&
        userBranchId
      ) {
        branches =
          branches.filter(
            (branch) =>
              branch._id.toString() ===
              userBranchId
          );
      }

      const branchReports =
        [];

      for (const branch of branches) {
        const branchCompleted =
          completedSales.filter(
            (
              sale
            ) =>
              sale.branch &&
              sale.branch._id
                ?.toString() ===
                branch._id.toString()
          );

        const branchReturned =
          returnedSales.filter(
            (
              sale
            ) =>
              sale.branch &&
              sale.branch._id
                ?.toString() ===
                branch._id.toString()
          );

        const branchRevenue =
          branchCompleted.reduce(
            (
              total,
              sale
            ) =>
              total +
              Number(
                sale.totalAmount ||
                  0
              ),
            0
          );

        const branchProfit =
          branchCompleted.reduce(
            (
              total,
              sale
            ) =>
              total +
              Number(
                sale.totalProfit ||
                  0
              ),
            0
          );

        const branchReturnedRevenue =
          branchReturned.reduce(
            (
              total,
              sale
            ) =>
              total +
              Number(
                sale.returnedRevenue ||
                  0
              ),
            0
          );

        const branchReturnedProfit =
          branchReturned.reduce(
            (
              total,
              sale
            ) =>
              total +
              Number(
                sale.returnedProfit ||
                  0
              ),
            0
          );

        const branchInventory =
          inventoryPhones.filter(
            (
              phone
            ) =>
              phone.branch?.toString() ===
              branch._id.toString()
          );

        const stockValue =
          branchInventory.reduce(
            (
              total,
              phone
            ) =>
              total +
              Number(
                phone.buyingPrice ||
                  0
              ),
            0
          );

        branchReports.push({
          branchId:
            branch._id,

          branchName:
            branch.name,

          grossRevenue:
            branchRevenue,

          returnedRevenue:
            branchReturnedRevenue,

          netRevenue:
            branchRevenue -
            branchReturnedRevenue,

          grossProfit:
            branchProfit,

          returnedProfit:
            branchReturnedProfit,

          netProfit:
            branchProfit -
            branchReturnedProfit,

          transactions:
            branchCompleted.length,

          returns:
            branchReturned.length,

          phonesSold:
            branchCompleted.reduce(
              (
                total,
                sale
              ) =>
                total +
                (
                  sale.items
                    ?.length ||
                  0
                ),
              0
            ),

          stockValue,
        });
      }
            // =========================
      // TOP PRODUCTS
      // COMPLETED SALES ONLY
      // =========================
      const productMap =
        {};

      completedSales.forEach(
        (sale) => {
          sale.items?.forEach(
            (
              item
            ) => {
              const key =
                `${item.brand} ${item.model}`;

              if (
                !productMap[
                  key
                ]
              ) {
                productMap[
                  key
                ] = {
                  brand:
                    item.brand,

                  model:
                    item.model,

                  sold: 0,

                  revenue: 0,

                  profit: 0,
                };
              }

              productMap[
                key
              ].sold += 1;

              productMap[
                key
              ].revenue +=
                Number(
                  item.finalPrice ||
                    0
                );

              productMap[
                key
              ].profit +=
                Number(
                  item.profit ||
                    0
                );
            }
          );
        }
      );

      const topProducts =
        Object.values(
          productMap
        )
          .sort(
            (
              a,
              b
            ) =>
              b.sold -
              a.sold
          )
          .slice(
            0,
            10
          );

      // =========================
      // BUILD RESPONSE
      // =========================
      const reportData = {
        summary: {
          grossRevenue,

          returnedRevenue,

          netRevenue,

          grossProfit,

          returnedProfit,

          netProfit,

          transactions,

          returnsCount,

          phonesSold,

          inventoryCount,

          inventoryValue,
        },

        // NEW
        periodAnalytics,

        daily: {
          grossRevenue:
            todayGrossRevenue,

          returnedRevenue:
            todayReturnedRevenue,

          netRevenue:
            todayNetRevenue,

          grossProfit:
            todayGrossProfit,

          returnedProfit:
            todayReturnedProfit,

          netProfit:
            todayNetProfit,

          transactions:
            todayTransactions,

          returns:
            todayReturns,

          phonesSold:
            todayPhonesSold,
        },

        weekly: {
          grossRevenue:
            weekGrossRevenue,

          returnedRevenue:
            weekReturnedRevenue,

          netRevenue:
            weekNetRevenue,

          grossProfit:
            weekGrossProfit,

          returnedProfit:
            weekReturnedProfit,

          netProfit:
            weekNetProfit,

          transactions:
            weekTransactions,

          returns:
            weekReturns,

          phonesSold:
            weekPhonesSold,
        },

        returnsAnalytics,

        branchReports,

        topProducts,
      };

      // =========================
      // PROFIT SECURITY
      // NON MANAGERS
      // =========================
      if (
        !isManager
      ) {
        // SUMMARY
        reportData.summary.grossProfit =
          null;

        reportData.summary.returnedProfit =
          null;

        reportData.summary.netProfit =
          null;

        // PERIOD
        reportData.periodAnalytics.grossProfit =
          null;

        reportData.periodAnalytics.returnedProfit =
          null;

        reportData.periodAnalytics.netProfit =
          null;

        // DAILY
        reportData.daily.grossProfit =
          null;

        reportData.daily.returnedProfit =
          null;

        reportData.daily.netProfit =
          null;

        // WEEKLY
        reportData.weekly.grossProfit =
          null;

        reportData.weekly.returnedProfit =
          null;

        reportData.weekly.netProfit =
          null;

        // RETURNS
        reportData.returnsAnalytics.returnedProfit =
          null;

        // PRODUCTS
        reportData.topProducts =
          reportData.topProducts.map(
            (
              product
            ) => ({
              ...product,

              profit:
                null,
            })
          );

        // BRANCHES
        reportData.branchReports =
          reportData.branchReports.map(
            (
              branch
            ) => ({
              ...branch,

              grossProfit:
                null,

              returnedProfit:
                null,

              netProfit:
                null,
            })
          );
      }

      // =========================
      // FINAL RESPONSE
      // =========================
      res.json(
        reportData
      );
    } catch (
      error
    ) {
      console.log(
        error
      );

      res.status(500).json({
        message:
          "Failed to generate reports",
      });
    }
  };

// =====================================
// EXPORTS
// =====================================
module.exports = {
  getDashboardReport,
};