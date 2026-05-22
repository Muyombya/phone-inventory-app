import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import BarcodeScanner from "../components/BarcodeScanner";

const AddPhone = () => {
  const navigate = useNavigate();

  const [showScanner, setShowScanner] = useState(false);

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    imei: "",
    storage: "",
    ram: "",
    color: "",
    sellingPrice: "",
    quantity: "",
  });

  const handleChange = (event) => {
    setFormData((prevData) => ({
      ...prevData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleScanSuccess = (scannedValue) => {
    setFormData((prevData) => ({
      ...prevData,
      imei: scannedValue,
    }));

    setShowScanner(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await API.post("/phones", formData);

      alert("Phone added successfully");

      navigate("/");
    } catch (error) {
      console.error("Error adding phone:", error);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-4">
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-3xl font-bold">
          Add Phone
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            name="brand"
            placeholder="Brand"
            value={formData.brand}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 p-3"
          />

          <input
            type="text"
            name="model"
            placeholder="Model"
            value={formData.model}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 p-3"
          />

          <div className="space-y-2">
            <input
              type="text"
              name="imei"
              placeholder="IMEI"
              value={formData.imei}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />

            <button
              type="button"
              onClick={() =>
                setShowScanner((prev) => !prev)
              }
              className="rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800"
            >
              {showScanner
                ? "Close Scanner"
                : "Scan IMEI"}
            </button>
          </div>

          {showScanner && (
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
            />
          )}

          <input
            type="text"
            name="storage"
            placeholder="Storage"
            value={formData.storage}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3"
          />

          <input
            type="text"
            name="ram"
            placeholder="RAM"
            value={formData.ram}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3"
          />

          <input
            type="text"
            name="color"
            placeholder="Color"
            value={formData.color}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3"
          />

          <input
            type="number"
            name="sellingPrice"
            placeholder="Selling Price"
            value={formData.sellingPrice}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 p-3"
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700"
          >
            Save Phone
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPhone;