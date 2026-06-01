import {
  useEffect,
  useMemo,
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

function TransferHistory() {
  const [transfers, setTransfers] =
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
  // FETCH TRANSFERS
  // =========================
  async function fetchTransfers(
    selectedPeriod =
      period
  ) {
    try {
      setLoading(true);

      let url =
        "/transfers";

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
          `/transfers?startDate=${date}&endDate=${date}`;
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
          `/transfers?startDate=${start}&endDate=${end}`;
      } else if (
        selectedPeriod ===
          "custom" &&
        startDate &&
        endDate
      ) {
        url =
          `/transfers?startDate=${startDate}&endDate=${endDate}`;
      }

      const response =
        await api.get(
          url
        );

      setTransfers(
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
    fetchTransfers(
      "month"
    );
  }, []);

  function handleApplyFilter() {
    fetchTransfers(
      period
    );
  }

  function handlePrint() {
    window.print();
  }

  // =========================
  // DELETE TRANSFER
  // =========================
  async function deleteTransfer(
    id
  ) {
    const confirmDelete =
      window.confirm(
        "Delete this transfer history?"
      );

    if (
      !confirmDelete
    ) {
      return;
    }

    try {
      await api.delete(
        `/transfers/${id}`
      );

      fetchTransfers(
        period
      );
    } catch (
      error
    ) {
      console.log(
        error
      );

      alert(
        "Failed to delete transfer"
      );
    }
  }

  // =========================
  // FILTER
  // =========================
  const filteredTransfers =
    useMemo(() => {
      const keyword =
        search.toLowerCase();

      return transfers.filter(
        (
          transfer
        ) =>
          transfer.brand
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          transfer.model
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          transfer.imei
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          transfer
            .fromBranch
            ?.name
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          transfer
            .toBranch
            ?.name
            ?.toLowerCase()
            .includes(
              keyword
            )
      );
    }, [
      transfers,
      search,
    ]);

  const totalTransfers =
    filteredTransfers.length;

  const totalDevices =
    filteredTransfers.length;

  const uniqueBranches =
    new Set(
      filteredTransfers.flatMap(
        (
          transfer
        ) => [
          transfer
            .fromBranch
            ?.name,
          transfer
            .toBranch
            ?.name,
        ]
      )
    ).size;
      if (loading) {
    return (
      <div className="p-6">
        Loading transfers...
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
          Transfer History
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
            Transfer History
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              mt-1
            "
          >
            Track device
            movements between
            branches
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
            bg-black
            text-white
            text-sm
            font-semibold
          "
        >
          Print
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
              onChange={(e) =>
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
              onChange={(e) =>
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
            Refresh Transfers
          </button>
        )}
      </div>

      {/* ===================== */}
      {/* KPI RIBBON */}
      {/* ===================== */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-3
        "
      >
        <KPI
          title="Transfers"
          value={
            totalTransfers
          }
          color="text-blue-600"
        />

        <KPI
          title="Devices"
          value={
            totalDevices
          }
          color="text-green-600"
        />

        <KPI
          title="Branches"
          value={
            uniqueBranches
          }
          color="text-purple-600"
        />
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
            Search phone,
            model,
            IMEI or branch...
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
      {/* TRANSFER RECORDS */}
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
            Transfer Records
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
              filteredTransfers.length
            }
            {" "}
            transfer(s)
          </p>
        </div>

        {filteredTransfers.length ===
        0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              No transfers found.
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
                      Phone
                    </th>

                    <th className="p-4 text-left">
                      IMEI
                    </th>

                    <th className="p-4 text-left">
                      From
                    </th>

                    <th className="p-4 text-left">
                      To
                    </th>

                    <th className="p-4 text-left">
                      Transferred By
                    </th>

                    <th className="p-4 text-left">
                      Date
                    </th>

                    <th className="p-4 text-left">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransfers.map(
                    (
                      transfer
                    ) => (
                      <tr
                        key={
                          transfer._id
                        }
                        className="
                          border-t
                        "
                      >
                        <td className="p-4 font-semibold">
                          {
                            transfer.brand
                          }
                          {" "}
                          {
                            transfer.model
                          }
                        </td>

                        <td className="p-4">
                          {
                            transfer.imei
                          }
                        </td>

                        <td className="p-4">
                          {
                            transfer
                              .fromBranch
                              ?.name
                          }
                        </td>

                        <td className="p-4">
                          {
                            transfer
                              .toBranch
                              ?.name
                          }
                        </td>

                        <td className="p-4">
                          {
                            transfer
                              .transferredBy
                              ?.username
                          }
                        </td>

                        <td className="p-4">
                          {new Date(
                            transfer.createdAt
                          ).toLocaleString()}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() =>
                              deleteTransfer(
                                transfer._id
                              )
                            }
                            className="
                              bg-red-600
                              hover:bg-red-700
                              text-white
                              px-4
                              py-2
                              rounded-lg
                              text-sm
                            "
                          >
                            Delete
                          </button>
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
              {filteredTransfers.map(
                (
                  transfer
                ) => (
                  <div
                    key={
                      transfer._id
                    }
                    className="
                      border
                      rounded-xl
                      p-4
                    "
                  >
                    <div>
                      <h3 className="font-bold text-lg">
                        {
                          transfer.brand
                        }
                        {" "}
                        {
                          transfer.model
                        }
                      </h3>

                      <p
                        className="
                          text-xs
                          text-gray-500
                          break-all
                          mt-1
                        "
                      >
                        {
                          transfer.imei
                        }
                      </p>
                    </div>

                    <div
                      className="
                        mt-4
                        space-y-2
                        text-sm
                      "
                    >
                      <div>
                        <span className="font-semibold">
                          From:
                        </span>
                        {" "}
                        {
                          transfer
                            .fromBranch
                            ?.name
                        }
                      </div>

                      <div>
                        <span className="font-semibold">
                          To:
                        </span>
                        {" "}
                        {
                          transfer
                            .toBranch
                            ?.name
                        }
                      </div>

                      <div>
                        <span className="font-semibold">
                          By:
                        </span>
                        {" "}
                        {
                          transfer
                            .transferredBy
                            ?.username
                        }
                      </div>

                      <div className="text-gray-500">
                        {new Date(
                          transfer.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>

                    <div
                      className="
                        mt-4
                        flex
                        flex-wrap
                        gap-2
                      "
                    >
                      <button
                        onClick={() =>
                          deleteTransfer(
                            transfer._id
                          )
                        }
                        className="
                          bg-red-600
                          hover:bg-red-700
                          text-white
                          px-4
                          py-2
                          rounded-lg
                          text-sm
                        "
                      >
                        Delete
                      </button>
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
        End of Transfer History Report
      </div>
    </div>
  );
}

export default TransferHistory;