import {
  useEffect,
  useState,
} from "react";

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
      p-3
      shadow-sm
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wide
        text-gray-500
      "
    >
      {title}
    </p>

    <h3
      className={`
        text-lg
        md:text-xl
        font-bold
        mt-1
        ${color}
      `}
    >
      {value}
    </h3>
  </div>
);

function Reports() {
  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =========================
  // FILTERS
  // =========================
  const [period, setPeriod] =
    useState("month");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const currentUser =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const isManager =
    currentUser?.role ===
    "manager";

  // =========================
  // LOAD REPORTS
  // =========================
  const fetchReports =
    async (
      selectedPeriod =
        period
    ) => {
      try {
        setLoading(true);

        let url =
          "/reports";

        const today =
          new Date();

        if (
          selectedPeriod ===
          "today"
        ) {
          const date =
            today
              .toISOString()
              .split(
                "T"
              )[0];

          url =
            `/reports?startDate=${date}&endDate=${date}`;
        } else if (
          selectedPeriod ===
          "week"
        ) {
          const weekAgo =
            new Date();

          weekAgo.setDate(
            weekAgo.getDate() -
              7
          );

          const start =
            weekAgo
              .toISOString()
              .split(
                "T"
              )[0];

          const end =
            today
              .toISOString()
              .split(
                "T"
              )[0];

          url =
            `/reports?startDate=${start}&endDate=${end}`;
        } else if (
          selectedPeriod ===
          "custom" &&
          startDate &&
          endDate
        ) {
          url =
            `/reports?startDate=${startDate}&endDate=${endDate}`;
        }

        const response =
          await api.get(
            url
          );

        setReport(
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
    };

  useEffect(() => {
    fetchReports(
      "month"
    );
  }, []);

  const handleApplyFilter =
    () => {
      fetchReports(
        period
      );
    };

  const handlePrint =
    () => {
      window.print();
    };

  const formatCurrency =
    (value) =>
      `UGX ${Number(
        value || 0
      ).toLocaleString()}`;

  const formatDate =
    (date) =>
      new Date(
        date
      ).toLocaleString();

  if (loading) {
    return (
      <div className="p-6">
        Loading reports...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 text-red-600">
        Failed to load reports
      </div>
    );
  }

  const {
    summary,
    periodAnalytics,
    daily,
    weekly,
    returnsAnalytics,
    branchReports,
    topProducts,
  } = report;

  const topBranch =
    branchReports.length >
    0
      ? [
          ...branchReports,
        ].sort(
          (
            a,
            b
          ) =>
            b.netRevenue -
            a.netRevenue
        )[0]
      : null;

  return (
    <div
      className="
        min-h-screen
        bg-gray-50
        p-4
        md:p-6
        space-y-5
      "
    >
      {/* ===================== */}
      {/* PRINT HEADER */}
      {/* ===================== */}
      <div
        className="
          hidden
          print:block
          mb-6
        "
      >
        <h1
          className="
            text-3xl
            font-bold
          "
        >
          Reports &
          Analytics
        </h1>

        <p
          className="
            text-sm
            text-gray-600
            mt-2
          "
        >
          Generated:
          {" "}
          {formatDate(
            new Date()
          )}
        </p>
      </div>

      {/* ===================== */}
      {/* PAGE HEADER */}
      {/* ===================== */}
            <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
          print:hidden
        "
      >
        <div>
          <h1
            className="
              text-2xl
              md:text-3xl
              font-black
              text-[#6b0f1a]
            "
          >
            Reports &
            Analytics
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              mt-1
            "
          >
            Revenue,
            inventory,
            sales,
            returns and
            branch performance
          </p>
        </div>

        <button
          onClick={
            handlePrint
          }
          className="
            px-4
            py-2
            rounded-lg
            bg-[#6b0f1a]
            text-white
            text-sm
            font-semibold
            hover:opacity-90
          "
        >
          Print Report
        </button>
      </div>

      {/* ===================== */}
      {/* FILTER TOOLBAR */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-xl
          border
          p-4
          shadow-sm
          print:hidden
        "
      >
        <div
          className="
            flex
            flex-wrap
            gap-2
            mb-4
          "
        >
          <button
            onClick={() =>
              setPeriod(
                "today"
              )
            }
            className={`
              px-3
              py-2
              rounded-lg
              text-sm
              font-medium
              ${
                period ===
                "today"
                  ? "bg-[#6b0f1a] text-white"
                  : "bg-gray-100"
              }
            `}
          >
            Today
          </button>

          <button
            onClick={() =>
              setPeriod(
                "week"
              )
            }
            className={`
              px-3
              py-2
              rounded-lg
              text-sm
              font-medium
              ${
                period ===
                "week"
                  ? "bg-[#6b0f1a] text-white"
                  : "bg-gray-100"
              }
            `}
          >
            Last 7 Days
          </button>

          <button
            onClick={() =>
              setPeriod(
                "month"
              )
            }
            className={`
              px-3
              py-2
              rounded-lg
              text-sm
              font-medium
              ${
                period ===
                "month"
                  ? "bg-[#6b0f1a] text-white"
                  : "bg-gray-100"
              }
            `}
          >
            This Month
          </button>

          <button
            onClick={() =>
              setPeriod(
                "custom"
              )
            }
            className={`
              px-3
              py-2
              rounded-lg
              text-sm
              font-medium
              ${
                period ===
                "custom"
                  ? "bg-[#6b0f1a] text-white"
                  : "bg-gray-100"
              }
            `}
          >
            Custom
          </button>
        </div>

        {period ===
          "custom" && (
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-3
            "
          >
            <input
              type="date"
              value={
                startDate
              }
              onChange={(
                e
              ) =>
                setStartDate(
                  e.target
                    .value
                )
              }
              className="
                border
                rounded-lg
                px-3
                py-2
              "
            />

            <input
              type="date"
              value={
                endDate
              }
              onChange={(
                e
              ) =>
                setEndDate(
                  e.target
                    .value
                )
              }
              className="
                border
                rounded-lg
                px-3
                py-2
              "
            />

            <button
              onClick={
                handleApplyFilter
              }
              className="
                bg-[#6b0f1a]
                text-white
                rounded-lg
                px-4
                py-2
                font-medium
              "
            >
              Apply Filter
            </button>
          </div>
        )}

        {period !==
          "custom" && (
          <button
            onClick={
              handleApplyFilter
            }
            className="
              bg-[#6b0f1a]
              text-white
              rounded-lg
              px-4
              py-2
              text-sm
              font-medium
            "
          >
            Refresh Report
          </button>
        )}
      </div>

      {/* ===================== */}
      {/* SELECTED PERIOD */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-xl
          border
          p-4
          shadow-sm
        "
      >
        <h2
          className="
            text-lg
            font-bold
            mb-3
          "
        >
          Selected Period
        </h2>

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-6
            gap-3
          "
        >
          <KPI
            title="Revenue"
            value={formatCurrency(
              periodAnalytics.grossRevenue
            )}
            color="text-green-600"
          />

          <KPI
            title="Returns"
            value={formatCurrency(
              periodAnalytics.returnedRevenue
            )}
            color="text-red-600"
          />

          <KPI
            title="Net Revenue"
            value={formatCurrency(
              periodAnalytics.netRevenue
            )}
            color="text-blue-600"
          />

          <KPI
            title="Transactions"
            value={
              periodAnalytics.transactions
            }
          />

          <KPI
            title="Phones Sold"
            value={
              periodAnalytics.phonesSold
            }
          />

          <KPI
            title="Net Profit"
            value={
              isManager
                ? formatCurrency(
                    periodAnalytics.netProfit
                  )
                : "Hidden"
            }
            color="text-indigo-600"
          />
        </div>
      </div>

      {/* ===================== */}
      {/* KPI RIBBON */}
      {/* ===================== */}
      <div
        className="
          grid
          grid-cols-2
          xl:grid-cols-6
          gap-3
        "
      >
        <KPI
          title="Gross Revenue"
          value={formatCurrency(
            summary.grossRevenue
          )}
          color="text-green-600"
        />

        <KPI
          title="Returns"
          value={formatCurrency(
            summary.returnedRevenue
          )}
          color="text-red-600"
        />

        <KPI
          title="Net Revenue"
          value={formatCurrency(
            summary.netRevenue
          )}
          color="text-blue-600"
        />

        <KPI
          title="Net Profit"
          value={
            isManager
              ? formatCurrency(
                  summary.netProfit
                )
              : "Hidden"
          }
          color="text-indigo-600"
        />

        <KPI
          title="Transactions"
          value={
            summary.transactions
          }
        />

        <KPI
          title="Stock Value"
          value={formatCurrency(
            summary.inventoryValue
          )}
        />
      </div>
            {/* ===================== */}
      {/* TODAY / WEEK */}
      {/* ===================== */}
      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-4
        "
      >
        {/* TODAY */}
        <div
          className="
            bg-white
            rounded-xl
            border
            p-4
            shadow-sm
          "
        >
          <h2
            className="
              text-base
              font-bold
              mb-3
            "
          >
            Today
          </h2>

          <div
            className="
              space-y-2
              text-sm
            "
          >
            <div className="flex justify-between">
              <span>
                Gross Revenue
              </span>

              <span className="font-semibold">
                {formatCurrency(
                  daily.grossRevenue
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Returned Revenue
              </span>

              <span className="font-semibold text-red-600">
                {formatCurrency(
                  daily.returnedRevenue
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Net Revenue
              </span>

              <span className="font-semibold text-green-600">
                {formatCurrency(
                  daily.netRevenue
                )}
              </span>
            </div>

            {isManager && (
              <div className="flex justify-between">
                <span>
                  Net Profit
                </span>

                <span className="font-semibold text-blue-600">
                  {formatCurrency(
                    daily.netProfit
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>
                Transactions
              </span>

              <span className="font-semibold">
                {daily.transactions}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Phones Sold
              </span>

              <span className="font-semibold">
                {daily.phonesSold}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Returns
              </span>

              <span className="font-semibold text-red-600">
                {daily.returns}
              </span>
            </div>
          </div>
        </div>

        {/* LAST 7 DAYS */}
        <div
          className="
            bg-white
            rounded-xl
            border
            p-4
            shadow-sm
          "
        >
          <h2
            className="
              text-base
              font-bold
              mb-3
            "
          >
            Last 7 Days
          </h2>

          <div
            className="
              space-y-2
              text-sm
            "
          >
            <div className="flex justify-between">
              <span>
                Gross Revenue
              </span>

              <span className="font-semibold">
                {formatCurrency(
                  weekly.grossRevenue
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Returned Revenue
              </span>

              <span className="font-semibold text-red-600">
                {formatCurrency(
                  weekly.returnedRevenue
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Net Revenue
              </span>

              <span className="font-semibold text-green-600">
                {formatCurrency(
                  weekly.netRevenue
                )}
              </span>
            </div>

            {isManager && (
              <div className="flex justify-between">
                <span>
                  Net Profit
                </span>

                <span className="font-semibold text-blue-600">
                  {formatCurrency(
                    weekly.netProfit
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>
                Transactions
              </span>

              <span className="font-semibold">
                {weekly.transactions}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Phones Sold
              </span>

              <span className="font-semibold">
                {weekly.phonesSold}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Returns
              </span>

              <span className="font-semibold text-red-600">
                {weekly.returns}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* RETURNS + TOP BRANCH */}
      {/* ===================== */}
      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-4
        "
      >
        {/* RETURNS */}
        <div
          className="
            bg-white
            rounded-xl
            border
            p-3
            shadow-sm
          "
        >
          <h2
            className="
              text-base
              font-bold
              mb-3
            "
          >
            Returns Analytics
          </h2>

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-3
            "
          >
            <div>
              <p className="text-xs text-gray-500">
                Total Returns
              </p>

              <h3 className="text-lg font-bold text-red-600">
                {
                  returnsAnalytics.returnsCount
                }
              </h3>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Returned Revenue
              </p>

              <h3 className="text-lg font-bold">
                {formatCurrency(
                  returnsAnalytics.returnedRevenue
                )}
              </h3>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Average Return
              </p>

              <h3 className="text-lg font-bold">
                {formatCurrency(
                  returnsAnalytics.averageReturnValue
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* TOP BRANCH */}
        {topBranch && (
          <div
            className="
              bg-white
              rounded-xl
              border
              p-3
              shadow-sm
            "
          >
            <h2
              className="
                text-base
                font-bold
                mb-3
              "
            >
              🏆 Top Performing Branch
            </h2>

            <h3
              className="
                text-lg
                font-bold
                text-[#6b0f1a]
              "
            >
              {
                topBranch.branchName
              }
            </h3>

            <div
              className="
                mt-3
                space-y-1
                text-sm
              "
            >
              <p>
                Revenue:
                {" "}
                {formatCurrency(
                  topBranch.netRevenue
                )}
              </p>

              <p>
                Phones Sold:
                {" "}
                {
                  topBranch.phonesSold
                }
              </p>

              <p>
                Stock Value:
                {" "}
                {formatCurrency(
                  topBranch.stockValue
                )}
              </p>
            </div>
          </div>
        )}
      </div>
            {/* ===================== */}
      {/* TOP PRODUCTS */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-xl
          border
          p-3
          shadow-sm
        "
      >
        <h2
          className="
            text-base
            font-bold
            mb-3
          "
        >
          Top Products
        </h2>

        {topProducts.length ===
        0 ? (
          <p className="text-sm text-gray-500">
            No sales data available
          </p>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">
                      Product
                    </th>

                    <th className="text-right py-2">
                      Sold
                    </th>

                    <th className="text-right py-2">
                      Revenue
                    </th>

                    {isManager && (
                      <th className="text-right py-2">
                        Profit
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {topProducts.map(
                    (
                      product,
                      index
                    ) => (
                      <tr
                        key={index}
                        className="border-b"
                      >
                        <td className="py-2">
                          {
                            product.brand
                          }
                          {" "}
                          {
                            product.model
                          }
                        </td>

                        <td className="text-right py-2">
                          {
                            product.sold
                          }
                        </td>

                        <td className="text-right py-2">
                          {formatCurrency(
                            product.revenue
                          )}
                        </td>

                        {isManager && (
                          <td className="text-right py-2">
                            {formatCurrency(
                              product.profit
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="md:hidden space-y-2">
              {topProducts.map(
                (
                  product,
                  index
                ) => (
                  <div
                    key={index}
                    className="
                      border
                      rounded-lg
                      p-3
                    "
                  >
                    <div className="font-semibold">
                      {
                        product.brand
                      }
                      {" "}
                      {
                        product.model
                      }
                    </div>

                    <div className="text-sm text-gray-500 mt-1">
                      Sold:
                      {" "}
                      {
                        product.sold
                      }
                    </div>

                    <div className="text-sm text-gray-500">
                      Revenue:
                      {" "}
                      {formatCurrency(
                        product.revenue
                      )}
                    </div>

                    {isManager && (
                      <div className="text-sm text-gray-500">
                        Profit:
                        {" "}
                        {formatCurrency(
                          product.profit
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* ===================== */}
      {/* BRANCH PERFORMANCE */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-xl
          border
          p-3
          shadow-sm
        "
      >
        <h2
          className="
            text-base
            font-bold
            mb-3
          "
        >
          Branch Performance
        </h2>

        {branchReports.length ===
        0 ? (
          <p className="text-sm text-gray-500">
            No branch data available
          </p>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">
                      Branch
                    </th>

                    <th className="text-right py-2">
                      Revenue
                    </th>

                    <th className="text-right py-2">
                      Phones
                    </th>

                    <th className="text-right py-2">
                      Stock
                    </th>

                    {isManager && (
                      <th className="text-right py-2">
                        Profit
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {branchReports.map(
                    (
                      branch
                    ) => (
                      <tr
                        key={
                          branch.branchId
                        }
                        className="border-b"
                      >
                        <td className="py-2">
                          {
                            branch.branchName
                          }
                        </td>

                        <td className="text-right py-2">
                          {formatCurrency(
                            branch.netRevenue
                          )}
                        </td>

                        <td className="text-right py-2">
                          {
                            branch.phonesSold
                          }
                        </td>

                        <td className="text-right py-2">
                          {formatCurrency(
                            branch.stockValue
                          )}
                        </td>

                        {isManager && (
                          <td className="text-right py-2">
                            {formatCurrency(
                              branch.netProfit
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="md:hidden space-y-3">
              {branchReports.map(
                (
                  branch
                ) => (
                  <div
                    key={
                      branch.branchId
                    }
                    className="
                      border
                      rounded-lg
                      p-3
                    "
                  >
                    <div className="font-bold">
                      {
                        branch.branchName
                      }
                    </div>

                    <div className="text-sm mt-2 space-y-1">
                      <div>
                        Revenue:
                        {" "}
                        {formatCurrency(
                          branch.netRevenue
                        )}
                      </div>

                      <div>
                        Phones:
                        {" "}
                        {
                          branch.phonesSold
                        }
                      </div>

                      <div>
                        Stock:
                        {" "}
                        {formatCurrency(
                          branch.stockValue
                        )}
                      </div>

                      {isManager && (
                        <div>
                          Profit:
                          {" "}
                          {formatCurrency(
                            branch.netProfit
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* ===================== */}
      {/* PRINT FOOTER */}
      {/* ===================== */}
      <div
        className="
          hidden
          print:block
          mt-8
          text-center
          text-sm
          text-gray-500
        "
      >
        End of Report
      </div>
    </div>
  );
}

export default Reports;