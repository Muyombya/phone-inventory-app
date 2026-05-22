import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../services/api";

const EditPhone = () => {
  const { id } = useParams();

  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const res = await API.get(`/phones/${id}`);

        setFormData(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchPhone();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.put(`/phones/${id}`, formData);

      alert("Phone updated successfully");

      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Edit Phone</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
        }}
      >
        <input
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="Brand"
        />

        <input
          type="text"
          name="model"
          value={formData.model}
          onChange={handleChange}
          placeholder="Model"
        />

        <input
          type="text"
          name="imei"
          value={formData.imei}
          onChange={handleChange}
          placeholder="IMEI"
        />

        <input
          type="text"
          name="storage"
          value={formData.storage}
          onChange={handleChange}
          placeholder="Storage"
        />

        <input
          type="text"
          name="ram"
          value={formData.ram}
          onChange={handleChange}
          placeholder="RAM"
        />

        <input
          type="text"
          name="color"
          value={formData.color}
          onChange={handleChange}
          placeholder="Color"
        />

        <input
          type="number"
          name="sellingPrice"
          value={formData.sellingPrice}
          onChange={handleChange}
          placeholder="Selling Price"
        />

        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Quantity"
        />

        <button type="submit">
          Update Phone
        </button>
      </form>
    </div>
  );
};

export default EditPhone;