import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

function Users() {
  const [users, setUsers] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [role, setRole] =
    useState(
      "branch-user"
    );

  const [
    branch,
    setBranch,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  // =========================
  // EDITING
  // =========================
  const [
    editingUser,
    setEditingUser,
  ] = useState(null);

  const [
    editData,
    setEditData,
  ] = useState({
    username: "",
    role: "",
    branch: "",
    password: "",
  });



  // =========================
  // FETCH USERS
  // =========================
  async function fetchUsers() {
    try {
      const res =
        await api.get(
          "/users"
        );

      setUsers(
        res.data
      );
    } catch (error) {
      console.log(error);
    }
  }



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
    fetchUsers();

    fetchBranches();
  }, []);



  // =========================
  // CREATE USER
  // =========================
  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    try {
      await api.post(
        "/auth/register",
        {
          username,
          password,
          role,
          branch:
            role ===
            "manager"
              ? null
              : branch,
        }
      );

      alert(
        "User created successfully"
      );

      setUsername("");
      setPassword("");
      setRole(
        "branch-user"
      );
      setBranch("");

      fetchUsers();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data
          ?.message ||
          "Failed to create user"
      );
    }
  }



  // =========================
  // OPEN EDIT
  // =========================
  function openEdit(user) {
    setEditingUser(user);

    setEditData({
      username:
        user.username,

      role:
        user.role,

      branch:
        user.branch?._id ||
        "",

      password: "",
    });
  }



  // =========================
  // UPDATE USER
  // =========================
  async function updateUser(
    e
  ) {
    e.preventDefault();

    try {
      await api.put(
        `/users/${editingUser._id}`,
        editData
      );

      alert(
        "User updated successfully"
      );

      setEditingUser(
        null
      );

      fetchUsers();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data
          ?.message ||
          "Failed to update user"
      );
    }
  }



  // =========================
  // DELETE USER
  // =========================
  async function deleteUser(
    id
  ) {
    const confirmDelete =
      window.confirm(
        "Delete this user?"
      );

    if (
      !confirmDelete
    ) {
      return;
    }

    try {
      await api.delete(
        `/users/${id}`
      );

      alert(
        "User deleted successfully"
      );

      fetchUsers();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data
          ?.message ||
          "Failed to delete user"
      );
    }
  }



  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }



  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          User Management
        </h1>

        <p className="text-gray-500 mt-2">
          Manage system users
        </p>
      </div>



      {/* CREATE USER */}
      <div className="bg-white rounded-2xl shadow p-6">
        <form
          onSubmit={
            handleSubmit
          }
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(
              e
            ) =>
              setUsername(
                e.target.value
              )
            }
            required
            className="border rounded-xl p-4"
          />



          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(
              e
            ) =>
              setPassword(
                e.target.value
              )
            }
            required
            className="border rounded-xl p-4"
          />



          <select
            value={role}
            onChange={(
              e
            ) =>
              setRole(
                e.target.value
              )
            }
            className="border rounded-xl p-4"
          >
            <option value="manager">
              Manager
            </option>

            <option value="branch-user">
              Branch User
            </option>
          </select>



          <select
            value={branch}
            onChange={(
              e
            ) =>
              setBranch(
                e.target.value
              )
            }
            disabled={
              role ===
              "manager"
            }
            className="border rounded-xl p-4"
          >
            <option value="">
              Select Branch
            </option>

            {branches.map(
              (
                branch
              ) => (
                <option
                  key={
                    branch._id
                  }
                  value={
                    branch._id
                  }
                >
                  {
                    branch.name
                  }
                </option>
              )
            )}
          </select>



          <button
            type="submit"
            className="bg-black hover:bg-gray-900 text-white rounded-xl p-4 font-semibold"
          >
            Create User
          </button>
        </form>
      </div>



      {/* USERS TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">
                Username
              </th>

              <th className="p-4 text-left">
                Role
              </th>

              <th className="p-4 text-left">
                Branch
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
            {users.map(
              (user) => (
                <tr
                  key={
                    user._id
                  }
                  className="border-t"
                >
                  <td className="p-4 font-semibold">
                    {
                      user.username
                    }
                  </td>

                  <td className="p-4 capitalize">
                    {
                      user.role
                    }
                  </td>

                  <td className="p-4">
                    {user
                      .branch
                      ?.name ||
                      "Manager"}
                  </td>

                  <td className="p-4">
                    {new Date(
                      user.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          openEdit(
                            user
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteUser(
                            user._id
                          )
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
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



      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-3xl font-bold mb-6">
              Edit User
            </h2>

            <form
              onSubmit={
                updateUser
              }
              className="space-y-5"
            >
              {/* USERNAME */}
              <input
                type="text"
                value={
                  editData.username
                }
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    username:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />



              {/* ROLE */}
              <select
                value={
                  editData.role
                }
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    role:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              >
                <option value="manager">
                  Manager
                </option>

                <option value="branch-user">
                  Branch User
                </option>
              </select>



              {/* BRANCH */}
              {editData.role !==
                "manager" && (
                <select
                  value={
                    editData.branch
                  }
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      branch:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3"
                >
                  <option value="">
                    Select Branch
                  </option>

                  {branches.map(
                    (
                      branch
                    ) => (
                      <option
                        key={
                          branch._id
                        }
                        value={
                          branch._id
                        }
                      >
                        {
                          branch.name
                        }
                      </option>
                    )
                  )}
                </select>
              )}



              {/* PASSWORD */}
              <input
                type="password"
                placeholder="New Password (optional)"
                value={
                  editData.password
                }
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    password:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />



              {/* BUTTONS */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-black text-white py-3 rounded-xl"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditingUser(
                      null
                    )
                  }
                  className="flex-1 bg-gray-300 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;