import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

function Branches() {
  const [branches, setBranches] =
    useState([]);

  const [name, setName] =
    useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    contact,
    setContact,
  ] = useState("");

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  // =========================
  // FETCH BRANCHES
  // =========================
  async function fetchBranches() {
    try {
      const res =
        await api.get(
          "/branches"
        );

      setBranches(
        res.data
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBranches();
  }, []);

  // =========================
  // CREATE / UPDATE
  // =========================
  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    try {
      if (
        editingId
      ) {
        await api.put(
          `/branches/${editingId}`,
          {
            name,
            location,
            contact,
          }
        );
      } else {
        await api.post(
          "/branches",
          {
            name,
            location,
            contact,
          }
        );
      }

      setName("");
      setLocation("");
      setContact("");

      setEditingId(
        null
      );

      fetchBranches();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data
          ?.message ||
          "Operation failed"
      );
    }
  }

  // =========================
  // EDIT
  // =========================
  function handleEdit(
    branch
  ) {
    setEditingId(
      branch._id
    );

    setName(
      branch.name
    );

    setLocation(
      branch.location
    );

    setContact(
      branch.contact ||
        ""
    );
  }

  // =========================
  // DELETE
  // =========================
  async function handleDelete(
    id
  ) {
    const confirmDelete =
      window.confirm(
        "Delete this branch?"
      );

    if (
      !confirmDelete
    ) {
      return;
    }

    try {
      await api.delete(
        `/branches/${id}`
      );

      fetchBranches();
    } catch (error) {
      console.log(error);

      alert(
        "Delete failed"
      );
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading branches...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Branch Management
        </h1>

        <p className="text-gray-500 mt-2">
          Manage business
          branches
        </p>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-2xl shadow p-6">
        <form
          onSubmit={
            handleSubmit
          }
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            type="text"
            placeholder="Branch Name"
            value={name}
            onChange={(
              e
            ) =>
              setName(
                e.target.value
              )
            }
            required
            className="border rounded-xl p-4"
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(
              e
            ) =>
              setLocation(
                e.target.value
              )
            }
            className="border rounded-xl p-4"
          />

          <input
            type="text"
            placeholder="Contact"
            value={contact}
            onChange={(
              e
            ) =>
              setContact(
                e.target.value
              )
            }
            className="border rounded-xl p-4"
          />

          <button
            type="submit"
            className="bg-black hover:bg-gray-900 text-white rounded-xl p-4 font-semibold"
          >
            {editingId
              ? "Update Branch"
              : "Add Branch"}
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-3xl font-bold">
            Branches
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">
                  Branch Name
                </th>

                <th className="p-4 text-left">
                  Location
                </th>

                <th className="p-4 text-left">
                  Contact
                </th>

                <th className="p-4 text-left">
                  Created
                </th>

                <th className="p-4 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {branches.map(
                (branch) => (
                  <tr
                    key={
                      branch._id
                    }
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-semibold">
                      {
                        branch.name
                      }
                    </td>

                    <td className="p-4">
                      {
                        branch.location
                      }
                    </td>

                    <td className="p-4">
                      {
                        branch.contact
                      }
                    </td>

                    <td className="p-4 text-sm">
                      {new Date(
                        branch.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-4">
                        <button
                          onClick={() =>
                            handleEdit(
                              branch
                            )
                          }
                          className="text-blue-600 font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              branch._id
                            )
                          }
                          className="text-red-600 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Branches;