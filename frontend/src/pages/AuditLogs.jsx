// AuditLogs.jsx V2.1
// PART 1 OF 3

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

// =========================
// ACTION BADGE COLORS
// =========================
const getActionStyle =
  (action = "") => {
    const value =
      action.toLowerCase();

    if (
      value.includes(
        "sale"
      )
    ) {
      return `
        bg-green-100
        text-green-700
      `;
    }

    if (
      value.includes(
        "return"
      )
    ) {
      return `
        bg-red-100
        text-red-700
      `;
    }

    if (
      value.includes(
        "transfer"
      )
    ) {
      return `
        bg-purple-100
        text-purple-700
      `;
    }

    if (
      value.includes(
        "delete"
      )
    ) {
      return `
        bg-red-100
        text-red-700
      `;
    }

    if (
      value.includes(
        "update"
      )
    ) {
      return `
        bg-amber-100
        text-amber-700
      `;
    }

    if (
      value.includes(
        "add_phone"
      )
    ) {
      return `
        bg-blue-100
        text-blue-700
      `;
    }

    return `
      bg-blue-100
      text-blue-700
    `;
  };

// =========================
// KAMPALA DATE HELPERS
// =========================
const KAMPALA_TIMEZONE =
  "Africa/Kampala";

const formatDate =
  (date) =>
    new Date(
      date
    ).toLocaleString(
      "en-UG",
      {
        timeZone:
          KAMPALA_TIMEZONE,

        year:
          "numeric",

        month:
          "short",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hour12: true,
      }
    );

const getKampalaDateKey =
  (date) =>
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          KAMPALA_TIMEZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).format(
      new Date(date)
    );

// =========================
// TRANSFER GROUPING HELPERS
// =========================
const getItemListForGrouping = (log) => {
  const details = log?.itemDetails;
  if (!details) return [];
  if (Array.isArray(details)) return details;
  if (Array.isArray(details.items)) return details.items;
  if (details.brand || details.model || details.imei) return [details];
  return [];
};

const getTransferModelKey = (log) => {
  const firstItem = getItemListForGrouping(log)[0];
  const key = [
    firstItem?.brand,
    firstItem?.model,
    firstItem?.ram,
    firstItem?.storage,
  ].filter(Boolean).join('|');

  return key || log?.itemName || log?.entityId || 'transfer';
};

const groupTransferLogs = (input = []) => {
  const result = [];
  const transferGroups = new Map();

  input.forEach((log) => {
    if (String(log?.action || '').toUpperCase() !== 'TRANSFER') {
      result.push(log);
      return;
    }

    const source = String(log.sourceBranch?._id || log.sourceBranch || '');
    const destination = String(log.destinationBranch?._id || log.destinationBranch || '');
    const actor = String(log.user?._id || log.user || '');
    const modelKey = getTransferModelKey(log);
    const timestamp = new Date(log.createdAt).getTime();
    const bucket = Number.isFinite(timestamp)
      ? Math.floor(timestamp / (5 * 60 * 1000))
      : String(log._id || '');
    const key = `${source}|${destination}|${actor}|${modelKey}|${bucket}`;
    const items = getItemListForGrouping(log);

    if (!transferGroups.has(key)) {
      const grouped = {
        ...log,
        itemDetails: {
          ...(log.itemDetails && !Array.isArray(log.itemDetails) ? log.itemDetails : {}),
          items: [...items],
          quantity: items.length || Number(log.itemDetails?.quantity || 1),
        },
      };
      transferGroups.set(key, grouped);
      result.push(grouped);
      return;
    }

    const group = transferGroups.get(key);
    const existingItems = Array.isArray(group.itemDetails?.items)
      ? group.itemDetails.items
      : [];

    group.itemDetails.items = [...existingItems, ...items];
    group.itemDetails.quantity = group.itemDetails.items.length || 1;

    if (new Date(log.createdAt) > new Date(group.createdAt)) {
      group.createdAt = log.createdAt;
    }
  });

  return result;
};

function AuditLogs() {
  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    actionFilter,
    setActionFilter,
  ] = useState("all");

  const [
    periodFilter,
    setPeriodFilter,
  ] = useState("30days");

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("all");

  const [
    clearingLogs,
    setClearingLogs,
  ] = useState(false);

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  useEffect(() => {
    fetchLogs();
  }, []);

  // =========================
  // FETCH LOGS
  // =========================
  const fetchLogs =
    async () => {
      try {
        const response =
          await api.get(
            "/audits"
          );

        setLogs(
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

  // =========================
  // EXPORT CSV
  // =========================
  const exportCSV =
    () => {
      const rows =
        filteredLogs.map(
          (log) => ({
            Date:
              formatDate(
                log.createdAt
              ),

            User:
              log.user
                ?.username ||
              "-",

            Branch:
              log.branch
                ?.name ||
              "-",

            Action:
              log.action,

            Entity:
              log.entityType,

            Description:
              getAuditDescription(log),
            "Phone / Serial Details":
              getItemList(log).map((item) => `${formatPhoneSpec(item)} ${item?.imei || ""}`.trim()).join(" | "),
          })
        );

      const headers =
        Object.keys(
          rows[0] || {}
        );

      if (
        !headers.length
      ) {
        alert(
          "No logs available for export."
        );
        return;
      }

      const csv =
        [
          headers.join(
            ","
          ),

          ...rows.map(
            (row) =>
              headers
                .map(
                  (
                    header
                  ) =>
                    `"${String(
                      row[
                        header
                      ] || ""
                    ).replaceAll(
                      '"',
                      '""'
                    )}"`
                )
                .join(",")
          ),
        ].join("\n");

      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        URL.createObjectURL(
          blob
        );

      link.download =
        `audit_logs_${
          new Date()
            .toISOString()
            .split(
              "T"
            )[0]
        }.csv`;

      link.click();
    };

  // =========================
  // CLEAR LOGS
  // =========================
  const clearLogs =
    async (
      period
    ) => {
      const confirmed =
        window.confirm(
          period ===
            "all"
            ? "Delete ALL audit logs permanently?"
            : `Delete logs older than ${period}?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setClearingLogs(
          true
        );

        const response =
          await api.post(
            "/audits/clear",
            {
              period,
            }
          );

        alert(
          `${
            response
              .data
              ?.deletedCount ||
            0
          } audit logs removed successfully.`
        );

        await fetchLogs();
      } catch (
        error
      ) {
        console.log(
          error
        );

        alert(
          "Failed to clear audit logs"
        );
      } finally {
        setClearingLogs(
          false
        );
      }
    };

  // =========================
  // UNIQUE BRANCHES
  // =========================
  const branches =
    useMemo(() => {
      const names = logs
        .flatMap((log) => [
          log.branch?.name,
          log.sourceBranch?.name,
          log.destinationBranch?.name,
        ])
        .filter(Boolean);

      return [
        ...new Set(
          names
        ),
      ].sort();
    }, [logs]);

  // =========================
  // FILTERED LOGS
  // =========================
  const filteredLogs =
    useMemo(() => {
      let filtered =
        [...logs];

      if (
        periodFilter !==
        "all"
      ) {
        const now =
          new Date();

        filtered =
          filtered.filter(
            (log) => {
              const logDate =
                new Date(
                  log.createdAt
                );

              if (
                periodFilter ===
                "today"
              ) {
                return (
                  getKampalaDateKey(
                    logDate
                  ) ===
                  getKampalaDateKey(
                    now
                  )
                );
              }

              if (
                periodFilter ===
                "7days"
              ) {
                const sevenDaysAgo =
                  new Date();

                sevenDaysAgo.setDate(
                  now.getDate() -
                    7
                );

                return (
                  logDate >=
                  sevenDaysAgo
                );
              }
              if (
                periodFilter ===
                "30days"
              ) {
                const thirtyDaysAgo =
                  new Date();

                thirtyDaysAgo.setDate(
                  now.getDate() -
                    30
                );

                return (
                  logDate >=
                  thirtyDaysAgo
                );
              }

              return true;
            }
          );
      }

      // =====================
      // ACTION FILTER
      // =====================
      if (
        actionFilter !==
        "all"
      ) {
        filtered =
          filtered.filter(
            (log) => {
              const action =
                String(
                  log.action || ""
                ).toUpperCase();

              switch (
                actionFilter
              ) {
                case "sale":
                  return [
                    "SALE",
                    "CREATE_SALE",
                  ].includes(
                    action
                  );

                case "return":
                  return action ===
                    "RETURN_SALE";

                case "transfer":
                  return action ===
                    "TRANSFER";

                case "add_phone":
                  return action ===
                    "ADD_PHONE";

                case "update":
                  return [
                    "UPDATE_PHONE",
                    "UPDATE",
                    "EDIT_PHONE",
                  ].includes(
                    action
                  );

                case "delete":
                  return [
                    "DELETE_PHONE",
                    "DELETE_SALE",
                    "DELETE",
                  ].includes(
                    action
                  );

                default:
                  return true;
              }
            }
          );
      }

      // =====================
      // BRANCH FILTER
      // =====================
      if (
        branchFilter !==
        "all"
      ) {
        filtered =
          filtered.filter(
            (log) =>
              log.branch
                ?.name ===
              branchFilter
          );
      }

      // =====================
      // SEARCH
      // =====================
      if (
        searchTerm.trim()
      ) {
        const query =
          searchTerm.toLowerCase();

        filtered =
          filtered.filter(
            (log) =>
              log.user?.username
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              log.branch?.name
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              log.action
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              log.entityType?.toLowerCase().includes(query) ||
              log.itemName?.toLowerCase().includes(query) ||
              log.sourceBranch?.name?.toLowerCase().includes(query) ||
              log.destinationBranch?.name?.toLowerCase().includes(query) ||
              log.description
                ?.toLowerCase()
                .includes(
                  query
                )
          );
      }

      return filtered;
    }, [
      logs,
      searchTerm,
      actionFilter,
      periodFilter,
      branchFilter,
    ]);

// =========================
// =========================
// BUSINESS-FRIENDLY AUDIT NARRATIVE
// =========================
const getItemList = (log) => {
  const details = log.itemDetails;
  if (!details) return [];
  if (Array.isArray(details)) return details;
  if (Array.isArray(details.items)) return details.items;
  if (details.brand || details.model || details.imei) return [details];
  return [];
};

const formatPhoneSpec = (item) => {
  const brandModel = [item?.brand, item?.model].filter(Boolean).join(" ");
  const memory = [item?.ram, item?.storage].filter(Boolean).join("/");
  return [brandModel, memory].filter(Boolean).join(" ");
};

const formatSerials = (items) =>
  items.map((item) => item?.imei).filter(Boolean).join(", ");

const getAuditDescription = (log) => {
  const items = getItemList(log);
  const count = items.length || Number(log.itemDetails?.quantity || 0) || 1;
  const serials = formatSerials(items);
  const specs = formatPhoneSpec(items[0]);

  if (log.action === "TRANSFER") {
    const userBranchId = user?.branch?._id || user?.branch;
    const sourceBranchId = log.sourceBranch?._id || log.sourceBranch;
    const destinationBranchId = log.destinationBranch?._id || log.destinationBranch;
    const quantityLabel = `${count} ${count === 1 ? "pc" : "pcs"}`;
    const serialLabel = serials ? ` Serial Nos: ${serials}.` : "";

    if (String(userBranchId) === String(destinationBranchId)) {
      return `You have received ${quantityLabel} of ${specs || log.itemName || log.entityType}${serialLabel} from ${log.sourceBranch?.name || "another branch"}, transferred by ${log.user?.username || "a user"}.`;
    }
    if (String(userBranchId) === String(sourceBranchId)) {
      return `You have made a transfer of ${quantityLabel} of ${specs || log.itemName || log.entityType}${serialLabel} to ${log.destinationBranch?.name || "another branch"}.`;
    }
    return `A transfer of ${quantityLabel} of ${specs || log.itemName || log.entityType}${serialLabel} was made from ${log.sourceBranch?.name || "-"} to ${log.destinationBranch?.name || "-"} by ${log.user?.username || "a user"}.`;
  }

  if (log.action === "UPDATE_PHONE") {
    const before = log.itemDetails?.before;
    const after = log.itemDetails?.after;
    return `You updated ${formatPhoneSpec(before) || log.itemName || "a phone"}${before?.imei ? ` (Serial No: ${before.imei})` : ""} to ${formatPhoneSpec(after) || "the new details"}${after?.imei ? ` (Serial No: ${after.imei})` : ""}.`;
  }

  if (log.action === "DELETE_PHONE") {
    return `You deleted ${specs || log.itemName || "a phone"}${serials ? ` (Serial No: ${serials})` : ""} from inventory.`;
  }

  if (log.action === "SALE" || log.action === "CREATE_SALE") {
    const customer = log.itemDetails?.customerName;
    return `A sale was recorded for ${count} ${count === 1 ? "phone" : "phones"}${specs ? ` — ${specs}` : ""}${serials ? ` (Serial Nos: ${serials})` : ""}${customer ? ` to ${customer}` : ""}.`;
  }

  if (log.action === "RETURN_SALE") {
    const reason = log.itemDetails?.returnReason;
    return `A sale containing ${count} ${count === 1 ? "phone" : "phones"}${specs ? ` — ${specs}` : ""}${serials ? ` (Serial Nos: ${serials})` : ""} was returned${reason ? ` because: ${reason}` : ""}.`;
  }

  if (log.action === "DELETE_SALE") {
    return `Sale ${log.itemDetails?.receiptNumber || ""} was deleted and the related inventory was restored.`;
  }

  if (log.action === "ADD_PHONE") {
    const phoneDescription =
      specs ||
      log.itemName ||
      "a phone";

    return `You added ${phoneDescription}${serials ? ` (Serial No: ${serials})` : ""} to ${log.branch?.name || "inventory"}.`;
  }

  return log.description || `${log.action || "System action"} recorded.`;
};

const getAuditDetails = (log) => {
  const items = getItemList(log);
  const serials = formatSerials(items);
  const specs = formatPhoneSpec(items[0]);
  const details = [];

  if (specs) details.push({ label: "Phone", value: specs });
  if (serials) details.push({ label: "Serial No.", value: serials });

  if (log.action === "TRANSFER") {
    details.push({ label: "From", value: log.sourceBranch?.name || "-" });
    details.push({ label: "To", value: log.destinationBranch?.name || "-" });
    details.push({ label: "Transferred by", value: log.user?.username || "-" });
  }

  if (log.itemDetails?.color) details.push({ label: "Colour", value: log.itemDetails.color });
  if (log.itemDetails?.receiptNumber) details.push({ label: "Receipt", value: log.itemDetails.receiptNumber });
  if (log.itemDetails?.paymentMethod) details.push({ label: "Payment", value: log.itemDetails.paymentMethod });
  if (log.itemDetails?.returnReason) details.push({ label: "Return reason", value: log.itemDetails.returnReason });

  return details;
};

// STATS
  // =========================
  const stats = {
    total:
      filteredLogs.length,

    returns:
      filteredLogs.filter(
        (log) =>
          log.action
            ?.toLowerCase()
            .includes(
              "return"
            )
      ).length,

    transfers:
      filteredLogs.filter(
        (log) =>
          log.action
            ?.toLowerCase()
            .includes(
              "transfer"
            )
      ).length,

    today:
      filteredLogs.filter(
        (log) =>
          getKampalaDateKey(
            log.createdAt
          ) ===
          getKampalaDateKey(
            new Date()
          )
      ).length,
  };

  const displayLogs = useMemo(
    () => groupTransferLogs(filteredLogs),
    [filteredLogs]
  );

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-6">
        Loading audit
        logs...
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
      {/* ===================== */}
      {/* HEADER */}
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
        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-3
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
              Audit Logs
            </h1>

            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              System activity
              tracking
            </p>

            <p
              className="
                text-xs
                text-gray-400
                mt-1
              "
            >
              Audit Times:
              Africa/Kampala
              (EAT)
            </p>
          </div>

          <div
  className="
    flex
    flex-wrap
    gap-2
  "
>
  <button
    onClick={
      exportCSV
    }
    className="
      px-3
      py-2
      text-sm
      rounded-lg
      bg-blue-100
      text-blue-700
      font-medium
    "
  >
    Export CSV
  </button>

  {user?.role ===
    "manager" && (
    <>
      <button
        onClick={() =>
          clearLogs(
            "30days"
          )
        }
        disabled={
          clearingLogs
        }
        className="
          px-3
          py-2
          text-sm
          rounded-lg
          bg-amber-100
          text-amber-700
          font-medium
        "
      >
        Clear 30D
      </button>

      <button
        onClick={() =>
          clearLogs(
            "90days"
          )
        }
        disabled={
          clearingLogs
        }
        className="
          px-3
          py-2
          text-sm
          rounded-lg
          bg-orange-100
          text-orange-700
          font-medium
        "
      >
        Clear 90D
      </button>

      <button
        onClick={() =>
          clearLogs(
            "1year"
          )
        }
        disabled={
          clearingLogs
        }
        className="
          px-3
          py-2
          text-sm
          rounded-lg
          bg-red-100
          text-red-700
          font-medium
        "
      >
        Clear 1Y
      </button>

      <button
        onClick={() =>
          clearLogs(
            "all"
          )
        }
        disabled={
          clearingLogs
        }
        className="
          px-3
          py-2
          text-sm
          rounded-lg
          bg-[#6b0f1a]
          text-white
          font-medium
        "
      >
        Clear All
      </button>
    </>
  )}
</div>
        </div>
      </div>

      {/* ===================== */}
      {/* STATS RIBBON */}
      {/* ===================== */}
      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-4
          gap-3
        "
      >
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
              text-gray-500
            "
          >
            Total Logs
          </p>

          <h2
            className="
              text-xl
              font-black
              mt-1
            "
          >
            {stats.total}
          </h2>
        </div>

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
              text-gray-500
            "
          >
            Today's Logs
          </p>

          <h2
            className="
              text-xl
              font-black
              mt-1
              text-blue-600
            "
          >
            {stats.today}
          </h2>
        </div>

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
              text-gray-500
            "
          >
            Returns
          </p>

          <h2
            className="
              text-xl
              font-black
              mt-1
              text-red-600
            "
          >
            {stats.returns}
          </h2>
        </div>

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
              text-gray-500
            "
          >
            Transfers
          </p>

          <h2
            className="
              text-xl
              font-black
              mt-1
              text-purple-600
            "
          >
            {stats.transfers}
          </h2>
        </div>
      </div>

      {/* ===================== */}
      {/* FILTERS */}
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
            placeholder="
              Search user,
              action,
              branch,
              entity...
            "
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
              outline-none
              focus:ring-2
              focus:ring-[#6b0f1a]
            "
          />

          <select
            value={
              actionFilter
            }
            onChange={(e) =>
              setActionFilter(
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
              All Actions
            </option>

            <option value="sale">
              Sale
            </option>

            <option value="return">
              Returns
            </option>

            <option value="transfer">
              Transfers
            </option>

            <option value="add_phone">
              Add Phone
            </option>

            <option value="update">
              Updates
            </option>

            <option value="delete">
              Deletes
            </option>
          </select>

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
        </div>
      </div>

      {/* ===================== */}
      {/* DESKTOP TABLE */}
      {/* ===================== */}
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
            <thead
              className="
                bg-gray-50
              "
            >
              <tr>
                <th className="text-left p-3 text-xs uppercase">
                  Date
                </th>

                <th className="text-left p-3 text-xs uppercase">
                  User
                </th>

                <th className="text-left p-3 text-xs uppercase">
                  Branch
                </th>

                <th className="text-left p-3 text-xs uppercase">
                  Action
                </th>

                <th className="text-left p-3 text-xs uppercase">
                  Entity
                </th>

                <th className="text-left p-3 text-xs uppercase">
                  Description
                </th>
              </tr>
            </thead>

            <tbody>
              {displayLogs.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="
                      p-8
                      text-center
                      text-gray-500
                    "
                  >
                    No audit records
                    found
                  </td>
                </tr>
              ) : (
                displayLogs.map(
                  (log) => (
                    <tr
                      key={
                        log._id
                      }
                      className="
                        border-t
                        hover:bg-gray-50
                      "
                    >
                      <td className="p-3 whitespace-nowrap text-sm">
                        {formatDate(
                          log.createdAt
                        )}
                      </td>

                      <td className="p-3 text-sm">
                        {log.user
                          ?.username ||
                          "-"}
                      </td>

                      <td className="p-3 text-sm">
                        {log.branch
                          ?.name ||
                          "-"}
                      </td>

                      <td className="p-3">
                        <span
                          className={`
                            px-2
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${getActionStyle(
                              log.action
                            )}
                          `}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="p-3 text-sm">
                        {
                          log.entityType
                        }
                      </td>

                      <td className="p-3 text-sm min-w-[420px]">
                        <div className="font-medium text-gray-900">{getAuditDescription(log)}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {getAuditDetails(log).map((detail) => (
                            <span key={`${log._id}-${detail.label}`} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-700">
                              <span className="font-semibold">{detail.label}:</span> {detail.value}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== */}
      {/* MOBILE CARDS */}
      {/* ===================== */}
      <div
        className="
          lg:hidden
          space-y-2
        "
      >
        {displayLogs.length ===
        0 ? (
          <div
            className="
              bg-white
              rounded-xl
              border
              p-6
              text-center
              text-gray-500
            "
          >
            No audit records
            found
          </div>
        ) : (
          displayLogs.map(
            (log) => (
              <div
                key={log._id}
                className="
                  bg-white
                  rounded-xl
                  border
                  p-3
                  shadow-sm
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
                    <div
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      {log.user
                        ?.username ||
                        "-"}
                    </div>

                    <div
                      className="
                        text-xs
                        text-gray-500
                        mt-1
                      "
                    >
                      {formatDate(
                        log.createdAt
                      )}
                    </div>

                    <div
                      className="
                        text-xs
                        text-gray-500
                        mt-1
                      "
                    >
                      Branch:{" "}
                      {log.branch
                        ?.name ||
                        "-"}
                    </div>
                  </div>

                  <span
                    className={`
                      px-2
                      py-1
                      rounded-full
                      text-[11px]
                      font-semibold
                      ${getActionStyle(
                        log.action
                      )}
                    `}
                  >
                    {log.action}
                  </span>
                </div>

                <div className="mt-3">
                  <div
                    className="
                      text-xs
                      uppercase
                      text-gray-500
                    "
                  >
                    Entity
                  </div>

                  <div
                    className="
                      text-sm
                      font-medium
                    "
                  >
                    {
                      log.entityType
                    }
                  </div>
                </div>

                <div className="mt-3">
                  <div
                    className="
                      text-xs
                      uppercase
                      text-gray-500
                    "
                  >
                    Description
                  </div>

                  <div className="text-sm mt-1 break-words font-medium">
                    {getAuditDescription(log)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {getAuditDetails(log).map((detail) => (
                      <span key={`${log._id}-${detail.label}`} className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-700">
                        <strong>{detail.label}:</strong> {detail.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
