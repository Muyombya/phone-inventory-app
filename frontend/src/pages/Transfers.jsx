import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../services/api";

function Transfers() {
  const [phones, setPhones] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  // =========================
  // FETCH PHONES
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
            !phone.soldAt
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
      console.log(error);
    }
  }

  useEffect(() => {
    fetchPhones();
    fetchBranches();
  }, []);

  // =========================
  // TRANSFER PHONE
  // =========================
  async function handleTransfer(
    phoneId,
    branchId
  ) {
    if (!branchId) {
      return;
    }

    try {
      await api.put(
        `/phones/transfer/${phoneId}`,
        {
          branchId,
        }
      );

      alert(
        "Phone transferred successfully"
      );

      fetchPhones();
    } catch (error) {
      console.log(error);

      alert(
        "Transfer failed"
      );
    }
  }

  // =========================
  // SEARCH FILTER
  // =========================
  const filteredPhones =
    useMemo(() => {
      return phones.filter(
        (phone) => {
          const keyword =
            search.toLowerCase();

          return (
            phone.brand
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            phone.model
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            phone.imei
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            phone.branch?.name
              ?.toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
    }, [phones, search]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-6">
        Loading transfers...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Transfers
          </h1>

          <p className="text-gray-500 mt-1">
            Transfer phones between branches
          </p>
        </div>

        <Link
          to="/transfer-history"
          className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold"
        >
          View Transfer
          History
        </Link>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <input
          type="text"
          placeholder="Search by brand, model, IMEI or branch..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="w-full border rounded-lg p-4 outline-none"
        />

        <p className="text-sm text-gray-500 mt-3">
          {
            filteredPhones.length
          }{" "}
          phones found
        </p>
      </div>

      {/* EMPTY */}
      {filteredPhones.length ===
      0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <h2 className="text-2xl font-bold">
            No Phones Found
          </h2>

          <p className="text-gray-500 mt-2">
            No transferable phones available.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">
                  Brand
                </th>

                <th className="p-4 text-left">
                  Model
                </th>

                <th className="p-4 text-left">
                  IMEI
                </th>

                <th className="p-4 text-left">
                  Current Branch
                </th>

                <th className="p-4 text-left">
                  Transfer
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPhones.map(
                (phone) => (
                  <tr
                    key={
                      phone._id
                    }
                    className="border-t"
                  >
                    <td className="p-4">
                      {
                        phone.brand
                      }
                    </td>

                    <td className="p-4">
                      {
                        phone.model
                      }
                    </td>

                    <td className="p-4">
                      {
                        phone.imei
                      }
                    </td>

                    <td className="p-4">
                      {phone
                        .branch
                        ?.name ||
                        "N/A"}
                    </td>

                    <td className="p-4">
                      <select
                        onChange={(
                          e
                        ) =>
                          handleTransfer(
                            phone._id,
                            e.target
                              .value
                          )
                        }
                        className="border p-3 rounded-lg w-full"
                        defaultValue=""
                      >
                        <option value="">
                          Select Branch
                        </option>

                        {branches
                          .filter(
                            (
                              branch
                            ) =>
                              branch._id !==
                              phone
                                .branch
                                ?._id
                          )
                          .map(
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
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transfers;