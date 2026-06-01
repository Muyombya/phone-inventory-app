const Phone =
  require("../models/Phone");

const Sale =
  require("../models/Sale");

// =====================================
// GET DASHBOARD DATA
// =====================================
const getDashboardData =
  async (req, res) => {
    try {
      const isManager =
        req.user.role ===
        "manager";

      // =========================
      // PHONE FILTER
      // =========================
      const phoneFilter =
        {};

      if (
        !isManager
      ) {
        phoneFilter.branch =
          req.user.branch?._id;
      }

      // =========================
      // INVENTORY
      // =========================
      const phones =
        await Phone.find(
          phoneFilter
        )
          .select(
            "brand model buyingPrice sellingPrice branch"
          )
          .lean();

      const inventoryCount =
        phones.length;

      const stockValue =
        phones.reduce(
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
      // LOAD SALES
      // =========================
      let sales =
        await Sale.find()
          .populate(
            "branch",
            "name"
          )
          .sort({
            createdAt:
              -1,
          })
          .lean();

      // =========================
      // BRANCH SECURITY
      // =========================
      if (
        !isManager
      ) {
        sales =
          sales.filter(
            (
              sale
            ) =>
              sale.branch &&
              sale.branch
                ._id
                .toString() ===
                req.user.branch
                  ?._id
                  ?.toString()
          );
      }

      // =========================
      // COMPLETED SALES
      // =========================
      const completedSales =
        sales.filter(
          (sale) =>
            sale.status !==
            "Returned"
        );

      // =========================
      // RETURNED SALES
      // =========================
      const returnedSales =
        sales.filter(
          (sale) =>
            sale.status ===
            "Returned"
        );

      // =========================
      // FINANCIAL KPIs
      // =========================
      const totalRevenue =
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

      const totalProfit =
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

      // =========================
      // SALES KPIs
      // =========================
      const totalTransactions =
        completedSales.length;

      const totalPhonesSold =
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
      // RETURNS KPIs
      // =========================
      const totalReturns =
        returnedSales.length;

      // =========================
      // TODAY FILTER
      // =========================
      const today =
        new Date();

      const todaySales =
        completedSales.filter(
          (sale) =>
            new Date(
              sale.createdAt
            ).toDateString() ===
            today.toDateString()
        );

      const todayReturnedSales =
        returnedSales.filter(
          (sale) =>
            new Date(
              sale.createdAt
            ).toDateString() ===
            today.toDateString()
        );

      const todayRevenue =
        todaySales.reduce(
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

      const todayProfit =
        todaySales.reduce(
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

      const todayTransactions =
        todaySales.length;

      const todayPhonesSold =
        todaySales.reduce(
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

      const todayReturns =
        todayReturnedSales.length;

      // =========================
      // BEST SELLERS
      // =========================
      const bestSellerMap =
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
                !bestSellerMap[
                  key
                ]
              ) {
                bestSellerMap[
                  key
                ] = {
                  name:
                    key,

                  sold: 0,
                };
              }

              bestSellerMap[
                key
              ].sold += 1;
            }
          );
        }
      );

      const bestSellers =
        Object.values(
          bestSellerMap
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
            5
          );
                // =========================
      // LOW STOCK
      // =========================
      const stockMap =
        {};

      phones.forEach(
        (phone) => {
          const key =
            `${phone.brand} ${phone.model}`;

          if (
            !stockMap[key]
          ) {
            stockMap[
              key
            ] = {
              brand:
                phone.brand,

              model:
                phone.model,

              count: 0,
            };
          }

          stockMap[
            key
          ].count += 1;
        }
      );

      const lowStock =
        Object.values(
          stockMap
        )
          .filter(
            (
              item
            ) =>
              item.count <=
              2
          )
          .sort(
            (
              a,
              b
            ) =>
              a.count -
              b.count
          );

      // =========================
      // BRANCH PERFORMANCE
      // =========================
      const branchMap =
        {};

      completedSales.forEach(
        (sale) => {
          const branchName =
            sale.branch
              ?.name ||
            "Unknown Branch";

          if (
            !branchMap[
              branchName
            ]
          ) {
            branchMap[
              branchName
            ] = {
              branch:
                branchName,

              revenue: 0,

              transactions: 0,

              phonesSold: 0,
            };
          }

          branchMap[
            branchName
          ].revenue +=
            Number(
              sale.totalAmount ||
                0
            );

          branchMap[
            branchName
          ].transactions +=
            1;

          branchMap[
            branchName
          ].phonesSold +=
            sale.items
              ?.length || 0;
        }
      );

      const branchPerformance =
        Object.values(
          branchMap
        )
          .sort(
            (
              a,
              b
            ) =>
              b.revenue -
              a.revenue
          )
          .slice(
            0,
            5
          );

      // =========================
      // RECENT SALES
      // =========================
      const recentSales =
        sales
          .slice(
            0,
            5
          )
          .map(
            (
              sale
            ) => ({
              _id:
                sale._id,

              receiptNumber:
                sale.receiptNumber,

              customerName:
                sale.customerName,

              paymentMethod:
                sale.paymentMethod,

              totalAmount:
                sale.totalAmount,

              totalProfit:
                sale.totalProfit,

              status:
                sale.status ||
                "Completed",

              branch:
                sale.branch,

              createdAt:
                sale.createdAt,
            })
          );

      // =========================
      // RECENT RETURNS
      // =========================
      const recentReturns =
        returnedSales
          .slice(
            0,
            5
          )
          .map(
            (
              sale
            ) => ({
              _id:
                sale._id,

              receiptNumber:
                sale.receiptNumber,

              customerName:
                sale.customerName,

              branch:
                sale.branch,

              createdAt:
                sale.createdAt,
            })
          );

      // =========================
      // RESPONSE
      // =========================
      res.json({
        summary: {
          inventoryCount,

          stockValue,

          totalRevenue,

          totalProfit:
            isManager
              ? totalProfit
              : null,

          totalTransactions,

          totalPhonesSold,

          totalReturns,

          todayRevenue,

          todayProfit:
            isManager
              ? todayProfit
              : null,

          todayTransactions,

          todayPhonesSold,

          todayReturns,
        },

        bestSellers,

        lowStock,

        branchPerformance,

        recentSales,

        recentReturns,
      });
    } catch (
      error
    ) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Failed to load dashboard data",
        });
    }
  };

// =====================================
// EXPORTS
// =====================================
module.exports = {
  getDashboardData,
};