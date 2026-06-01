import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

function SalesTerminal() {
  const navigate =
    useNavigate();

  const [phones, setPhones] =
    useState([]);

  const [cart, setCart] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("Cash");

  // =========================
  // FETCH INVENTORY
  // =========================
  async function fetchPhones() {
    try {
      const response =
        await api.get(
          "/phones"
        );

      setPhones(
        response.data
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
  // SEARCH
  // =========================
  const filteredPhones =
    useMemo(() => {
      return phones.filter(
        (phone) => {
          const keyword =
            search.toLowerCase();

          return (
            phone.brand
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            phone.model
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            phone.imei
              ?.toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
    }, [phones, search]);

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
  // ADD TO CART
  // =========================
  function addToCart(phone) {
    const exists =
      cart.find(
        (item) =>
          item.phoneId ===
          phone._id
      );

    if (exists) {
      alert(
        "Phone already in cart"
      );

      return;
    }

    const cartItem = {
      phoneId:
        phone._id,

      brand:
        phone.brand,

      model:
        phone.model,

      imei:
        phone.imei,

      buyingPrice:
        phone.buyingPrice,

      sellingPrice:
        phone.sellingPrice,

      discount: 0,
    };

    setCart([
      ...cart,
      cartItem,
    ]);
  }

  // =========================
  // REMOVE ITEM
  // =========================
  function removeFromCart(
    phoneId
  ) {
    setCart(
      cart.filter(
        (item) =>
          item.phoneId !==
          phoneId
      )
    );
  }

  // =========================
  // UPDATE DISCOUNT
  // =========================
  function updateDiscount(
    phoneId,
    discount
  ) {
    setCart(
      cart.map((item) =>
        item.phoneId ===
        phoneId
          ? {
              ...item,
              discount:
                Number(
                  discount
                ) || 0,
            }
          : item
      )
    );
  }

  // =========================
  // CALCULATE ITEM TOTAL
  // =========================
  function calculateFinalPrice(
    item
  ) {
    return (
      item.sellingPrice -
      (item.sellingPrice *
        item.discount) /
        100
    );
  }

  // =========================
  // CART TOTALS
  // =========================
  const totalAmount =
    cart.reduce(
      (total, item) =>
        total +
        calculateFinalPrice(
          item
        ),
      0
    );

  const totalProfit =
    cart.reduce(
      (total, item) =>
        total +
        (
          calculateFinalPrice(
            item
          ) -
          item.buyingPrice
        ),
      0
    );

  // =========================
  // COMPLETE SALE
  // =========================
  async function checkout() {
    try {
      if (cart.length === 0) {
        alert(
          "Cart is empty"
        );

        return;
      }

      const payload = {
        items: cart,

        customerName,

        customerPhone,

        paymentMethod,
      };

      const response =
        await api.post(
          "/sales",
          payload
        );

      alert(
        "Sale completed successfully"
      );

      navigate(
        `/receipt/${response.data._id}`
      );
    } catch (error) {
      console.log(error);

      alert(
        "Sale failed"
      );
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading phones...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* INVENTORY */}
      <div className="xl:col-span-2 space-y-5">
        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold">
            Sales Terminal
          </h1>

          <p className="text-gray-500 mt-2">
            Multi-phone POS checkout
          </p>
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-2xl shadow p-5">
          <input
            type="text"
            placeholder="Search phones..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-4 outline-none"
          />
        </div>

        {/* PHONE LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPhones.map(
            (phone) => (
              <div
                key={phone._id}
                className="bg-white rounded-2xl shadow p-5 border"
              >
                <h2 className="text-2xl font-bold">
                  {phone.brand}{" "}
                  {phone.model}
                </h2>

                <p className="text-gray-500 mt-2 break-all">
                  {phone.imei}
                </p>

                <div className="mt-4 space-y-2">
                  <p>
                    <span className="font-semibold">
                      Buying:
                    </span>{" "}
                    UGX{" "}
                    {formatCurrency(
                      phone.buyingPrice
                    )}
                  </p>

                  <p>
                    <span className="font-semibold">
                      Selling:
                    </span>{" "}
                    UGX{" "}
                    {formatCurrency(
                      phone.sellingPrice
                    )}
                  </p>
                </div>

                <button
                  onClick={() =>
                    addToCart(
                      phone
                    )
                  }
                  className="w-full mt-5 bg-black hover:bg-gray-900 text-white py-3 rounded-xl font-semibold"
                >
                  Add To Cart
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* CART */}
      <div className="bg-white rounded-2xl shadow p-5 h-fit sticky top-5">
        <h2 className="text-3xl font-bold">
          Cart
        </h2>

        {/* CUSTOMER */}
        <div className="space-y-4 mt-5">
          <input
            type="text"
            placeholder="Customer Name"
            value={
              customerName
            }
            onChange={(e) =>
              setCustomerName(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-4 outline-none"
          />

          <input
            type="text"
            placeholder="Customer Contact"
            value={
              customerPhone
            }
            onChange={(e) =>
              setCustomerPhone(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-4 outline-none"
          />

          <select
            value={
              paymentMethod
            }
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-4 outline-none"
          >
            <option>
              Cash
            </option>

            <option>
              Mobile Money
            </option>

            <option>
              Bank
            </option>
          </select>
        </div>

        {/* CART ITEMS */}
        <div className="space-y-4 mt-6">
          {cart.map((item) => (
            <div
              key={
                item.phoneId
              }
              className="border rounded-2xl p-4"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-bold">
                    {
                      item.brand
                    }{" "}
                    {
                      item.model
                    }
                  </h3>

                  <p className="text-gray-500 text-sm break-all">
                    {
                      item.imei
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    removeFromCart(
                      item.phoneId
                    )
                  }
                  className="text-red-600 font-bold"
                >
                  X
                </button>
              </div>

              {/* PRICES */}
              <div className="mt-4 space-y-2">
                <p>
                  Selling:
                  <span className="font-semibold ml-2">
                    UGX{" "}
                    {formatCurrency(
                      item.sellingPrice
                    )}
                  </span>
                </p>

                <div>
                  <label className="text-sm text-gray-500">
                    Discount %
                  </label>

                  <input
                    type="number"
                    value={
                      item.discount
                    }
                    onChange={(
                      e
                    ) =>
                      updateDiscount(
                        item.phoneId,
                        e.target
                          .value
                      )
                    }
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>

                <p className="text-green-600 font-bold">
                  Final:
                  <span className="ml-2">
                    UGX{" "}
                    {formatCurrency(
                      calculateFinalPrice(
                        item
                      )
                    )}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* TOTALS */}
        <div className="border-t mt-6 pt-5 space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold">
              Total Amount
            </span>

            <span className="font-bold text-green-600">
              UGX{" "}
              {formatCurrency(
                totalAmount
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold">
              Total Profit
            </span>

            <span className="font-bold text-blue-600">
              UGX{" "}
              {formatCurrency(
                totalProfit
              )}
            </span>
          </div>
        </div>

        {/* CHECKOUT */}
        <button
          onClick={checkout}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-lg font-bold"
        >
          Complete Sale
        </button>
      </div>
    </div>
  );
}

export default SalesTerminal;