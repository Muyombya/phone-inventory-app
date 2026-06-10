import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import api from "../services/api";

import logo from "../assets/logo1.png";

function Receipt() {
  const { id } =
    useParams();

  const [sale, setSale] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =========================
  // FETCH RECEIPT
  // =========================
  async function fetchSale() {
    try {
      const response =
        await api.get(
          `/sales/${id}`
        );
      setSale(
        response.data
      );

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSale();
  }, [id]);

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
  // PRINT
  // =========================
  function printReceipt() {
    window.print();
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading receipt...
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-6">
        Receipt not found
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @page {
            size: A4;
            margin: 6mm;
          }

          @media print {

            nav,
            button {
              display: none !important;
            }

            body {
              background: white !important;
            }

            .receipt-container {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
            }

            .receipt-logo {
              height: 70px !important;
            }

            table {
              font-size: 12px !important;
            }

            th,
            td {
              padding: 6px !important;
            }

            .no-break {
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="max-w-4xl mx-auto p-4">

        {/* PRINT BUTTON */}
        <div className="mb-4 text-right">
          <button
            onClick={
              printReceipt
            }
            className="bg-[#7A1F2B] hover:bg-[#651824] text-white px-5 py-2 rounded-xl font-semibold"
          >
            Print Receipt
          </button>
        </div>

        {/* RECEIPT */}
        <div className="receipt-container bg-white shadow-lg rounded-2xl p-6">

          {/* HEADER */}
          <div className="text-center border-b pb-4">

            <img
              src={logo}
              alt="Gadget Shop"
              className="receipt-logo h-20 mx-auto object-contain"
            />

            <div className="mt-2">

              <p className="font-bold text-base">
                {sale.branch?.name ||
                  "Branch"}
              </p>

              <p className="text-gray-600 text-sm">
                {sale.branch
                  ?.location ||
                  ""}
              </p>

              <p className="text-gray-600 text-sm">
                {sale.branch
                  ?.contact ||
                  ""}
              </p>

            </div>

            <h2 className="text-xl font-bold mt-3 text-[#7A1F2B]">
              SALES RECEIPT
            </h2>

          </div>

          {/* RECEIPT INFO */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">

            <div>

              <p>
                <span className="font-semibold">
                  Receipt No:
                </span>{" "}
                {sale.receiptNumber}
              </p>

              <p className="mt-1">
                <span className="font-semibold">
                  Customer:
                </span>{" "}
                {sale.customerName}
              </p>

              <p className="mt-1">
                <span className="font-semibold">
                  Contact:
                </span>{" "}
                {sale.customerPhone ||
                  "N/A"}
              </p>

            </div>

            <div className="text-right">

              <p>
                <span className="font-semibold">
                  Payment:
                </span>{" "}
                {sale.paymentMethod}
              </p>

              <p className="mt-1">
                <span className="font-semibold">
                  Cashier:
                </span>{" "}
                {sale.soldBy
                  ?.username ||
                  "N/A"}
              </p>

              <p className="mt-1">
                <span className="font-semibold">
                  Date:
                </span>{" "}
                {new Date(
                  sale.createdAt
                ).toLocaleString()}
              </p>

            </div>

          </div>

          {/* ITEMS */}
          <div className="mt-5 overflow-x-auto no-break">

            <table className="w-full border text-sm">

              <thead className="bg-gray-100">

                <tr>

                  <th className="border p-2 text-left">
                    Brand
                  </th>

                  <th className="border p-2 text-left">
                    Model
                  </th>

                  <th className="border p-2 text-left">
                    IMEI
                  </th>

                  <th className="border p-2 text-left">
                    Price
                  </th>

                  <th className="border p-2 text-left">
                    Disc.
                  </th>

                  <th className="border p-2 text-left">
                    Final
                  </th>

                </tr>

              </thead>

              <tbody>

                {sale.items.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        index
                      }
                    >

                      <td className="border p-2">
                        {
                          item.brand
                        }
                      </td>

                      <td className="border p-2">
                        {
                          item.model
                        }
                      </td>

                      <td className="border p-2">
                        {
                          item.imei
                        }
                      </td>

                      <td className="border p-2">
                        UGX{" "}
                        {formatCurrency(
                          item.sellingPrice
                        )}
                      </td>

                      <td className="border p-2 text-orange-600 font-semibold">
                        {
                          item.discount
                        }
                        %
                      </td>

                      <td className="border p-2 text-green-600 font-bold">
                        UGX{" "}
                        {formatCurrency(
                          item.finalPrice
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* TOTALS */}
          <div className="mt-5 border-t pt-4">

            <div className="text-right">

              <p>
                <span className="font-semibold">
                  Items:
                </span>{" "}
                {
                  sale.items
                    .length
                }
              </p>

              <p className="mt-1">
                <span className="font-semibold">
                  Total Discount:
                </span>{" "}
                {
                  sale.totalDiscount
                }
                %
              </p>

              <div className="inline-block mt-3 bg-green-50 border-2 border-green-600 rounded-xl px-5 py-3">

                <h2 className="text-2xl font-bold text-green-700">
                  TOTAL: UGX{" "}
                  {formatCurrency(
                    sale.totalAmount
                  )}
                </h2>

              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="text-center border-t pt-4 mt-5">

            <p className="font-medium text-gray-700">
              Thank you for shopping
              with Gadget Shop
            </p>

            <p className="text-xs text-gray-500 mt-2">
              Goods once sold are not
              returnable unless covered
              by warranty.
            </p>

          </div>

        </div>

      </div>
    </>
  );
}

export default Receipt;