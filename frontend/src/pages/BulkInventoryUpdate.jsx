import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

function BulkInventoryUpdate() {

  // ==========================
  // STATE
  // ==========================
  const [branches, setBranches] =
    useState([]);

  const [options, setOptions] =
  useState([]);

  const [loading, setLoading] =
    useState(false);

  const [matchingCount, setMatchingCount] =
    useState(null);

  const [
    currentBuyingPrice,
    setCurrentBuyingPrice,
  ] = useState("");

  const [
    currentSellingPrice,
    setCurrentSellingPrice,
  ] = useState("");

  const [formData, setFormData] =
    useState({

      branch: "",

      brand: "",

      model: "",

      ram: "",

      storage: "",

      buyingPrice: "",

      sellingPrice: "",

    });

  // ==========================
  // FETCH BRANCHES
  // ==========================
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

  // ==========================
// FETCH BULK OPTIONS
// ==========================
async function fetchBulkOptions() {

  try {

    const response =
      await api.get(
        "/phones/bulk-options"
      );

    setOptions(
      response.data.options
    );

  } catch (error) {

    console.log(
      "Bulk options error:",
      error
    );

  }

}

// ==========================
// HANDLE INPUT CHANGE
// ==========================
function handleChange(e) {

  const {

    name,

    value,

  } = e.target;

  setFormData((prev) => {

    const updated = {

      ...prev,

      [name]: value,

    };

    if (name === "branch") {

      updated.brand = "";

      updated.model = "";

      updated.ram = "";

      updated.storage = "";

    }

    if (name === "brand") {

      updated.model = "";

      updated.ram = "";

      updated.storage = "";

    }

    if (name === "model") {

      updated.ram = "";

      updated.storage = "";

    }

    if (name === "ram") {

      updated.storage = "";

    }

    return updated;

  });

}

  // ==========================
  // LOAD INVENTORY PREVIEW
  // ==========================
  async function loadPreview() {

    const {
      branch,
      brand,
      model,
      ram,
      storage,
    } = formData;

    if (

      !branch ||

      !brand ||

      !model ||

      !ram ||

      !storage

    ) {

      setMatchingCount(
        null
      );

      setCurrentBuyingPrice(
        ""
      );

      setCurrentSellingPrice(
        ""
      );

      return;

    }

    try {

      const response =
        await api.get(

          "/phones/bulk-preview",

          {

            params: {

                branch,

                brand: brand.trim(),

                model: model.trim(),

                ram: ram.trim(),

                storage: storage.trim(),

              },
          }

        );

      setMatchingCount(

        response.data.count

      );

      setCurrentBuyingPrice(

        response.data.buyingPrice

      );

      setCurrentSellingPrice(

        response.data.sellingPrice

      );

    } catch (error) {

      console.log(error);

      setMatchingCount(0);

      setCurrentBuyingPrice("");

      setCurrentSellingPrice("");

    }

  }

// ==========================
// HANDLE SUBMIT
// ==========================
async function handleSubmit(e) {

  e.preventDefault();

  if (matchingCount <= 0) {

    alert("No matching phones found.");

    return;

  }

  if (Number(formData.sellingPrice) <= 0) {

    alert("Selling Price must be greater than zero.");

    return;

  }

  const confirmed = window.confirm(
    `You are about to update ${matchingCount} phone(s).\n\nDo you want to continue?`
  );

  if (!confirmed) {

    return;

  }

  const payload = {

    ...formData,

    brand: formData.brand.trim(),

    model: formData.model.trim(),

    ram: formData.ram.trim(),

    storage: formData.storage.trim(),

  };

  setLoading(true);

  try {

    const response = await api.put(
      "/phones/bulk-update",
      payload
    );

    alert(response.data.message);

    setFormData({

      branch: "",

      brand: "",

      model: "",

      ram: "",

      storage: "",

      buyingPrice: "",

      sellingPrice: "",

    });

    setMatchingCount(null);

    setCurrentBuyingPrice("");

    setCurrentSellingPrice("");

  } catch (error) {

    console.log(error);

    alert(

      error.response?.data?.message ||

      "Bulk inventory update failed."

    );

  } finally {

    setLoading(false);

  }

}

  // ==========================
  // EFFECTS
  // ==========================
 useEffect(() => {

  fetchBranches();

  fetchBulkOptions();

}, []);

  useEffect(() => {

    loadPreview();

  }, [

    formData.branch,

    formData.brand,

    formData.model,

    formData.ram,

    formData.storage,

  ]);

  return (
     <div className="p-5 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-3xl font-bold">
          Bulk Inventory Update
        </h1>

        <p className="text-gray-600 mt-2">
          Update the prices of an entire inventory batch with a
          single operation.
        </p>

      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-6 space-y-6"
      >

        {/* BRANCH */}
        <div>

          <label className="block font-medium mb-2">
            Branch
          </label>

          <select
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className="border rounded-lg p-4 w-full"
            required
          >

            <option value="">
              Select Branch
            </option>

            {branches.map((branch) => (

              <option
                key={branch._id}
                value={branch._id}
              >
                {branch.name}
              </option>

            ))}

          </select>

        </div>

        {/* BRAND */}
                {/* BRAND */}
        <div>

          <label className="block font-medium mb-2">
            Brand
          </label>

          <select
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="border rounded-lg p-4 w-full"
            required
          >

            <option value="">
              Select Brand
            </option>

            {[...new Set(
              options
                .filter(option =>
                  option.branchId === formData.branch
                )
                .map(option =>
                  option.brand
                )
            )].map(brand => (

              <option
                key={brand}
                value={brand}
              >
                {brand}
              </option>

            ))}

          </select>

        </div>

        {/* MODEL */}
        <div>

          <label className="block font-medium mb-2">
            Model
          </label>

          <select
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="border rounded-lg p-4 w-full"
            required
          >

            <option value="">
              Select Model
            </option>

            {[...new Set(
              options
                .filter(option =>

                  option.branchId === formData.branch &&

                  option.brand === formData.brand

                )
                .map(option =>
                  option.model
                )
            )].map(model => (

              <option
                key={model}
                value={model}
              >
                {model}
              </option>

            ))}

          </select>

        </div>

        {/* RAM */}
        <div>

          <label className="block font-medium mb-2">
            RAM
          </label>

          <select
            name="ram"
            value={formData.ram}
            onChange={handleChange}
            className="border rounded-lg p-4 w-full"
            required
          >

            <option value="">
              Select RAM
            </option>

            {[...new Set(
              options
                .filter(option =>

                  option.branchId === formData.branch &&

                  option.brand === formData.brand &&

                  option.model === formData.model

                )
                .map(option =>
                  option.ram
                )
            )].map(ram => (

              <option
                key={ram}
                value={ram}
              >
                {ram}
              </option>

            ))}

          </select>

        </div>

        {/* STORAGE */}
        <div>

          <label className="block font-medium mb-2">
            Storage
          </label>

          <select
            name="storage"
            value={formData.storage}
            onChange={handleChange}
            className="border rounded-lg p-4 w-full"
            required
          >

            <option value="">
              Select Storage
            </option>

            {[...new Set(
              options
                .filter(option =>

                  option.branchId === formData.branch &&

                  option.brand === formData.brand &&

                  option.model === formData.model &&

                  option.ram === formData.ram

                )
                .map(option =>
                  option.storage
                )
            )].map(storage => (

              <option
                key={storage}
                value={storage}
              >
                {storage}
              </option>

            ))}

          </select>

        </div>

        {/* MATCHING INVENTORY */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">

          <p className="text-sm text-gray-600">
            Matching Inventory
          </p>

          <h2 className="text-4xl font-bold mt-2">

            {matchingCount === null
              ? "--"
              : matchingCount}

          </h2>

          <p
            className={`mt-2 font-medium ${
              matchingCount > 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >

            {matchingCount === null

              ? "Enter inventory details"

              : matchingCount > 0

              ? "Matching Phones Found"

              : "No Matching Phones"}

          </p>

        </div>

        {/* CURRENT BUYING PRICE */}
        <div>

          <label className="block font-medium mb-2">
            Current Buying Price
          </label>

          <input
            type="text"
            value={
              currentBuyingPrice
                ? Number(
                    currentBuyingPrice
                  ).toLocaleString()
                : ""
            }
            className="border rounded-lg p-4 w-full bg-gray-100"
            readOnly
          />

        </div>

        {/* NEW BUYING PRICE */}
        <div>

          <label className="block font-medium mb-2">
            New Buying Price (Optional)
          </label>

          <input
            type="number"
            name="buyingPrice"
            value={formData.buyingPrice}
            onChange={handleChange}
            placeholder="Leave blank to retain the current buying price"
            className="border rounded-lg p-4 w-full"
          />

        </div>

        {/* CURRENT SELLING PRICE */}
        <div>

          <label className="block font-medium mb-2">
            Current Selling Price
          </label>

          <input
            type="text"
            value={
              currentSellingPrice
                ? Number(
                    currentSellingPrice
                  ).toLocaleString()
                : ""
            }
            className="border rounded-lg p-4 w-full bg-gray-100"
            readOnly
          />

        </div>

        {/* NEW SELLING PRICE */}
        <div>

          <label className="block font-medium mb-2">
            New Selling Price
          </label>

          <input
            type="number"
            name="sellingPrice"
            value={formData.sellingPrice}
            onChange={handleChange}
            className="border rounded-lg p-4 w-full"
            required
          />

        </div>

        {/* INFORMATION */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">

          <h3 className="font-semibold text-blue-900 mb-3">
            Important Information
          </h3>

          <ul className="list-disc ml-5 space-y-2 text-sm text-blue-800">

            <li>
              This operation updates every phone matching the selected inventory batch.
            </li>

            <li>
              Buying Price is optional. Leave it blank if only the Selling Price is changing.
            </li>

            <li>
              Selling Price is mandatory.
            </li>

            <li>
              Only Managers are permitted to perform this operation.
            </li>

            <li>
              A single audit record will be created for the entire update.
            </li>

          </ul>

        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-4 pt-2">

          <button
            type="button"
            onClick={() => {

              setFormData({

                branch: "",
                brand: "",
                model: "",
                ram: "",
                storage: "",
                buyingPrice: "",
                sellingPrice: "",

              });

              setMatchingCount(null);

              setCurrentBuyingPrice("");

              setCurrentSellingPrice("");

            }}
            className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >

            Clear

          </button>

          <button
            type="submit"
            disabled={
              loading ||
              matchingCount === null ||
              matchingCount === 0
            }
            className={`px-8 py-3 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : matchingCount > 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >

            {loading
              ? "Updating Inventory..."
              : "Update Inventory"}

          </button>

        </div>

      </form>

    </div>
      );

}

export default BulkInventoryUpdate;
