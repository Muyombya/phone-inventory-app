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

```
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
```

  </div>
);

function StockLookup() {
const [phones, setPhones] =
useState([]);

const [loading, setLoading] =
useState(true);

const [search, setSearch] =
useState("");

// =========================
// FETCH PHONES
// =========================
async function fetchPhones() {
try {
const res =
await api.get(
"/phones"
);

```
  setPhones(
    res.data
  );
} catch (error) {
  console.log(error);
} finally {
  setLoading(false);
}
```

}

useEffect(() => {
fetchPhones();
}, []);

// =========================
// GROUP STOCK
// =========================
const groupedStock = {};

phones.forEach((phone) => {
const key =
`${phone.brand}||${phone.model}||${phone.storage}||${phone.ram}`;

```
const branch =
  phone.branch?.name ||
  "Unknown";

if (!groupedStock[key]) {
  groupedStock[key] = {
    brand:
      phone.brand,
    model:
      phone.model,
    storage:
      phone.storage,
    ram:
      phone.ram,
    total: 0,
    branches: {},
  };
}

groupedStock[key]
  .branches[
  branch
] =
  (groupedStock[key]
    .branches[
    branch
  ] || 0) + 1;

groupedStock[key]
  .total += 1;
```

});

// =========================
// SEARCH RESULTS
// =========================
const results =
Object.values(
groupedStock
).filter((item) => {
const query =
search.toLowerCase();

```
  return (
    item.brand
      ?.toLowerCase()
      .includes(query) ||
    item.model
      ?.toLowerCase()
      .includes(query)
  );
});
```

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

if (loading) {
return ( <div className="p-6">
Loading stock lookup... </div>
);
}

return ( <div
   className="
     min-h-screen
     bg-white
     p-3
     md:p-5
     space-y-4
   "
 >

```
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
      Search stock
      availability across
      all branches.
    </p>

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
      placeholder="Search brand or model..."
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

  {/* KPI CARDS */}
  <div
    className="
      grid
      grid-cols-2
      md:grid-cols-3
      gap-3
    "
  >

    <KPI
      title="Models Found"
      value={
        results.length
      }
      color="text-orange-700"
    />

    <KPI
      title="Total Units"
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

  </div>

  {/* RESULTS */}
  {results.length ===
  0 ? (
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
      No matching stock
      found.
    </div>
  ) : (
    results.map(
      (
        item,
        index
      ) => (
        <div
          key={index}
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
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-2
              mb-4
            "
          >

            <div>

              <h2
                className="
                  text-xl
                  font-black
                  text-orange-700
                "
              >
                {item.brand}
                {" "}
                {item.model}
              </h2>

              <p
                className="
                  text-sm
                  text-gray-500
                "
              >
                {
                  item.storage
                }
                {" • "}
                {
                  item.ram
                }
              </p>

            </div>

            <div
              className="
                bg-green-100
                text-green-700
                px-4
                py-2
                rounded-xl
                font-bold
              "
            >
              Total:
              {" "}
              {
                item.total
              }
            </div>

          </div>

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
                  item.branches
                ).map(
                  (
                    [
                      branch,
                      qty,
                    ]
                  ) => (
                    <tr
                      key={
                        branch
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
      )
    )
  )}

</div>
```

);
}

export default StockLookup;
