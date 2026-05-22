import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import API from "../services/api";

const Phones = () => {
  const [phones, setPhones] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadPhones = async () => {
      try {
        const response = await API.get("/phones");

        setPhones(response.data);
      } catch (error) {
        console.error("Error fetching phones:", error);
      }
    };

    loadPhones();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this phone?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await API.delete(`/phones/${id}`);

      setPhones((prevPhones) =>
        prevPhones.filter((phone) => phone._id !== id)
      );
    } catch (error) {
      console.error("Error deleting phone:", error);
    }
  };

  const filteredPhones = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return phones.filter((phone) => {
      return (
        phone.brand?.toLowerCase().includes(search) ||
        phone.model?.toLowerCase().includes(search) ||
        phone.imei?.toLowerCase().includes(search)
      );
    });
  }, [phones, searchTerm]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">
          All Phones
        </h1>

        <input
          type="text"
          placeholder="Search by brand, model or IMEI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 md:w-96"
        />
      </div>

      {filteredPhones.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center shadow">
          No phones found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhones.map((phone) => (
            <div
              key={phone._id}
              className="rounded-xl bg-white p-5 shadow-md transition hover:shadow-lg"
            >
              <h2 className="mb-2 text-xl font-bold">
                {phone.brand} {phone.model}
              </h2>

              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">IMEI:</span>{" "}
                  {phone.imei}
                </p>

                <p>
                  <span className="font-semibold">Storage:</span>{" "}
                  {phone.storage}
                </p>

                <p>
                  <span className="font-semibold">RAM:</span>{" "}
                  {phone.ram}
                </p>

                <p>
                  <span className="font-semibold">Color:</span>{" "}
                  {phone.color}
                </p>

                <p>
                  <span className="font-semibold">Price:</span>{" "}
                  UGX {phone.sellingPrice}
                </p>

                <p>
                  <span className="font-semibold">Quantity:</span>{" "}
                  {phone.quantity}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/edit/${phone._id}`}
                  className="flex-1"
                >
                  <button
                    type="button"
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => handleDelete(phone._id)}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Phones;