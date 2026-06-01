import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../services/api";

// =========================
// KPI CARD
// =========================
const KPI = ({
  title,
  value,
  color =
    "text-gray-900",
}) => (
  <div
    className="
      bg-white
      rounded-xl
      border
      border-orange-100
      p-3
      shadow-sm
      hover:shadow-md
      transition
    "
  >
    <p
      className="
        text-[10px]
        uppercase
        tracking-wider
        text-gray-500
      "
    >
      {title}
    </p>

    <h2
      className={`
        text-lg
        md:text-xl
        font-black
        mt-1
        ${color}
      `}
    >
      {value}
    </h2>
  </div>
);

function Dashboard() {
  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const isManager =
    user?.role ===
    "manager";

  // =========================
  // FETCH DATA
  // =========================
  async function fetchData() {
    try {
      const response =
        await api.get(
          "/dashboard"
        );

      setDashboardData(
        response.data
      );
    } catch (
      error
    ) {
      console.log(
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // CURRENCY
  // =========================
  function formatCurrency(
    value
  ) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading dashboard...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        Failed to load dashboard
      </div>
    );
  }

  const {
    summary,
    bestSellers,
    lowStock,
    recentSales,
    recentReturns,
    branchPerformance,
  } = dashboardData;

  return (
    <div
      className="
        min-h-screen
        bg-orange-50
        p-3
        md:p-5
        space-y-4
      "
    >

      {/* ===================== */}
      {/* HEADER */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-2xl
          border
          border-orange-100
          shadow-sm
          p-5
        "
      >

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
          "
        >

          <div>

            <h1
              className="
                text-3xl
                md:text-4xl
                font-black
                text-orange-700
              "
            >
              Dashboard
            </h1>

            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              Gadget Shop
              Performance Center
            </p>

            <p
              className="
                text-xs
                text-gray-400
                mt-2
              "
            >
              Last Updated:
              {" "}
              {new Date().toLocaleString()}
            </p>

          </div>

          {/* QUICK ACTIONS */}
          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >

            <Link
              to="/sales-terminal"
              className="
                bg-orange-700
                hover:bg-orange-800
                text-white
                px-4
                py-2
                rounded-xl
                text-sm
                font-semibold
                transition
              "
            >
              Sales
            </Link>

            <Link
              to="/inventory"
              className="
                bg-orange-600
                hover:bg-orange-700
                text-white
                px-4
                py-2
                rounded-xl
                text-sm
                font-semibold
                transition
              "
            >
              Inventory
            </Link>

            <Link
              to="/returns"
              className="
                bg-amber-600
                hover:bg-amber-700
                text-white
                px-4
                py-2
                rounded-xl
                text-sm
                font-semibold
                transition
              "
            >
              Returns
            </Link>

            <Link
              to="/reports"
              className="
                bg-gray-800
                hover:bg-black
                text-white
                px-4
                py-2
                rounded-xl
                text-sm
                font-semibold
                transition
              "
            >
              Reports
            </Link>

          </div>

        </div>

      </div>

      {/* STAFF NOTICE */}
      {!isManager && (
        <div
          className="
            bg-orange-100
            border
            border-orange-200
            rounded-xl
            p-3
            text-sm
            text-orange-800
          "
        >
          You are viewing
          branch-specific
          performance data.
        </div>
      )}

      {/* ===================== */}
      {/* MAIN KPI RIBBON */}
      {/* ===================== */}
      <div
        className={`
          grid
          gap-3
          ${
            isManager
              ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
              : "grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          }
        `}
      >

        <KPI
          title="Inventory Units"
          value={
            summary.inventoryCount
          }
          color="text-orange-700"
        />

        <KPI
          title={
            isManager
              ? "Inventory Value"
              : "Stock Value"
          }
          value={`UGX ${formatCurrency(
            summary.stockValue
          )}`}
          color="text-orange-700"
        />

        <KPI
          title="Revenue"
          value={`UGX ${formatCurrency(
            summary.totalRevenue
          )}`}
          color="text-green-600"
        />

        {isManager && (
          <KPI
            title="Profit"
            value={`UGX ${formatCurrency(
              summary.totalProfit
            )}`}
            color="text-blue-600"
          />
        )}

        <KPI
          title="Phones Sold"
          value={
            summary.totalPhonesSold
          }
          color="text-purple-600"
        />

        <KPI
          title="Returns"
          value={
            summary.totalReturns
          }
          color="text-red-600"
        />

      </div>
            {/* ===================== */}
      {/* TODAY'S PERFORMANCE */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-2xl
          border
          border-orange-100
          p-4
          shadow-sm
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            mb-3
          "
        >

          <h2
            className="
              text-lg
              font-black
              text-orange-700
            "
          >
            Today's Performance
          </h2>

          <span
            className="
              bg-orange-100
              text-orange-700
              px-3
              py-1
              rounded-full
              text-xs
              font-semibold
            "
          >
            LIVE
          </span>

        </div>

        <div
          className={`
            grid
            gap-3
            ${
              isManager
                ? "grid-cols-2 md:grid-cols-5"
                : "grid-cols-2 md:grid-cols-4"
            }
          `}
        >

          <KPI
            title="Revenue"
            value={`UGX ${formatCurrency(
              summary.todayRevenue
            )}`}
            color="text-green-600"
          />

          {isManager && (
            <KPI
              title="Profit"
              value={`UGX ${formatCurrency(
                summary.todayProfit
              )}`}
              color="text-blue-600"
            />
          )}

          <KPI
            title="Phones Sold"
            value={
              summary.todayPhonesSold
            }
            color="text-purple-600"
          />

          <KPI
            title="Transactions"
            value={
              summary.todayTransactions
            }
            color="text-amber-600"
          />

          <KPI
            title="Returns"
            value={
              summary.todayReturns
            }
            color="text-red-600"
          />

        </div>

      </div>

      {/* ===================== */}
      {/* BRANCH PERFORMANCE */}
      {/* ===================== */}
      {isManager && (
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-orange-100
            p-4
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              mb-4
            "
          >

            <h2
              className="
                text-lg
                font-black
                text-orange-700
              "
            >
              Branch Performance
            </h2>

            <span
              className="
                text-xs
                text-gray-500
              "
            >
              Top Performing Branches
            </span>

          </div>

          {branchPerformance?.length ===
          0 ? (
            <div
              className="
                text-sm
                text-gray-500
              "
            >
              No branch performance
              data available.
            </div>
          ) : (
            <div
              className="
                grid
                md:grid-cols-2
                xl:grid-cols-3
                gap-3
              "
            >

              {branchPerformance.map(
                (
                  branch,
                  index
                ) => (
                  <div
                    key={index}
                    className="
                      border
                      border-orange-100
                      rounded-xl
                      p-4
                    "
                  >

                    <div
                      className="
                        flex
                        justify-between
                        items-start
                      "
                    >

                      <div>

                        <h3
                          className="
                            font-bold
                            text-gray-800
                          "
                        >
                          {
                            branch.branch
                          }
                        </h3>

                        <p
                          className="
                            text-xs
                            text-gray-500
                            mt-1
                          "
                        >
                          {
                            branch.transactions
                          }
                          {" "}
                          Transactions
                        </p>

                        <p
                          className="
                            text-xs
                            text-gray-500
                          "
                        >
                          {
                            branch.phonesSold
                          }
                          {" "}
                          Phones Sold
                        </p>

                      </div>

                      <div
                        className="
                          text-right
                        "
                      >

                        <p
                          className="
                            text-green-600
                            font-black
                            text-sm
                          "
                        >
                          UGX{" "}
                          {formatCurrency(
                            branch.revenue
                          )}
                        </p>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>
      )}

      {/* ===================== */}
      {/* BEST SELLERS + LOW STOCK */}
      {/* ===================== */}
      <div
        className="
          grid
          xl:grid-cols-2
          gap-4
        "
      >

        {/* BEST SELLERS */}
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-orange-100
            p-4
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              mb-3
            "
          >

            <h2
              className="
                text-lg
                font-black
                text-orange-700
              "
            >
              Best Sellers
            </h2>

            <span
              className="
                text-xs
                text-gray-500
              "
            >
              Top 5 Models
            </span>

          </div>

          {bestSellers.length ===
          0 ? (
            <div
              className="
                text-sm
                text-gray-500
              "
            >
              No sales data yet.
            </div>
          ) : (
            <div className="space-y-2">

              {bestSellers.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={index}
                    className="
                      flex
                      justify-between
                      items-center
                      border-b
                      border-orange-100
                      pb-2
                      last:border-0
                    "
                  >

                    <div
                      className="
                        text-sm
                        font-medium
                      "
                    >
                      {item.name}
                    </div>

                    <div
                      className="
                        bg-green-100
                        text-green-700
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-bold
                      "
                    >
                      {item.sold}
                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* LOW STOCK */}
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-red-200
            p-4
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              mb-3
            "
          >

            <h2
              className="
                text-lg
                font-black
                text-red-600
              "
            >
              Low Stock Models
            </h2>

            <span
              className="
                bg-red-100
                text-red-700
                px-3
                py-1
                rounded-full
                text-xs
                font-semibold
              "
            >
              Attention
            </span>

          </div>

          {lowStock.length ===
          0 ? (
            <div
              className="
                text-green-600
                font-medium
                text-sm
              "
            >
              Inventory levels are healthy.
            </div>
          ) : (
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >

              {lowStock.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={index}
                    className="
                      bg-red-50
                      border
                      border-red-200
                      px-3
                      py-2
                      rounded-xl
                    "
                  >

                    <div
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      {item.brand}
                      {" "}
                      {item.model}
                    </div>

                    <div
                      className="
                        text-xs
                        text-red-600
                        font-bold
                        mt-1
                      "
                    >
                      Remaining:
                      {" "}
                      {item.count}
                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>
            {/* ===================== */}
      {/* RECENT RETURNS */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-2xl
          border
          border-orange-100
          p-4
          shadow-sm
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            mb-3
          "
        >

          <h2
            className="
              text-lg
              font-black
              text-red-600
            "
          >
            Recent Returns
          </h2>

          <span
            className="
              text-xs
              text-gray-500
            "
          >
            Latest 5
          </span>

        </div>

        {recentReturns.length ===
        0 ? (
          <div
            className="
              text-sm
              text-gray-500
            "
          >
            No recent returns.
          </div>
        ) : (
          <div
            className="
              grid
              md:grid-cols-2
              xl:grid-cols-3
              gap-3
            "
          >

            {recentReturns.map(
              (
                sale
              ) => (
                <div
                  key={
                    sale._id
                  }
                  className="
                    border
                    border-red-200
                    rounded-xl
                    p-3
                    bg-red-50
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                      items-start
                    "
                  >

                    <div>

                      <h3
                        className="
                          font-semibold
                          text-sm
                        "
                      >
                        {
                          sale.customerName
                        }
                      </h3>

                      <p
                        className="
                          text-xs
                          text-gray-500
                          mt-1
                        "
                      >
                        Receipt:
                        {" "}
                        {
                          sale.receiptNumber
                        }
                      </p>

                      {isManager &&
                        sale.branch && (
                          <p
                            className="
                              text-xs
                              text-gray-500
                            "
                          >
                            Branch:
                            {" "}
                            {
                              sale
                                .branch
                                ?.name
                            }
                          </p>
                        )}

                    </div>

                    <span
                      className="
                        bg-red-100
                        text-red-700
                        px-2
                        py-1
                        rounded-full
                        text-[10px]
                        font-bold
                      "
                    >
                      RETURNED
                    </span>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* ===================== */}
      {/* RECENT TRANSACTIONS */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-2xl
          border
          border-orange-100
          p-4
          shadow-sm
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            mb-4
          "
        >

          <h2
            className="
              text-lg
              font-black
              text-orange-700
            "
          >
            Recent Transactions
          </h2>

          <span
            className="
              text-xs
              text-gray-500
            "
          >
            Latest 5
          </span>

        </div>

        {/* DESKTOP TABLE */}
        <div
          className="
            hidden
            lg:block
            overflow-x-auto
          "
        >

          <table
            className="
              w-full
            "
          >

            <thead>

              <tr
                className="
                  border-b
                  border-orange-100
                "
              >

                <th
                  className="
                    text-left
                    py-3
                    text-xs
                    uppercase
                    tracking-wide
                  "
                >
                  Customer
                </th>

                {isManager && (
                  <th
                    className="
                      text-left
                      py-3
                      text-xs
                      uppercase
                    "
                  >
                    Branch
                  </th>
                )}

                <th
                  className="
                    text-left
                    py-3
                    text-xs
                    uppercase
                  "
                >
                  Payment
                </th>

                <th
                  className="
                    text-left
                    py-3
                    text-xs
                    uppercase
                  "
                >
                  Receipt
                </th>

                <th
                  className="
                    text-left
                    py-3
                    text-xs
                    uppercase
                  "
                >
                  Amount
                </th>

                <th
                  className="
                    text-left
                    py-3
                    text-xs
                    uppercase
                  "
                >
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {recentSales.length ===
              0 ? (
                <tr>

                  <td
                    colSpan={
                      isManager
                        ? 6
                        : 5
                    }
                    className="
                      py-6
                      text-center
                      text-sm
                      text-gray-500
                    "
                  >
                    No transactions
                    found.
                  </td>

                </tr>
              ) : (
                recentSales.map(
                  (
                    sale
                  ) => (
                    <tr
                      key={
                        sale._id
                      }
                      className="
                        border-b
                        border-orange-50
                        last:border-0
                      "
                    >

                      <td
                        className="
                          py-3
                          text-sm
                          font-medium
                        "
                      >
                        {
                          sale.customerName
                        }
                      </td>

                      {isManager && (
                        <td
                          className="
                            py-3
                            text-sm
                          "
                        >
                          {
                            sale.branch
                              ?.name
                          }
                        </td>
                      )}

                      <td
                        className="
                          py-3
                          text-sm
                        "
                      >
                        {
                          sale.paymentMethod
                        }
                      </td>

                      <td
                        className="
                          py-3
                          text-xs
                          font-mono
                        "
                      >
                        {
                          sale.receiptNumber
                        }
                      </td>

                      <td
                        className="
                          py-3
                          text-sm
                          font-bold
                          text-green-600
                        "
                      >
                        UGX{" "}
                        {formatCurrency(
                          sale.totalAmount
                        )}
                      </td>

                      <td
                        className="
                          py-3
                        "
                      >
                        {sale.status ===
                        "Returned" ? (
                          <span
                            className="
                              bg-red-100
                              text-red-700
                              px-3
                              py-1
                              rounded-full
                              text-xs
                              font-semibold
                            "
                          >
                            Returned
                          </span>
                        ) : (
                          <span
                            className="
                              bg-green-100
                              text-green-700
                              px-3
                              py-1
                              rounded-full
                              text-xs
                              font-semibold
                            "
                          >
                            Completed
                          </span>
                        )}
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

        {/* MOBILE CARDS */}
        <div
          className="
            lg:hidden
            space-y-2
          "
        >

          {recentSales.length ===
          0 ? (
            <div
              className="
                py-6
                text-center
                text-sm
                text-gray-500
              "
            >
              No transactions
              found.
            </div>
          ) : (
            recentSales.map(
              (
                sale
              ) => (
                <div
                  key={
                    sale._id
                  }
                  className="
                    border
                    border-orange-100
                    rounded-xl
                    p-3
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                      items-start
                    "
                  >

                    <div>

                      <h3
                        className="
                          font-semibold
                          text-sm
                        "
                      >
                        {
                          sale.customerName
                        }
                      </h3>

                      <p
                        className="
                          text-xs
                          text-gray-500
                        "
                      >
                        Receipt:
                        {" "}
                        {
                          sale.receiptNumber
                        }
                      </p>

                      {isManager &&
                        sale.branch && (
                          <p
                            className="
                              text-xs
                              text-gray-500
                            "
                          >
                            Branch:
                            {" "}
                            {
                              sale
                                .branch
                                ?.name
                            }
                          </p>
                        )}

                      <p
                        className="
                          text-xs
                          text-gray-500
                        "
                      >
                        {
                          sale.paymentMethod
                        }
                      </p>

                    </div>

                    <div
                      className="
                        text-right
                      "
                    >

                      <p
                        className="
                          text-green-600
                          font-bold
                          text-sm
                        "
                      >
                        UGX{" "}
                        {formatCurrency(
                          sale.totalAmount
                        )}
                      </p>

                      <div className="mt-1">

                        {sale.status ===
                        "Returned" ? (
                          <span
                            className="
                              bg-red-100
                              text-red-700
                              px-2
                              py-1
                              rounded-full
                              text-[10px]
                              font-semibold
                            "
                          >
                            Returned
                          </span>
                        ) : (
                          <span
                            className="
                              bg-green-100
                              text-green-700
                              px-2
                              py-1
                              rounded-full
                              text-[10px]
                              font-semibold
                            "
                          >
                            Completed
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                </div>
              )
            )
          )}

        </div>

      </div>

    </div>
  );
}

export default Dashboard;