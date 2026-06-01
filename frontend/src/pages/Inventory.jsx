import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../services/api";

import * as XLSX from "xlsx";

import { saveAs } from "file-saver";

function Inventory() {
  const [phones, setPhones] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const LOW_STOCK_LIMIT =
    3;

  // =========================
  // CURRENT USER
  // =========================
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
    } catch (
      error
    ) {
      console.log(
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPhones();
  }, []);

  // =========================
  // DELETE PHONE
  // =========================
  async function deletePhone(
    id
  ) {
    const confirmDelete =
      window.confirm(
        "Delete this phone?"
      );

    if (
      !confirmDelete
    ) {
      return;
    }

    try {
      await api.delete(
        `/phones/${id}`
      );

      fetchPhones();
    } catch (
      error
    ) {
      console.log(
        error
      );

      alert(
        "Failed to delete phone"
      );
    }
  }

  // =========================
  // FILTER PHONES
  // =========================
  const filteredPhones =
    phones.filter(
      (phone) => {
        const query =
          search.toLowerCase();

        return (
          phone.brand
            ?.toLowerCase()
            .includes(
              query
            ) ||
          phone.model
            ?.toLowerCase()
            .includes(
              query
            ) ||
          phone.imei
            ?.toLowerCase()
            .includes(
              query
            ) ||
          phone.branch?.name
            ?.toLowerCase()
            .includes(
              query
            )
        );
      }
    );

  // =========================
  // ANALYTICS
  // =========================
  const totalBuyingValue =
    filteredPhones.reduce(
      (
        sum,
        phone
      ) =>
        sum +
        Number(
          phone.buyingPrice ||
            0
        ),
      0
    );

  const totalSellingValue =
    filteredPhones.reduce(
      (
        sum,
        phone
      ) =>
        sum +
        Number(
          phone.sellingPrice ||
            0
        ),
      0
    );

  const totalPotentialProfit =
    totalSellingValue -
    totalBuyingValue;

  // =========================
  // LOW STOCK MODELS
  // =========================
  const stockMap = {};

  filteredPhones.forEach(
    (phone) => {
      const key =
        `${phone.brand} ${phone.model}`;

      if (
        !stockMap[key]
      ) {
        stockMap[key] = {
          brand:
            phone.brand,

          model:
            phone.model,

          count: 0,
        };
      }

      stockMap[key]
        .count += 1;
    }
  );

  const lowStockModels =
    Object.values(
      stockMap
    )
      .filter(
        (
          item
        ) =>
          item.count <=
          LOW_STOCK_LIMIT
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
  // EXPORT EXCEL
  // =========================
  function exportToExcel() {
    const data =
      filteredPhones.map(
        (
          phone
        ) => ({
          Brand:
            phone.brand,

          Model:
            phone.model,

          IMEI:
            phone.imei,

          Branch:
            phone.branch
              ?.name || "",

          SellingPrice:
            phone.sellingPrice,

          ...(isManager && {
            BuyingPrice:
              phone.buyingPrice,

            Profit:
              Number(
                phone.sellingPrice
              ) -
              Number(
                phone.buyingPrice
              ),
          }),
        })
      );

    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Inventory"
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

    const fileData =
      new Blob(
        [excelBuffer],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        }
      );

    saveAs(
      fileData,
      "Inventory.xlsx"
    );
  }

  // =========================
  // PRINT
  // =========================
  function printInventory() {
    window.print();
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading inventory...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-black">
            Inventory
          </h1>

          <p className="text-gray-500 mt-1">
            Manage all phones
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={
              exportToExcel
            }
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
          >
            Export Excel
          </button>

          <button
            onClick={
              printInventory
            }
            className="bg-black hover:bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-semibold"
          >
            Print
          </button>

        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        <div className="bg-white rounded-xl shadow-sm p-3">
          <p className="text-gray-500 text-xs">
            Total Phones
          </p>

          <h2 className="text-2xl font-black mt-1">
            {
              filteredPhones.length
            }
          </h2>
        </div>

        {isManager && (
          <div className="bg-white rounded-xl shadow-sm p-3">
            <p className="text-gray-500 text-xs">
              Inventory Value
            </p>

            <h2 className="text-lg font-black mt-1">
              UGX{" "}
              {totalBuyingValue.toLocaleString()}
            </h2>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-3">
          <p className="text-gray-500 text-xs">
            Selling Value
          </p>

          <h2 className="text-lg font-black mt-1">
            UGX{" "}
            {totalSellingValue.toLocaleString()}
          </h2>
        </div>

        {isManager && (
          <div className="bg-white rounded-xl shadow-sm p-3">
            <p className="text-gray-500 text-xs">
              Potential Profit
            </p>

            <h2 className="text-lg font-black mt-1 text-green-600">
              UGX{" "}
              {totalPotentialProfit.toLocaleString()}
            </h2>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-3">
          <p className="text-gray-500 text-xs">
            Low Stock Models
          </p>

          <h2 className="text-2xl font-black mt-1 text-red-600">
            {
              lowStockModels.length
            }
          </h2>
        </div>

      </div>

      {/* LOW STOCK MODELS */}
      {lowStockModels.length >
        0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">

          <h3 className="font-semibold text-amber-800 mb-2">
            Low Stock Models
          </h3>

          <div className="flex flex-wrap gap-2">

            {lowStockModels
              .slice(
                0,
                10
              )
              .map(
                (
                  item
                ) => (
                  <span
                    key={`${item.brand}-${item.model}`}
                    className="bg-white border rounded-full px-3 py-1 text-sm"
                  >
                    {item.brand}{" "}
                    {item.model}
                    {" • "}
                    {
                      item.count
                    }
                  </span>
                )
              )}

          </div>

        </div>
      )}

      {/* SEARCH */}
      <div className="bg-white rounded-xl shadow-sm p-3">

        <input
          type="text"
          placeholder="Search by brand, model, IMEI or branch..."
          value={search}
          onChange={(
            e
          ) =>
            setSearch(
              e.target.value
            )
          }
          className="w-full border rounded-lg p-3"
        />

      </div>
            {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="px-3 py-2 text-left text-sm">
                  Brand
                </th>

                <th className="px-3 py-2 text-left text-sm">
                  Model
                </th>

                <th className="px-3 py-2 text-left text-sm">
                  IMEI
                </th>

                <th className="px-3 py-2 text-left text-sm">
                  Branch
                </th>

                {/* MANAGER ONLY */}
                {isManager && (
                  <th className="px-3 py-2 text-left text-sm">
                    Buying Price
                  </th>
                )}

                <th className="px-3 py-2 text-left text-sm">
                  Selling Price
                </th>

                {/* MANAGER ONLY */}
                {isManager && (
                  <th className="px-3 py-2 text-left text-sm">
                    Profit
                  </th>
                )}

                <th className="px-3 py-2 text-left text-sm">
                  Added
                </th>

                {/* MANAGER ONLY */}
                {isManager && (
                  <th className="px-3 py-2 text-left text-sm">
                    Actions
                  </th>
                )}

              </tr>

            </thead>

            <tbody>

              {filteredPhones.map(
                (phone) => {
                  const profit =
                    Number(
                      phone.sellingPrice
                    ) -
                    Number(
                      phone.buyingPrice
                    );

                  return (
                    <tr
                      key={
                        phone._id
                      }
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="px-3 py-2 font-semibold">
                        {
                          phone.brand
                        }
                      </td>

                      <td className="px-3 py-2">
                        {
                          phone.model
                        }
                      </td>

                      <td className="px-3 py-2 text-sm">
                        {
                          phone.imei
                        }
                      </td>

                      <td className="px-3 py-2">
                        {phone
                          .branch
                          ?.name ||
                          "N/A"}
                      </td>

                      {/* MANAGER ONLY */}
                      {isManager && (
                        <td className="px-3 py-2">
                          UGX{" "}
                          {Number(
                            phone.buyingPrice
                          ).toLocaleString()}
                        </td>
                      )}

                      <td className="px-3 py-2">
                        UGX{" "}
                        {Number(
                          phone.sellingPrice
                        ).toLocaleString()}
                      </td>

                      {/* MANAGER ONLY */}
                      {isManager && (
                        <td className="px-3 py-2 text-green-600 font-semibold">
                          UGX{" "}
                          {profit.toLocaleString()}
                        </td>
                      )}

                      <td className="px-3 py-2 text-sm">
                        {new Date(
                          phone.createdAt
                        ).toLocaleDateString()}
                      </td>

                      {/* MANAGER ONLY */}
                      {isManager && (
                        <td className="px-3 py-2">

                          <div className="flex gap-2">

                            <Link
                              to={`/edit-phone/${phone._id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                            >
                              Edit
                            </Link>

                            <button
                              onClick={() =>
                                deletePhone(
                                  phone._id
                                )
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                            >
                              Delete
                            </button>

                          </div>

                        </td>
                      )}

                    </tr>
                  );
                }
              )}

              {filteredPhones.length ===
                0 && (
                <tr>

                  <td
                    colSpan={
                      isManager
                        ? 9
                        : 5
                    }
                    className="p-8 text-center text-gray-500"
                  >
                    No phones found
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Inventory;