
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../services/api";

const EditPhone = () => {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

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
    });

  useEffect(() => {
    const fetchPhone =
      async () => {
        try {
          const res =
            await API.get(
              `/phones/${id}`
            );

          setFormData({
            brand:
              res.data.brand ||
              "",

            model:
              res.data.model ||
              "",

            imei:
              res.data.imei ||
              "",

            storage:
              res.data.storage ||
              "",

            ram:
              res.data.ram ||
              "",

            color:
              res.data.color ||
              "",

            buyingPrice:
              res.data
                .buyingPrice ||
              "",

            sellingPrice:
              res.data
                .sellingPrice ||
              "",
          });
        } catch (
          error
        ) {
          console.log(
            error
          );
        }
      };

    fetchPhone();
  }, [id]);

  const handleChange = (
    e
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        await API.put(
          `/phones/${id}`,
          formData
        );

        alert(
          "Phone updated successfully"
        );

        navigate(
          "/inventory"
        );
      } catch (
        error
      ) {
        console.log(
          error
        );

        alert(
          "Failed to update phone"
        );
      }
    };

  return (
    <div className="max-w-3xl mx-auto p-6">

      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Edit Phone
        </h1>

        <p className="text-gray-600 mt-2">
          Update phone details.
        </p>
      </div>

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
            value={
              formData.imei
            }
            onChange={
              handleChange
            }
            className="border rounded-lg p-4 w-full"
            required
          />
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
            placeholder="Optional"
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

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg w-full font-semibold"
        >
          Update Phone
        </button>
      </form>

    </div>
  );
};

export default EditPhone;