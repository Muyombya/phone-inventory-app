import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

function SellPhone() {
  const navigate =
    useNavigate();

  const [phones, setPhones] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [formData, setFormData] =
    useState({
      phoneId: "",
      customerName: "",
      sellingPrice: "",
      discount: 0,
    });



  // =========================
  // FETCH AVAILABLE PHONES
  // =========================
  async function fetchPhones() {
    try {
      const response =
        await api.get(
          "/phones"
        );

      const availablePhones =
        response.data.filter(
          (phone) =>
            phone.status !==
            "sold"
        );

      setPhones(
        availablePhones
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
  // HANDLE CHANGE
  // =========================
  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  }



  // =========================
  // SELL PHONE
  // =========================
  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    try {
      const response =
        await api.post(
          "/sales",
          formData
        );

      alert(
        "Phone sold successfully"
      );

      // REDIRECT TO RECEIPT
      console.log(
          "SALE RESPONSE:",
          response.data
        );

          console.log(
          "SALE ID:",
          response.data.sale?._id
        );

        navigate(
          `/receipt/${response.data.sale._id}`
        );

    } catch (error) {
      console.log(error);

      alert(
        "Failed to sell phone"
      );
    }
  }



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



  if (loading) {
    return (
      <div className="p-6">
        Loading phones...
      </div>
    );
  }



  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Sell Phone
        </h1>

        <p className="text-gray-600 mt-2">
          Create a new phone
          sale
        </p>
      </div>



      {/* FORM */}
      <div className="bg-white rounded-2xl shadow border p-6">
        <form
          onSubmit={
            handleSubmit
          }
          className="grid gap-5"
        >
          {/* PHONE */}
          <div>
            <label className="block mb-2 font-medium">
              Select Phone
            </label>

            <select
              name="phoneId"
              value={
                formData.phoneId
              }
              onChange={
                handleChange
              }
              className="w-full border p-4 rounded-lg"
              required
            >
              <option value="">
                Select Phone
              </option>

              {phones.map(
                (phone) => (
                  <option
                    key={
                      phone._id
                    }
                    value={
                      phone._id
                    }
                  >
                    {phone.brand}
                    {" "}
                    {phone.model}
                    {" "}
                    -
                    {" "}
                    IMEI:
                    {" "}
                    {phone.imei}
                    {" "}
                    -
                    {" "}
                    UGX
                    {" "}
                    {formatCurrency(
                      phone.sellingPrice
                    )}
                  </option>
                )
              )}
            </select>
          </div>



          {/* CUSTOMER NAME */}
          <div>
            <label className="block mb-2 font-medium">
              Customer Name
            </label>

            <input
              type="text"
              name="customerName"
              value={
                formData.customerName
              }
              onChange={
                handleChange
              }
              className="w-full border p-4 rounded-lg"
              placeholder="Optional"
            />
          </div>



          {/* SELLING PRICE */}
          <div>
            <label className="block mb-2 font-medium">
              Selling Price
            </label>

            <input
              type="number"
              name="sellingPrice"
              value={
                formData.sellingPrice
              }
              onChange={
                handleChange
              }
              className="w-full border p-4 rounded-lg"
              required
            />
          </div>



          {/* DISCOUNT */}
          <div>
            <label className="block mb-2 font-medium">
              Discount
            </label>

            <input
              type="number"
              name="discount"
              value={
                formData.discount
              }
              onChange={
                handleChange
              }
              className="w-full border p-4 rounded-lg"
            />
          </div>



          {/* FINAL AMOUNT PREVIEW */}
          <div className="bg-gray-100 rounded-xl p-5">
            <p className="text-gray-600">
              Final Amount
            </p>

            <h2 className="text-3xl font-bold mt-2">
              UGX{" "}
              {formatCurrency(
                Number(
                  formData.sellingPrice ||
                    0
                ) -
                  Number(
                    formData.discount ||
                      0
                  )
              )}
            </h2>
          </div>



          {/* BUTTON */}
          <button
            type="submit"
            className="bg-black text-white py-4 rounded-lg font-medium hover:opacity-90"
          >
            Complete Sale
          </button>
        </form>
      </div>
    </div>
  );
}

export default SellPhone;