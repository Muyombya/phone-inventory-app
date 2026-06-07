
import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import BarcodeScanner from "../components/BarcodeScanner";

function AddPhone() {
  const [formData, setFormData] =
    useState({
      brand: "",
      model: "",
      imei: "",
      storage: "",
      ram: "",
      color: "",
      buyingPrice: "",
      sellingPrice: "",
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
        storage: "",
        ram: "",
        color: "",
        buyingPrice: "",
        sellingPrice: "",
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
          Register new stock into
          inventory.
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
            placeholder="Example: Samsung"
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
            placeholder="Example: Galaxy A16"
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

          {scanning && (
            <BarcodeScanner
              onScanSuccess={(
                selectedImei
              ) => {
                setFormData(
                  (
                    prev
                  ) => ({
                    ...prev,
                    imei:
                      selectedImei,
                  })
                );

                setScanning(
                  false
                );
              }}
            />
          )}
        </div>

        {/* STORAGE */}
        <div>
          <label className="block font-medium mb-2">
            Storage
          </label>

          <select
            name="storage"
            value={
              formData.storage
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          >
            <option value="">
              Select Storage
            </option>

            <option value="128MB">
              128MB
            </option>

            <option value="4GB">
              4GB
            </option>

            <option value="8GB">
              8GB
            </option>

            <option value="32GB">
              32GB
            </option>

            <option value="64GB">
              64GB
            </option>

            <option value="128GB">
              128GB
            </option>

            <option value="256GB">
              256GB
            </option>

            <option value="512GB">
              512GB
            </option>

            <option value="1TB">
              1TB
            </option>
          </select>
        </div>

        {/* RAM */}
        <div>
          <label className="block font-medium mb-2">
            RAM
          </label>

          <select
            name="ram"
            value={
              formData.ram
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          >
            <option value="">
              Select RAM
            </option>

             <option value="48MB">
              48MB
            </option>

            <option value="64MB">
              64MB
            </option>

            <option value="512MB">
              512MB
            </option>

            <option value="1GB">
              1GB
            </option>

            <option value="2GB">
              2GB
            </option>

            <option value="3GB">
              3GB
            </option>

            <option value="4GB">
              4GB
            </option>

            <option value="6GB">
              6GB
            </option>

            <option value="8GB">
              8GB
            </option>

            <option value="12GB">
              12GB
            </option>

            <option value="16GB">
              16GB
            </option>
          </select>
        </div>

        {/* COLOUR */}
        <div>
          <label className="block font-medium mb-2">
            Colour
          </label>

          <input
            type="text"
            name="color"
            placeholder="Example: Black"
            value={
              formData.color
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />
        </div>

        {/* BUYING PRICE */}
        <div>
          <label className="block font-medium mb-2">
            Buying Price
          </label>

          <input
            type="number"
            name="buyingPrice"
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

        {/* INFO */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Phones added here are
            automatically timestamped
            with:
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
