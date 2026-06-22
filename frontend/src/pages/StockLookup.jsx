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
  color = "text-gray-900",
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

function StockLookup() {
  const [phones, setPhones] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    selectedVariant,
    setSelectedVariant,
  ] = useState(null);

  // =========================
  // FETCH PHONES
  // =========================
  async function fetchPhones() {
    try {
      const res =
        await api.get(
          "/phones"
        );

      setPhones(
        res.data
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPhones();
  }, []);

  // =========================
  // GROUP STOCK
  // =========================
  const groupedStock =
    useMemo(() => {
      const grouped = {};

      phones.forEach(
        (phone) => {
          const key =
            `${phone.brand}||${phone.model}||${phone.storage}||${phone.ram}`;

          const branch =
            phone.branch
              ?.name ||
            "Unknown";

          if (
            !grouped[key]
          ) {
            grouped[key] = {
  brand: phone.brand,
  model: phone.model,
  storage: phone.storage,
  ram: phone.ram,

  buyingPrice:
    phone.buyingPrice || 0,

  sellingPrice:
    phone.sellingPrice || 0,

  total: 0,

  branches: {},

  colors: {},

  branchColors: {},
};
          }

          grouped[
            key
          ].total += 1;

          grouped[
            key
          ].branches[
            branch
          ] =
            (grouped[
              key
            ].branches[
              branch
            ] || 0) + 1;

          grouped[
            key
          ].colors[
            phone.color
          ] =
            (grouped[
              key
            ].colors[
              phone.color
            ] || 0) + 1;
          if (
  !grouped[key]
    .branchColors[
      branch
    ]
) {
  grouped[key]
    .branchColors[
      branch
    ] = {};
}

grouped[key]
  .branchColors[
    branch
  ][phone.color] =
  (
    grouped[key]
      .branchColors[
        branch
      ][phone.color] || 0
  ) + 1;  

        }
      );

      return grouped;
    }, [phones]);

  // =========================
  // SEARCH RESULTS
  // =========================
  const results =
    Object.values(
      groupedStock
    )
      .filter(
        (item) => {
          const query =
            search.toLowerCase();

          return (
            item.brand
              ?.toLowerCase()
              .includes(
                query
              ) ||
            item.model
              ?.toLowerCase()
              .includes(
                query
              )
          );
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          a.total -
          b.total
      );

  // =========================
  // AUTO SELECT
  // =========================
  useEffect(() => {
    if (
      results.length >
        0 &&
      !selectedVariant
    ) {
      setSelectedVariant(
        results[0]
      );
    }
  }, [
    results,
    selectedVariant,
  ]);

  // =========================
  // KPI DATA
  // =========================
  const totalUnits =
    results.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.total,
      0
    );

  const branchSet =
    new Set();

  results.forEach(
    (item) => {
      Object.keys(
        item.branches
      ).forEach(
        (branch) =>
          branchSet.add(
            branch
          )
      );
    }
  );

  const lowStockCount =
    results.filter(
      (item) =>
        item.total <= 2
    ).length;
      // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-6">
        Loading stock lookup...
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-white
        p-3
        md:p-5
        space-y-4
      "
    >
      {/* HEADER */}
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
        <h1
          className="
            text-3xl
            md:text-4xl
            font-black
            text-orange-700
          "
        >
          Stock Lookup
        </h1>

        <p
          className="
            text-sm
            text-gray-500
            mt-1
          "
        >
          Quickly view stock levels
          across all branches.
        </p>
      </div>

      {/* KPI CARDS */}
      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-4
          gap-3
        "
      >
        <KPI
          title="Variants"
          value={
            results.length
          }
          color="text-orange-700"
        />

        <KPI
          title="Units"
          value={
            totalUnits
          }
          color="text-green-600"
        />

        <KPI
          title="Branches"
          value={
            branchSet.size
          }
          color="text-blue-600"
        />

        <KPI
          title="Low Stock"
          value={
            lowStockCount
          }
          color="text-red-600"
        />
      </div>

      {/* VARIANT SELECTOR */}
      <div
        className="
          bg-white
          rounded-2xl
          border
          border-orange-100
          shadow-sm
          p-4
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
            Phone Variants
          </h2>

          <span
            className="
              text-xs
              text-gray-500
            "
          >
            Tap a variant
          </span>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          {results.map(
            (
              item,
              index
            ) => {
              const lowStock =
                item.total <= 2;

              const isSelected =
                selectedVariant
                  ?.brand ===
                  item.brand &&
                selectedVariant
                  ?.model ===
                  item.model &&
                selectedVariant
                  ?.storage ===
                  item.storage &&
                selectedVariant
                  ?.ram ===
                  item.ram;

              return (
                <button
                  key={index}
                  onClick={() =>
                    setSelectedVariant(
                      item
                    )
                  }
                  className={`
                    px-4
                    py-2
                    rounded-full
                    text-sm
                    font-bold
                    transition-all
                    duration-200

                    ${
                      isSelected
                        ? "bg-orange-600 text-white shadow-md"
                        : lowStock
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-gray-100 text-gray-700 hover:bg-orange-50"
                    }
                  `}
                >
                  {item.brand}
                  {" "}
                  {item.model}
                  {" "}
                  {item.storage}
                  /
                  {item.ram}
                  {" • "}
                  {item.total}

                  {lowStock &&
                    " ⚠"}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div
        className="
          bg-white
          rounded-2xl
          border
          border-orange-100
          shadow-sm
          p-4
        "
      >
        <input
          type="text"
          placeholder="Search model..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="
            w-full
            border
            border-orange-200
            rounded-xl
            p-3
            focus:outline-none
            focus:ring-2
            focus:ring-orange-500
          "
        />
      </div>
            {/* SELECTED VARIANT */}
      {selectedVariant ? (
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
          {/* TITLE */}
          <div
            className="
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-3
              mb-5
            "
          >
            <div>
              <h2
                className="
                  text-2xl
                  md:text-3xl
                  font-black
                  text-orange-700
                "
              >
                {selectedVariant.brand}
                {" "}
                {selectedVariant.model}
              </h2>

              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                {selectedVariant.storage}
                {" • "}
                {selectedVariant.ram}
              </p>
            </div>

            <div
              className={`
                px-4
                py-2
                rounded-xl
                font-bold

                ${
                  selectedVariant.total <= 2
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }
              `}
            >
              Total Stock:
              {" "}
              {selectedVariant.total}
            </div>
          </div>

          {/* SUMMARY KPIs */}
          <div
            className="
              grid
              grid-cols-2
              lg:grid-cols-5
              gap-3
              mb-6
            "
          >
            <KPI
              title="Total Stock"
              value={
                selectedVariant.total
              }
              color="text-orange-700"
            />

            <KPI
              title="Branches"
              value={
                Object.keys(
                  selectedVariant.branches
                ).length
              }
              color="text-blue-600"
            />

            <KPI
              title="Buying Price"
              value={
                Number(
                  selectedVariant.buyingPrice
                ).toLocaleString()
              }
              color="text-gray-700"
            />

            <KPI
              title="Selling Price"
              value={
                Number(
                  selectedVariant.sellingPrice
                ).toLocaleString()
              }
              color="text-green-700"
            />

            <KPI
              title="Potential Value"
              value={
                (
                  selectedVariant.sellingPrice *
                  selectedVariant.total
                ).toLocaleString()
              }
              color="text-purple-700"
            />
          </div>

          {/* COLOR BREAKDOWN */}
          <div
            className="
              bg-gray-50
              rounded-2xl
              p-4
              border
              border-gray-200
              mb-6
            "
          >
            <h3
              className="
                text-lg
                font-black
                text-orange-700
                mb-4
              "
            >
              Color Breakdown
            </h3>

            <div
              className="
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
                      Color
                    </th>

                    <th
                      className="
                        text-right
                        py-3
                        text-xs
                        uppercase
                        tracking-wide
                      "
                    >
                      Quantity
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(
                    selectedVariant.colors
                  ).map(
                    (
                      [
                        color,
                        qty,
                      ]
                    ) => (
                      <tr
                        key={color}
                        className="
                          border-b
                          last:border-0
                        "
                      >
                        <td
                          className="
                            py-3
                            font-medium
                          "
                        >
                          {color}
                        </td>

                        <td
                          className="
                            py-3
                            text-right
                            font-bold
                            text-orange-700
                          "
                        >
                          {qty}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STOCK DISTRIBUTION */}
<div
  className="
    bg-gray-50
    rounded-2xl
    p-4
    border
    border-gray-200
    mb-6
  "
>
  <h3
    className="
      text-lg
      font-black
      text-orange-700
      mb-4
    "
  >
    Stock Distribution
  </h3>

  <div
    className="
      overflow-x-auto
    "
  >
    <table
      className="
        w-full
        min-w-[700px]
      "
    >
      <thead>
        <tr
          className="
            border-b
          "
        >
          <th
            className="
              text-left
              py-3
            "
          >
            Branch
          </th>

          {Object.keys(
            selectedVariant.colors
          ).map(
            (color) => (
              <th
                key={color}
                className="
                  text-center
                  py-3
                "
              >
                {color}
              </th>
            )
          )}

          <th
            className="
              text-right
              py-3
            "
          >
            Total
          </th>
        </tr>
      </thead>

      <tbody>
        {Object.entries(
          selectedVariant.branchColors
        ).map(
          (
            [
              branch,
              colorMap,
            ]
          ) => {
            const total =
              Object.values(
                colorMap
              ).reduce(
                (
                  sum,
                  qty
                ) =>
                  sum +
                  qty,
                0
              );

            return (
              <tr
                key={
                  branch
                }
                className="
                  border-b
                  last:border-0
                "
              >
                <td
                  className="
                    py-3
                    font-medium
                  "
                >
                  {branch}
                </td>

                {Object.keys(
                  selectedVariant.colors
                ).map(
                  (
                    color
                  ) => (
                    <td
                      key={
                        color
                      }
                      className="
                        text-center
                        font-bold
                      "
                    >
                      {colorMap[
                        color
                      ] || 0}
                    </td>
                  )
                )}

                <td
                  className="
                    text-right
                    font-bold
                    text-orange-700
                  "
                >
                  {total}
                </td>
              </tr>
            );
          }
        )}
      </tbody>
    </table>
  </div>
</div>

          {/* BRANCH BREAKDOWN */}
          <div
            className="
              bg-gray-50
              rounded-2xl
              p-4
              border
              border-gray-200
            "
          >
            <h3
              className="
                text-lg
                font-black
                text-orange-700
                mb-4
              "
            >
              Branch Breakdown
            </h3>

            <div
              className="
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
                      Branch
                    </th>

                    <th
                      className="
                        text-right
                        py-3
                        text-xs
                        uppercase
                        tracking-wide
                      "
                    >
                      Quantity
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(
                    selectedVariant.branches
                  ).map(
                    (
                      [
                        branch,
                        qty,
                      ]
                    ) => (
                      <tr
                        key={branch}
                        className="
                          border-b
                          border-orange-50
                          last:border-0
                        "
                      >
                        <td
                          className="
                            py-3
                            font-medium
                          "
                        >
                          {branch}
                        </td>

                        <td
                          className="
                            py-3
                            text-right
                            font-bold
                            text-orange-700
                          "
                        >
                          {qty}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-orange-100
            p-8
            text-center
            text-gray-500
          "
        >
          No matching stock found.
        </div>
      )}
    </div>
  );
}

export default StockLookup;