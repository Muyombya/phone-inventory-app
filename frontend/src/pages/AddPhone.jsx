import {
  useEffect,
  useState,
} from "react";

import BarcodeScanner from "react-qr-barcode-scanner";

import api from "../services/api";



function AddPhone() {
  const [formData, setFormData] =
    useState({
      brand: "",
      model: "",
      imei: "",
      buyingPrice: "",
      sellingPrice: "",
      quantity: 1,
      branch: "",
    });

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);



  // =========================
  // FETCH BRANCHES
  // =========================
  async function fetchBranches() {
    try {
      const response =
        await api.get(
          "/branches"
        );

      setBranches(
        response.data
      );
    } catch (error) {
      console.log(
        "Branch fetch error:",
        error
      );
    }
  }



  useEffect(() => {
    fetchBranches();
  }, []);



  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  }



  // =========================
  // HANDLE SUBMIT
  // =========================
  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post(
        "/phones",
        formData
      );

      alert(
        "Phone added successfully"
      );

      setFormData({
        brand: "",
        model: "",
        imei: "",
        buyingPrice: "",
        sellingPrice: "",
        quantity: 1,
        branch: "",
      });
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data
          ?.message ||
          "Error adding phone"
      );
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="p-5 max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Add Phones
        </h1>

        <p className="text-gray-600 mt-2">
          Register new stock into inventory.
        </p>
      </div>



      {/* FORM */}
      <form
        onSubmit={
          handleSubmit
        }
        className="bg-white rounded-xl shadow-lg p-6 space-y-5"
      >
        {/* BRAND */}
        <div>
          <label className="block font-medium mb-2">
            Brand
          </label>

          <input
            type="text"
            name="brand"
            placeholder="Example: Nokia"
            value={
              formData.brand
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />
        </div>



        {/* MODEL */}
        <div>
          <label className="block font-medium mb-2">
            Model
          </label>

          <input
            type="text"
            name="model"
            placeholder="Example: Nokia 125"
            value={
              formData.model
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />
        </div>



        {/* IMEI */}
        <div>
          <label className="block font-medium mb-2">
            IMEI
          </label>

          <input
            type="text"
            name="imei"
            placeholder="Enter or scan IMEI"
            value={
              formData.imei
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />



          {/* SCANNER BUTTON */}
          <button
            type="button"
            onClick={() =>
              setScanning(
                !scanning
              )
            }
            className="mt-3 bg-black text-white px-4 py-3 rounded-lg w-full"
          >
            {scanning
              ? "Close Scanner"
              : "Scan IMEI"}
          </button>



          {/* BARCODE SCANNER */}
          {scanning && (
            <div className="mt-4 rounded-lg overflow-hidden border">
              <BarcodeScanner
                width={500}
                height={500}
                onUpdate={(
                  err,
                  result
                ) => {
                  if (
                    result
                  ) {
                    setFormData(
                      (
                        prev
                      ) => ({
                        ...prev,
                        imei:
                          result.text,
                      })
                    );

                    setScanning(
                      false
                    );
                  }
                }}
              />
            </div>
          )}
        </div>



        {/* BUYING PRICE */}
        <div>
          <label className="block font-medium mb-2">
            Buying Price
          </label>

          <input
            type="number"
            name="buyingPrice"
            placeholder="Buying Price"
            value={
              formData.buyingPrice
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />
        </div>



        {/* SELLING PRICE */}
        <div>
          <label className="block font-medium mb-2">
            Selling Price
          </label>

          <input
            type="number"
            name="sellingPrice"
            placeholder="Selling Price"
            value={
              formData.sellingPrice
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />
        </div>



        {/* QUANTITY */}
        <div>
          <label className="block font-medium mb-2">
            Quantity
          </label>

          <input
            type="number"
            name="quantity"
            min="1"
            value={
              formData.quantity
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />
        </div>



        {/* BRANCH */}
        <div>
          <label className="block font-medium mb-2">
            Allocate Branch
          </label>

          <select
            name="branch"
            value={
              formData.branch
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          >
            <option value="">
              Select Branch
            </option>

            {branches.map(
              (branch) => (
                <option
                  key={
                    branch._id
                  }
                  value={
                    branch._id
                  }
                >
                  {branch.name}
                </option>
              )
            )}
          </select>
        </div>



        {/* TIMESTAMP INFO */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Phones added here are automatically timestamped with:
          </p>

          <ul className="list-disc ml-5 mt-2 text-sm text-blue-700">
            <li>
              Date Added
            </li>

            <li>
              User who added stock
            </li>

            <li>
              Initial branch allocation
            </li>
          </ul>
        </div>



        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg w-full font-semibold transition duration-200"
        >
          {loading
            ? "Saving..."
            : "Save Phone"}
        </button>
      </form>
    </div>
  );
}



export default AddPhone;