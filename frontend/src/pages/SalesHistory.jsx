import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../services/api";

import * as XLSX from "xlsx";

import { saveAs }
  from "file-saver";

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

function SalesHistory() {
  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const isManager =
    user?.role ===
    "manager";

  const [sales, setSales] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  // =========================
  // DATE FILTERS
  // =========================
  const [period, setPeriod] =
    useState("month");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // =========================
  // LOAD SALES
  // =========================
  async function fetchSales(
    selectedPeriod =
      period
  ) {
    try {
      setLoading(true);

      let url =
        "/sales";

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
          `/sales?startDate=${date}&endDate=${date}`;
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
          `/sales?startDate=${start}&endDate=${end}`;
      } else if (
        selectedPeriod ===
          "custom" &&
        startDate &&
        endDate
      ) {
        url =
          `/sales?startDate=${startDate}&endDate=${endDate}`;
      }

      const response =
        await api.get(
          url
        );

      setSales(
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
    fetchSales(
      "month"
    );

    if (isManager) {
      fetchBranches();
    }
  }, []);

  async function fetchBranches() {
    try {
      const response =
        await api.get(
          "/branches"
        );

      setBranches(
        response.data || []
      );
    } catch (
      error
    ) {
      console.log(
        error
      );
    }
  }

  function handleApplyFilter() {
    fetchSales(
      period
    );
  }

  function handlePrint() {
    window.print();
  }

  // =========================
  // DELETE SALE
  // =========================
  async function deleteSale(
    id
  ) {
    if (!isManager)
      return;

    const confirmed =
      window.confirm(
        "Delete this sale and restore inventory?"
      );

    if (!confirmed)
      return;

    try {
      await api.delete(
        `/sales/${id}`
      );

      alert(
        "Sale deleted successfully"
      );

      fetchSales(
        period
      );
    } catch (
      error
    ) {
      console.log(
        error
      );

      alert(
        error?.response?.data
          ?.message ||
          "Failed to delete sale"
      );
    }
  }

  // =========================
  // RETURN SALE
  // =========================
  async function returnSale(
    sale
  ) {
    if (!isManager)
      return;

    const reason =
      window.prompt(
        "Reason for return:"
      );

    if (
      !reason ||
      !reason.trim()
    ) {
      return;
    }

    const returnData = {
      reason,
    };

    const saleBranch =
      sale.branch ||
      sale.items?.find(
        (item) =>
          item.branch
      )?.branch;

    if (!saleBranch) {
      if (
        branches.length === 0
      ) {
        alert(
          "This sale has no branch assigned, and no branches are available to choose from."
        );

        return;
      }

      const branchNames =
        branches
          .map(
            (branch) =>
              branch.name
          )
          .join(", ");

      const branchName =
        window.prompt(
          `This sale has no branch assigned. Enter the return branch name: ${branchNames}`
        );

      if (
        !branchName ||
        !branchName.trim()
      ) {
        return;
      }

      const selectedBranch =
        branches.find(
          (branch) =>
            branch.name.toLowerCase() ===
            branchName
              .trim()
              .toLowerCase()
        );

      if (!selectedBranch) {
        alert(
          "Branch not found. Please enter one of the listed branch names."
        );

        return;
      }

      returnData.branch =
        selectedBranch._id;
    }

    try {
      await api.post(
        `/sales/${sale._id}/return`,
        returnData
      );

      alert(
        "Sale returned successfully"
      );

      fetchSales(
        period
      );
    } catch (
      error
    ) {
      console.log(
        error
      );

      alert(
        error?.response?.data
          ?.message ||
          "Failed to return sale"
      );
    }
  }

  // =========================
  // PURGE SALE
  // =========================
  async function purgeSale(
    id
  ) {
    if (!isManager)
      return;

    const confirmed =
      window.confirm(
        "Permanently purge this sale?"
      );

    if (!confirmed)
      return;

    try {
      await api.delete(
        `/sales/${id}/purge`
      );

      alert(
        "Sale permanently purged"
      );

      fetchSales(
        period
      );
    } catch (
      error
    ) {
      console.log(
        error
      );

      alert(
        error?.response?.data
          ?.message ||
          "Failed to purge sale"
      );
    }
  }

  const filteredSales =
    useMemo(() => {
      const keyword =
        search.toLowerCase();

      return sales.filter(
        (sale) =>
          sale.customerName
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          sale.customerPhone
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          sale.receiptNumber
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          sale.branch?.name
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          getSaleBranchName(
            sale
          )
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          sale.status
            ?.toLowerCase()
            .includes(
              keyword
            )
      );
    }, [
      sales,
      search,
    ]);

  function getSaleBranch(
    sale
  ) {
    return (
      sale.branch ||
      sale.items?.find(
        (item) =>
          item.branch
      )?.branch ||
      sale.soldBy?.branch ||
      null
    );
  }

  function getSaleBranchName(
    sale
  ) {
    return (
      getSaleBranch(
        sale
      )?.name ||
      "Branch not assigned"
    );
  }

  function formatCurrency(
    value
  ) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  const totalRevenue =
    filteredSales.reduce(
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
    filteredSales.reduce(
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

  const totalPhonesSold =
    filteredSales.reduce(
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

  function exportToExcel() {
    const exportData =
      filteredSales.map(
        (sale) => ({
          ReceiptNumber:
            sale.receiptNumber,

          Status:
            sale.status,

          Customer:
            sale.customerName,

          Contact:
            sale.customerPhone,

          Branch:
            getSaleBranchName(
              sale
            ),

          PhonesSold:
            sale.items?.length,

          Revenue:
            sale.totalAmount,

          ...(isManager && {
            Profit:
              sale.totalProfit,
          }),
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Sales History"
    );

    const excelBuffer =
      XLSX.write(
        workbook,
        {
          bookType:
            "xlsx",
          type:
            "array",
        }
      );

    saveAs(
      new Blob([
        excelBuffer,
      ]),
      "Sales_History.xlsx"
    );
  }
    if (loading) {
    return (
      <div className="p-6">
        Loading sales...
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-gray-50
        p-4
        md:p-6
        space-y-6
      "
    >
      {/* ===================== */}
      {/* PRINT HEADER */}
      {/* ===================== */}
      <div
        className="
          hidden
          print:block
          mb-8
        "
      >
        <h1
          className="
            text-3xl
            font-bold
          "
        >
          Sales History
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
          {new Date().toLocaleString()}
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
            Sales History
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              mt-1
            "
          >
            Sales records,
            revenue tracking
            and transaction
            management
          </p>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-3
          "
        >
          <button
            onClick={
              handlePrint
            }
            className="
              px-4
              py-2
              rounded-lg
              bg-black
              text-white
              text-sm
              font-semibold
            "
          >
            Print
          </button>

          <button
            onClick={
              exportToExcel
            }
            className="
              px-4
              py-2
              rounded-lg
              bg-green-600
              text-white
              text-sm
              font-semibold
            "
          >
            Export Excel
          </button>

          <Link
            to="/sales-terminal"
            className="
              px-4
              py-2
              rounded-lg
              bg-[#6b0f1a]
              text-white
              text-sm
              font-semibold
            "
          >
            Sales Terminal
          </Link>
        </div>
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

            <input
              type="date"
              value={
                endDate
              }
              onChange={(
                e
              ) =>
                setEndDate(
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
            Refresh Sales
          </button>
        )}
      </div>

      {/* ===================== */}
      {/* KPI RIBBON */}
      {/* ===================== */}
      <div
        className={`
          grid
          gap-3
          ${
            isManager
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-2 lg:grid-cols-3"
          }
        `}
      >
        <KPI
          title="Transactions"
          value={
            filteredSales.length
          }
        />

        <KPI
          title="Phones Sold"
          value={
            totalPhonesSold
          }
        />

        <KPI
          title="Revenue"
          value={`UGX ${formatCurrency(
            totalRevenue
          )}`}
          color="text-green-600"
        />

        {isManager && (
          <KPI
            title="Profit"
            value={`UGX ${formatCurrency(
              totalProfit
            )}`}
            color="text-blue-600"
          />
        )}
      </div>
            {/* ===================== */}
      {/* SEARCH */}
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
        <input
          type="text"
          placeholder="
            Search receipt,
            customer,
            contact,
            branch or status...
          "
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="
            w-full
            border
            rounded-xl
            p-4
          "
        />
      </div>

      {/* ===================== */}
      {/* SALES RECORDS */}
      {/* ===================== */}
      <div
        className="
          bg-white
          rounded-xl
          border
          shadow-sm
        "
      >
        <div
          className="
            p-4
            border-b
          "
        >
          <h2
            className="
              text-lg
              font-bold
            "
          >
            Sales Records
          </h2>

          <p
            className="
              text-sm
              text-gray-500
              mt-1
            "
          >
            Showing
            {" "}
            {
              filteredSales.length
            }
            {" "}
            transaction(s)
          </p>
        </div>

        {filteredSales.length ===
        0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              No sales found.
            </p>
          </div>
        ) : (
          <>
            {/* ===================== */}
            {/* DESKTOP TABLE */}
            {/* ===================== */}
            <div
              className="
                hidden
                lg:block
                overflow-x-auto
              "
            >
              <table className="w-full">
                <thead
                  className="
                    bg-gray-100
                  "
                >
                  <tr>
                    <th className="p-4 text-left">
                      Receipt
                    </th>

                    <th className="p-4 text-left">
                      Customer
                    </th>

                    <th className="p-4 text-left">
                      Contact
                    </th>

                    <th className="p-4 text-left">
                      Branch
                    </th>

                    <th className="p-4 text-left">
                       Model
                    </th>

                    <th className="p-4 text-left">
                      Phones
                    </th>

                    <th className="p-4 text-left">
                      Revenue
                    </th>

                    {isManager && (
                      <th className="p-4 text-left">
                        Profit
                      </th>
                    )}

                    <th className="p-4 text-left">
                      Status
                    </th>

                    <th className="p-4 text-left">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map(
                    (sale) => (
                      <tr
                        key={
                          sale._id
                        }
                        className="
                          border-t
                        "
                      >
                        <td className="p-4 font-semibold">
                          {
                            sale.receiptNumber
                          }
                        </td>

                        <td className="p-4">
                          {
                            sale.customerName
                          }
                        </td>

                        <td className="p-4">
                          {sale.customerPhone ||
                            "N/A"}
                        </td>

                        <td className="p-4">
                          {getSaleBranchName(
                            sale
                          )}
                        </td>

                        <td className="p-4">
                          {sale.items
                            ?.slice(0, 2)
                            .map(
                              (item) =>
                                `${item.brand} ${item.model}`
                            )
                            .join(", ")}

                          {sale.items?.length >
                            2 &&
                            ` +${
                              sale.items.length -
                              2
                            } more`}
                        </td>

                        <td className="p-4">
                          {sale.items
                            ?.length || 0}
                        </td>

                        <td
                          className="
                            p-4
                            font-bold
                            text-green-600
                          "
                        >
                          UGX{" "}
                          {formatCurrency(
                            sale.totalAmount
                          )}
                        </td>

                        {isManager && (
                          <td
                            className="
                              p-4
                              font-bold
                              text-blue-600
                            "
                          >
                            UGX{" "}
                            {formatCurrency(
                              sale.totalProfit
                            )}
                          </td>
                        )}

                        <td className="p-4">
                          {sale.status ===
                          "Returned" ? (
                            <span
                              className="
                                bg-red-100
                                text-red-700
                                px-3
                                py-1
                                rounded-full
                                text-sm
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
                                text-sm
                                font-semibold
                              "
                            >
                              Completed
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <div
                            className="
                              flex
                              flex-wrap
                              gap-2
                            "
                          >
                            <Link
                              to={`/receipt/${sale._id}`}
                              className="
                                bg-black
                                text-white
                                px-3
                                py-2
                                rounded-lg
                                text-sm
                              "
                            >
                              A4
                            </Link>

                            <Link
                              to={`/thermal-receipt/${sale._id}`}
                              className="
                                bg-green-600
                                text-white
                                px-3
                                py-2
                                rounded-lg
                                text-sm
                              "
                            >
                              Thermal
                            </Link>

                            {isManager &&
                              sale.status !==
                                "Returned" && (
                                <>
                                  <button
                                    onClick={() =>
                                      returnSale(
                                        sale
                                      )
                                    }
                                    className="
                                      bg-blue-600
                                      text-white
                                      px-3
                                      py-2
                                      rounded-lg
                                      text-sm
                                    "
                                  >
                                    Return
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteSale(
                                        sale._id
                                      )
                                    }
                                    className="
                                      bg-orange-600
                                      text-white
                                      px-3
                                      py-2
                                      rounded-lg
                                      text-sm
                                    "
                                  >
                                    Delete
                                  </button>
                                </>
                              )}

                            {isManager && (
                              <button
                                onClick={() =>
                                  purgeSale(
                                    sale._id
                                  )
                                }
                                className="
                                  bg-red-700
                                  text-white
                                  px-3
                                  py-2
                                  rounded-lg
                                  text-sm
                                "
                              >
                                Purge
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* ===================== */}
            {/* MOBILE CARDS */}
            {/* ===================== */}
            <div
              className="
                lg:hidden
                p-4
                space-y-4
              "
            >
              {filteredSales.map(
                (sale) => (
                  <div
                    key={
                      sale._id
                    }
                    className="
                      border
                      rounded-xl
                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        justify-between
                        items-start
                        gap-2
                      "
                    >
                      <div>
                        <h3 className="font-bold">
                          {
                            sale.receiptNumber
                          }
                        </h3>

                        <p className="text-sm text-gray-500">
                          {
                            sale.customerName
                          }
                        </p>
                      </div>

                      {sale.status ===
                      "Returned" ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                          Returned
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-sm">
                      <div>
                        Contact:
                        {" "}
                        {sale.customerPhone ||
                          "N/A"}
                      </div>

                      <div>
                        Branch:
                        {" "}
                        {getSaleBranchName(
                          sale
                        )}
                      </div>

                      <div>
                        <span className="font-medium">
                          Models:
                        </span>

                        <div className="mt-1">
                          {sale.items
                            ?.slice(0, 2)
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <div
                                  key={index}
                                >
                                  {item.brand}
                                  {" "}
                                  {item.model}
                                </div>
                              )
                            )}

                          {sale.items?.length >
                            2 && (
                            <div className="text-gray-500">
                              +
                              {
                                sale.items
                                  .length -
                                  2
                              }
                              {" "}
                              more
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        Phones:
                        {" "}
                        {sale.items
                          ?.length || 0}
                      </div>

                      <div className="font-semibold text-green-600">
                        Revenue:
                        {" "}
                        UGX{" "}
                        {formatCurrency(
                          sale.totalAmount
                        )}
                      </div>

                      {isManager && (
                        <div className="font-semibold text-blue-600">
                          Profit:
                          {" "}
                          UGX{" "}
                          {formatCurrency(
                            sale.totalProfit
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className="
                        mt-4
                        flex
                        flex-wrap
                        gap-2
                      "
                    >
                      <Link
                        to={`/receipt/${sale._id}`}
                        className="
                          bg-black
                          text-white
                          px-3
                          py-2
                          rounded-lg
                          text-sm
                        "
                      >
                        A4
                      </Link>

                      <Link
                        to={`/thermal-receipt/${sale._id}`}
                        className="
                          bg-green-600
                          text-white
                          px-3
                          py-2
                          rounded-lg
                          text-sm
                        "
                      >
                        Thermal
                      </Link>
                                            {isManager &&
                        sale.status !==
                          "Returned" && (
                          <>
                            <button
                              onClick={() =>
                                returnSale(
                                  sale
                                )
                              }
                              className="
                                bg-blue-600
                                text-white
                                px-3
                                py-2
                                rounded-lg
                                text-sm
                              "
                            >
                              Return
                            </button>

                            <button
                              onClick={() =>
                                deleteSale(
                                  sale._id
                                )
                              }
                              className="
                                bg-orange-600
                                text-white
                                px-3
                                py-2
                                rounded-lg
                                text-sm
                              "
                            >
                              Delete
                            </button>
                          </>
                        )}

                      {isManager && (
                        <button
                          onClick={() =>
                            purgeSale(
                              sale._id
                            )
                          }
                          className="
                            bg-red-700
                            text-white
                            px-3
                            py-2
                            rounded-lg
                            text-sm
                          "
                        >
                          Purge
                        </button>
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
          mt-10
          text-center
          text-sm
          text-gray-500
        "
      >
        End of Sales History Report
      </div>
    </div>
  );
}

export default SalesHistory;
