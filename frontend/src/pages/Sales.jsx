import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

function Sales() {
  const [sales, setSales] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const user = JSON.parse(
    localStorage.getItem(
      "user"
    )
  );

  // =========================
  // FETCH SALES
  // =========================
  async function fetchSales() {
    try {
      const response =
        await api.get(
          "/sales"
        );

      setSales(
        response.data
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSales();
  }, []);

  // =========================
  // DELETE SALE
  // =========================
  async function handleDelete(
    id
  ) {
    const confirmDelete =
      window.confirm(
        "Delete this sale history?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(
        `/sales/${id}`
      );

      fetchSales();
    } catch (error) {
      console.log(error);
    }
  }

  // =========================
  // SEARCH FILTER
  // =========================
  const filteredSales =
    useMemo(() => {
      return sales.filter(
        (sale) => {
          const keyword =
            search.toLowerCase();

          return (
            sale.brand
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            sale.model
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            sale.imei
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            sale.branch?.name
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            sale.customerName
              ?.toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
    }, [sales, search]);

  // =========================
  // FORMAT MONEY
  // =========================
  function formatCurrency(
    value
  ) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  // =========================
  // FORMAT DATE
  // =========================
  function formatDate(date) {
    return new Date(
      date
    ).toLocaleString();
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-6">
        Loading sales...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Sales History
        </h1>

        <p className="text-gray-500 mt-1">
          All completed phone sales
        </p>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <input
          type="text"
          placeholder="Search by brand, model, IMEI, customer or branch..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="w-full border rounded-lg p-4 outline-none"
        />

        <p className="text-sm text-gray-500 mt-3">
          {
            filteredSales.length
          }{" "}
          sales found
        </p>
      </div>

      {/* EMPTY STATE */}
      {filteredSales.length ===
      0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <h2 className="text-2xl font-bold">
            No Sales Found
          </h2>

          <p className="text-gray-500 mt-2">
            Completed sales will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">
                  Brand
                </th>

                <th className="p-4 text-left">
                  Model
                </th>

                <th className="p-4 text-left">
                  IMEI
                </th>

                <th className="p-4 text-left">
                  Sold Price
                </th>

                <th className="p-4 text-left">
                  Profit
                </th>

                <th className="p-4 text-left">
                  Customer
                </th>

                <th className="p-4 text-left">
                  Branch
                </th>

                <th className="p-4 text-left">
                  Sold By
                </th>

                <th className="p-4 text-left">
                  Sold At
                </th>

                {user?.role ===
                  "manager" && (
                  <th className="p-4 text-left">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredSales.map(
                (sale) => (
                  <tr
                    key={
                      sale._id
                    }
                    className="border-t"
                  >
                    <td className="p-4">
                      {
                        sale.brand
                      }
                    </td>

                    <td className="p-4">
                      {
                        sale.model
                      }
                    </td>

                    <td className="p-4">
                      {
                        sale.imei
                      }
                    </td>

                    <td className="p-4">
                      UGX{" "}
                      {formatCurrency(
                        sale.finalPrice
                      )}
                    </td>

                    <td className="p-4">
                      UGX{" "}
                      {formatCurrency(
                        sale.profit
                      )}
                    </td>

                    <td className="p-4">
                      {sale.customerName ||
                        "Walk-in Customer"}
                    </td>

                    <td className="p-4">
                      {sale
                        .branch
                        ?.name ||
                        "N/A"}
                    </td>

                    <td className="p-4">
                      {sale
                        .soldBy
                        ?.username ||
                        "N/A"}
                    </td>

                    <td className="p-4">
                      {formatDate(
                        sale.createdAt
                      )}
                    </td>

                    {user?.role ===
                      "manager" && (
                      <td className="p-4">
                        <button
                          onClick={() =>
                            handleDelete(
                              sale._id
                            )
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Sales;