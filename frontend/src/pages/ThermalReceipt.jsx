import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import api from "../services/api";

import logo from "../assets/logo1.png";

function ThermalReceipt() {
  const { id } =
    useParams();

  const [sale, setSale] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchSale();
  }, [id]);

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

  function formatCurrency(
    value
  ) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  function printReceipt() {
    window.print();
  }

  if (loading) {
    return (
      <div className="p-4">
        Loading...
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-4">
        Receipt not found
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @page {
            size: 80mm auto;
            margin: 0;
          }

          @media print {

            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            nav,
            button {
              display: none !important;
            }

            .thermal-container {
              width: 80mm !important;
              max-width: 80mm !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}
      </style>

      <div className="p-3">

        <div className="mb-3 text-center">

          <button
            onClick={
              printReceipt
            }
            className="bg-[#7A1F2B] text-white px-4 py-2 rounded-lg"
          >
            Print Thermal Receipt
          </button>

        </div>

        <div className="thermal-container mx-auto bg-white text-black text-sm p-3">

          {/* LOGO */}
          <div className="text-center">

            <img
              src={logo}
              alt="Gadget Shop"
              className="h-16 mx-auto object-contain"
            />

          </div>

          {/* BRANCH */}
          <div className="text-center mt-2">

            <div className="font-bold text-base">
              {sale.branch?.name}
            </div>

            <div>
              {sale.branch?.location}
            </div>

            <div>
              {sale.branch?.contact}
            </div>

          </div>

          {/* DIVIDER */}
          <div className="my-3 border-t border-dashed border-black" />

          {/* RECEIPT INFO */}

          <div>

            <div>
              Receipt:
              {" "}
              {sale.receiptNumber}
            </div>

            <div>
              Date:
              {" "}
              {new Date(
                sale.createdAt
              ).toLocaleString()}
            </div>

            <div>
              Cashier:
              {" "}
              {sale.soldBy
                ?.username ||
                "N/A"}
            </div>

            <div>
              Customer:
              {" "}
              {sale.customerName}
            </div>

          </div>

          {/* DIVIDER */}
          <div className="my-3 border-t border-dashed border-black" />

          {/* ITEMS */}

          <div>

            {sale.items.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="mb-4"
                >

                  <div className="font-bold">
                    {item.brand}
                    {" "}
                    {item.model}
                  </div>

                  <div className="text-xs break-all">
                    IMEI:
                    {" "}
                    {item.imei}
                  </div>

                  <div>
                    Price:
                    {" "}
                    UGX
                    {" "}
                    {formatCurrency(
                      item.finalPrice
                    )}
                  </div>

                  {item.discount >
                    0 && (
                    <div>
                      Discount:
                      {" "}
                      {
                        item.discount
                      }
                      %
                    </div>
                  )}

                </div>
              )
            )}

          </div>

          {/* DIVIDER */}
          <div className="my-3 border-t border-dashed border-black" />

          {/* TOTALS */}

          <div>

            <div>
              Items:
              {" "}
              {
                sale.items
                  .length
              }
            </div>

            <div>
              Payment:
              {" "}
              {
                sale.paymentMethod
              }
            </div>

            <div>
              Discount:
              {" "}
              {
                sale.totalDiscount
              }
              %
            </div>

          </div>

          {/* DIVIDER */}
          <div className="my-3 border-t border-dashed border-black" />

          <div className="text-center">

            <div className="font-bold text-lg">
              TOTAL
            </div>

            <div className="font-black text-2xl">
              UGX
            </div>

            <div className="font-black text-2xl">
              {formatCurrency(
                sale.totalAmount
              )}
            </div>

          </div>

          {/* DIVIDER */}
          <div className="my-3 border-t border-dashed border-black" />

          {/* FOOTER */}

          <div className="text-center text-xs">

            <div>
              Thank you for shopping
              with Gadget Shop
            </div>

            <div className="mt-2">
              Goods once sold are
              not returnable unless
              covered by warranty.
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default ThermalReceipt;