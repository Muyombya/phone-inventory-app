import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

function ReturnsHistory() {
  const [returns, setReturns] =
    useState([]);

  const [
    analytics,
    setAnalytics,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    periodFilter,
    setPeriodFilter,
  ] = useState("30days");

  const [
    reasonFilter,
    setReasonFilter,
  ] = useState("all");

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("all");

  const [
    expandedReturn,
    setExpandedReturn,
  ] = useState(null);

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData =
    async () => {
      try {
        setLoading(true);

        const [
          returnsResponse,
          analyticsResponse,
        ] =
          await Promise.all([
            api.get(
              "/returns"
            ),

            api.get(
              "/returns/analytics"
            ),
          ]);

        setReturns(
          returnsResponse.data ||
            []
        );

        setAnalytics(
          analyticsResponse.data
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

  // =========================
  // HELPERS
  // =========================
  const formatDate =
    (date) => {
      if (!date) {
        return "-";
      }

      return new Date(
        date
      ).toLocaleString();
    };

  const formatMoney =
    (value) =>
      Number(
        value || 0
      ).toLocaleString();

  // =========================
  // FILTER OPTIONS
  // =========================
  const branches =
    useMemo(() => {
      const values =
        returns
          .map(
            (
              record
            ) =>
              record.branch
                ?.name
          )
          .filter(
            Boolean
          );

      return [
        ...new Set(
          values
        ),
      ].sort();
    }, [returns]);

  const reasons =
    useMemo(() => {
      const values =
        returns
          .map(
            (
              record
            ) =>
              record.reason
          )
          .filter(
            Boolean
          );

      return [
        ...new Set(
          values
        ),
      ].sort();
    }, [returns]);

  // =========================
  // FILTERED DATA
  // =========================
  const filteredReturns =
    useMemo(() => {
      let filtered =
        [...returns];

      // PERIOD
      if (
        periodFilter !==
        "all"
      ) {
        const now =
          new Date();

        filtered =
          filtered.filter(
            (
              record
            ) => {
              const recordDate =
                new Date(
                  record.createdAt
                );

              if (
                periodFilter ===
                "today"
              ) {
                return (
                  recordDate.toDateString() ===
                  now.toDateString()
                );
              }

              if (
                periodFilter ===
                "7days"
              ) {
                const cutoff =
                  new Date();

                cutoff.setDate(
                  cutoff.getDate() -
                    7
                );

                return (
                  recordDate >=
                  cutoff
                );
              }

              if (
                periodFilter ===
                "30days"
              ) {
                const cutoff =
                  new Date();

                cutoff.setDate(
                  cutoff.getDate() -
                    30
                );

                return (
                  recordDate >=
                  cutoff
                );
              }

              return true;
            }
          );
      }

      // REASON
      if (
        reasonFilter !==
        "all"
      ) {
        filtered =
          filtered.filter(
            (
              record
            ) =>
              record.reason ===
              reasonFilter
          );
      }

      // BRANCH
      if (
        branchFilter !==
        "all"
      ) {
        filtered =
          filtered.filter(
            (
              record
            ) =>
              record.branch
                ?.name ===
              branchFilter
          );
      }

      // SEARCH
      if (
        searchTerm.trim()
      ) {
        const query =
          searchTerm.toLowerCase();

        filtered =
          filtered.filter(
            (
              record
            ) => {
              const sale =
                record.sale ||
                {};

              const itemText =
                record.items
                  ?.map(
                    (
                      item
                    ) =>
                      `${item.brand} ${item.model} ${item.imei}`
                  )
                  .join(
                    " "
                  )
                  .toLowerCase() ||
                "";

              return (
                sale.receiptNumber
                  ?.toLowerCase()
                  .includes(
                    query
                  ) ||
                sale.customerName
                  ?.toLowerCase()
                  .includes(
                    query
                  ) ||
                record.reason
                  ?.toLowerCase()
                  .includes(
                    query
                  ) ||
                itemText.includes(
                  query
                )
              );
            }
          );
      }

      return filtered;
    }, [
      returns,
      searchTerm,
      periodFilter,
      reasonFilter,
      branchFilter,
    ]);

  // =========================
  // KPIs
  // =========================
  const totalReturns =
    filteredReturns.length;

  const returnedPhones =
    filteredReturns.reduce(
      (
        total,
        record
      ) =>
        total +
        (
          record.items
            ?.length || 0
        ),
      0
    );

  const returnedRevenue =
    filteredReturns.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.sale
            ?.returnedRevenue ||
            0
        ),
      0
    );

  const returnedProfit =
    filteredReturns.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.sale
            ?.returnedProfit ||
            0
        ),
      0
    );

  const averageReturnValue =
    totalReturns > 0
      ? Math.round(
          returnedRevenue /
            totalReturns
        )
      : 0;

  const topReason =
    analytics
      ?.topReasons?.[0]
      ?.reason ||
    "-";

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading returns...
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-rose-50
        p-4
        md:p-6
        space-y-4
      "
    >

      {/* HEADER */}
      <div
        className="
          bg-white
          rounded-xl
          border
          p-4
          shadow-sm
        "
      >
        <h1
          className="
            text-2xl
            md:text-3xl
            font-black
            text-[#6b0f1a]
          "
        >
          Returns History
        </h1>

        <p
          className="
            text-sm
            text-gray-500
            mt-1
          "
        >
          Returned sales,
          recovered inventory
          and return tracking.
        </p>
      </div>

      {/* KPI RIBBON */}
      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-5
          gap-3
        "
      >
        <div className="bg-white border rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500">
            Total Returns
          </p>

          <h2 className="text-xl font-black">
            {totalReturns}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500">
            Returned Phones
          </p>

          <h2 className="text-xl font-black">
            {returnedPhones}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500">
            Avg Return Value
          </p>

          <h2 className="text-xl font-black">
            {formatMoney(
              averageReturnValue
            )}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500">
            Top Reason
          </p>

          <h2 className="text-sm font-bold mt-1">
            {topReason}
          </h2>
        </div>

        {user.role ===
          "manager" && (
          <div className="bg-white border rounded-xl p-3 shadow-sm">
            <p className="text-xs text-gray-500">
              Returned Revenue
            </p>

            <h2 className="text-lg font-black text-red-600">
              {formatMoney(
                returnedRevenue
              )}
            </h2>
          </div>
        )}
      </div>
            {/* FILTERS */}
      <div
        className="
          bg-white
          rounded-xl
          border
          p-4
          shadow-sm
        "
      >
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-4
            gap-3
          "
        >
          <input
            type="text"
            placeholder="Search receipt, customer, IMEI..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="
              border
              rounded-lg
              px-3
              py-2
            "
          />

          <select
            value={
              periodFilter
            }
            onChange={(e) =>
              setPeriodFilter(
                e.target.value
              )
            }
            className="
              border
              rounded-lg
              px-3
              py-2
            "
          >
            <option value="today">
              Today
            </option>

            <option value="7days">
              Last 7 Days
            </option>

            <option value="30days">
              Last 30 Days
            </option>

            <option value="all">
              All Time
            </option>
          </select>

          <select
            value={
              reasonFilter
            }
            onChange={(e) =>
              setReasonFilter(
                e.target.value
              )
            }
            className="
              border
              rounded-lg
              px-3
              py-2
            "
          >
            <option value="all">
              All Reasons
            </option>

            {reasons.map(
              (
                reason
              ) => (
                <option
                  key={
                    reason
                  }
                  value={
                    reason
                  }
                >
                  {reason}
                </option>
              )
            )}
          </select>

          {user.role ===
            "manager" && (
            <select
              value={
                branchFilter
              }
              onChange={(e) =>
                setBranchFilter(
                  e.target.value
                )
              }
              className="
                border
                rounded-lg
                px-3
                py-2
              "
            >
              <option value="all">
                All Branches
              </option>

              {branches.map(
                (
                  branch
                ) => (
                  <option
                    key={
                      branch
                    }
                    value={
                      branch
                    }
                  >
                    {branch}
                  </option>
                )
              )}
            </select>
          )}
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div
        className="
          hidden
          lg:block
          bg-white
          rounded-xl
          border
          shadow-sm
          overflow-hidden
        "
      >
        <div
          className="
            overflow-x-auto
          "
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-xs uppercase">
                  Date
                </th>

                <th className="p-3 text-left text-xs uppercase">
                  Receipt
                </th>

                <th className="p-3 text-left text-xs uppercase">
                  Customer
                </th>

                <th className="p-3 text-left text-xs uppercase">
                  Phones
                </th>

                <th className="p-3 text-left text-xs uppercase">
                  Reason
                </th>

                <th className="p-3 text-left text-xs uppercase">
                  Branch
                </th>

                <th className="p-3 text-left text-xs uppercase">
                  Returned By
                </th>

                {user.role ===
                  "manager" && (
                  <th className="p-3 text-left text-xs uppercase">
                    Revenue
                  </th>
                )}

                <th className="p-3 text-left text-xs uppercase">
                  Details
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredReturns.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      user.role ===
                      "manager"
                        ? 9
                        : 8
                    }
                    className="
                      p-8
                      text-center
                      text-gray-500
                    "
                  >
                    No returns found
                  </td>
                </tr>
              ) : (
                filteredReturns.map(
                  (
                    record
                  ) => (
                    <React.Fragment
                      key={
                        record._id
                      }
                    >
                      <tr
                        className="
                          border-t
                          hover:bg-gray-50
                        "
                      >
                        <td className="p-3 text-sm">
                          {formatDate(
                            record.createdAt
                          )}
                        </td>

                        <td className="p-3 text-sm font-medium">
                          {record.sale
                            ?.receiptNumber ||
                            "-"}
                        </td>

                        <td className="p-3 text-sm">
                          {record.sale
                            ?.customerName ||
                            "-"}
                        </td>

                        <td className="p-3 text-sm">
                          {record.items
                            ?.length ||
                            0}
                        </td>

                        <td className="p-3 text-sm">
                          {
                            record.reason
                          }
                        </td>

                        <td className="p-3 text-sm">
                          {record.branch
                            ?.name ||
                            "-"}
                        </td>

                        <td className="p-3 text-sm">
                          {record
                            .returnedBy
                            ?.username ||
                            "-"}
                        </td>

                        {user.role ===
                          "manager" && (
                          <td className="p-3 text-sm text-red-600 font-semibold">
                            {formatMoney(
                              record
                                .sale
                                ?.returnedRevenue
                            )}
                          </td>
                        )}

                        <td className="p-3">
                          <button
                            onClick={() =>
                              setExpandedReturn(
                                expandedReturn ===
                                  record._id
                                  ? null
                                  : record._id
                              )
                            }
                            className="
                              px-3
                              py-1
                              rounded-lg
                              bg-[#6b0f1a]
                              text-white
                              text-xs
                            "
                          >
                            {expandedReturn ===
                            record._id
                              ? "Hide"
                              : "View"}
                          </button>
                        </td>
                      </tr>

                      {expandedReturn ===
                        record._id && (
                        <tr
                          className="
                            bg-gray-50
                          "
                        >
                          <td
                            colSpan={
                              user.role ===
                              "manager"
                                ? 9
                                : 8
                            }
                            className="
                              p-4
                            "
                          >
                            <div className="space-y-3">

                              <div>
                                <strong>
                                  Reason:
                                </strong>{" "}
                                {
                                  record.reason
                                }
                              </div>

                              {user.role ===
                                "manager" && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <strong>
                                      Returned Revenue:
                                    </strong>{" "}
                                    {formatMoney(
                                      record
                                        .sale
                                        ?.returnedRevenue
                                    )}
                                  </div>

                                  <div>
                                    <strong>
                                      Returned Profit:
                                    </strong>{" "}
                                    {formatMoney(
                                      record
                                        .sale
                                        ?.returnedProfit
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                {record.items?.map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <div
                                      key={
                                        index
                                      }
                                      className="
                                        bg-white
                                        border
                                        rounded-lg
                                        p-3
                                      "
                                    >
                                      <div className="font-medium">
                                        {item.brand}{" "}
                                        {item.model}
                                      </div>

                                      <div className="text-xs text-gray-500 mt-1">
                                        IMEI:{" "}
                                        {
                                          item.imei
                                        }
                                      </div>

                                      <div className="text-xs text-gray-500">
                                        Final Price:{" "}
                                        {formatMoney(
                                          item.finalPrice
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE */}
      <div
        className="
          lg:hidden
          space-y-3
        "
      >
        {filteredReturns.map(
          (
            record
          ) => (
            <div
              key={
                record._id
              }
              className="
                bg-white
                border
                rounded-xl
                p-4
                shadow-sm
              "
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-sm">
                    {record.sale
                      ?.receiptNumber ||
                      "-"}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {record.sale
                      ?.customerName ||
                      "-"}
                  </p>
                </div>

                <span
                  className="
                    bg-red-100
                    text-red-700
                    px-2
                    py-1
                    rounded-full
                    text-xs
                    font-semibold
                  "
                >
                  Return
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <strong>
                    Phones:
                  </strong>{" "}
                  {record.items
                    ?.length ||
                    0}
                </p>

                <p>
                  <strong>
                    Reason:
                  </strong>{" "}
                  {
                    record.reason
                  }
                </p>

                <p>
                  <strong>
                    Returned By:
                  </strong>{" "}
                  {record
                    .returnedBy
                    ?.username ||
                    "-"}
                </p>

                <p>
                  <strong>
                    Date:
                  </strong>{" "}
                  {formatDate(
                    record.createdAt
                  )}
                </p>
              </div>
            </div>
          )
        )}
      </div>

    </div>
  );
}

export default ReturnsHistory;