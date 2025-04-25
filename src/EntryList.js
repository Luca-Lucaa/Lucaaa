import React, { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { formatDate, handleError } from "./utils";
import { useSnackbar } from "./useSnackbar";

const EntryList = ({ role, loggedInUser, setEntries, entries }) => {
  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    nickname: "",
    password: "",
    package: "premium",
    createdBy: loggedInUser,
    status: "active",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const { showSnackbar } = useSnackbar();

  // Einträge filtern
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.username?.toLowerCase().includes(query) ||
          entry.aliasNotes?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((entry) => entry.status.toLowerCase() === statusFilter);
    }
    if (packageFilter !== "all") {
      result = result.filter((entry) => entry.package === packageFilter);
    }

    return result.sort((a, b) => {
      const dateA = new Date(a.validUntil || "1970-01-01");
      const dateB = new Date(b.validUntil || "1970-01-01");
      return dateA - dateB;
    });
  }, [entries, searchQuery, statusFilter, packageFilter]);

  // Preisrechnung
  const calculatePrice = (packageType) => {
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);
    const daysInYear = (endOfYear - new Date(new Date().getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24);
    const daysRemaining = (endOfYear - new Date()) / (1000 * 60 * 60 * 24);
    const fullYearPrice = packageType === "premium" ? 120 : 100;
    const proratedPrice = Math.round((fullYearPrice * daysRemaining / daysInYear) * 100) / 100;
    return { proratedPrice, daysRemaining: Math.ceil(daysRemaining) };
  };

  // Eintrag erstellen oder bearbeiten
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { username, nickname, password, package: pkg, createdBy, status } = formData;

    if (!username || !password || !createdBy) {
      showSnackbar("Bitte alle Pflichtfelder ausfüllen.", "error");
      return;
    }

    const endDate = new Date(new Date().getFullYear(), 11, 31);
    const priceInfo = calculatePrice(pkg);
    const entryData = {
      username,
      aliasNotes: nickname,
      password,
      package: pkg,
      packageName: pkg === "premium" ? "Premium (€120)" : "Basic (€100)",
      owner: createdBy,
      createdAt: new Date().toISOString(),
      validUntil: endDate.toISOString(),
      status,
      price: priceInfo.proratedPrice,
    };

    try {
      if (editId) {
        const { data, error } = await supabase
          .from("entries")
          .update(entryData)
          .eq("id", editId)
          .select()
          .single();
        if (error) throw error;
        setEntries((prev) => prev.map((entry) => (entry.id === editId ? data : entry)));
        showSnackbar("Eintrag erfolgreich aktualisiert!");
      } else {
        const { data, error } = await supabase
          .from("entries")
          .insert([entryData])
          .select()
          .single();
        if (error) throw error;
        setEntries((prev) => [...prev, data]);
        showSnackbar("Eintrag erfolgreich erstellt!");
      }
      setOpenModal(false);
      setEditId(null);
      setFormData({ username: "", nickname: "", password: "", package: "premium", createdBy: loggedInUser, status: "active" });
    } catch (error) {
      handleError(error, showSnackbar);
    }
  }, [formData, editId, loggedInUser, setEntries, showSnackbar]);

  // Eintrag löschen
  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
        try {
          const { error } = await supabase.from("entries").delete().eq("id", id);
          if (error) throw error;
          setEntries((prev) => prev.filter((entry) => entry.id !== id));
          showSnackbar("Eintrag erfolgreich gelöscht!");
        } catch (error) {
          handleError(error, showSnackbar);
        }
      }
    },
    [setEntries, showSnackbar]
  );

  // Eintrag bearbeiten
  const handleEdit = (entry) => {
    setFormData({
      username: entry.username,
      nickname: entry.aliasNotes || "",
      password: entry.password || "",
      package: entry.package || "premium",
      createdBy: entry.owner,
      status: entry.status.toLowerCase(),
    });
    setEditId(entry.id);
    setOpenModal(true);
  };

  // Einträge abrufen
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { data, error } = await supabase.from("entries").select("*");
        if (error) throw error;
        setEntries(data);
      } catch (error) {
        handleError(error, showSnackbar);
      }
    };
    fetchEntries();
  }, [setEntries, showSnackbar]);

  return (
    <div className="bg-gray-50 p-6">
      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center justify-between">
        <div className="flex space-x-2 mb-2 md:mb-0">
          <button
            onClick={() => {
              setFormData({ username: "", nickname: "", password: "", package: "premium", createdBy: loggedInUser, status: "active" });
              setEditId(null);
              setOpenModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> Neuer Eintrag
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="pending">Ausstehend</option>
              <option value="expired">Abgelaufen</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-3 text-gray-400 pointer-events-none"></i>
          </div>
          <div className="relative">
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Pakete</option>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-3 text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzername</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spitzname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ersteller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gültigkeit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => {
                const daysRemaining = Math.ceil((new Date(entry.validUntil) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => alert(`Details: ${JSON.stringify(entry, null, 2)}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{entry.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{entry.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.aliasNotes || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`${
                          entry.package === "premium" ? "package-premium bg-yellow-50 text-yellow-800" : "package-basic bg-green-50 text-green-800"
                        } px-3 py-1 rounded-full text-sm font-medium`}
                      >
                        {entry.packageName || (entry.package === "premium" ? "Premium (€120)" : "Basic (€100)")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                          {entry.owner.charAt(0).toUpperCase()}
                        </div>
                        {entry.owner}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(entry.createdAt)} - {formatDate(entry.validUntil)}
                      </div>
                      <div className="text-sm text-gray-500">Noch {daysRemaining > 0 ? daysRemaining : 0} Tage</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`${
                          entry.status.toLowerCase() === "active"
                            ? "status-active"
                            : entry.status.toLowerCase() === "pending"
                            ? "status-pending"
                            : "status-expired"
                        } px-2 py-1 text-xs font-medium rounded-full`}
                      >
                        {entry.status === "active" ? "Aktiv" : entry.status === "pending" ? "Ausstehend" : "Abgelaufen"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(entry)} className="text-yellow-600 hover:text-yellow-900">
                          <i className="fas fa-edit"></i>
                        </button>
                        {role === "Admin" && (
                          <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-900">
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="modal fixed z-50 inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="modal-content bg-white p-6 rounded-lg w-full max-w-md">
            <span onClick={() => setOpenModal(false)} className="close float-right text-2xl font-bold text-gray-500 cursor-pointer">
              &times;
            </span>
            <h2 className="text-xl font-bold mb-4">{editId ? "Eintrag bearbeiten" : "Neuer Eintrag"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Benutzername *
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                  Spitzname
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Passwort *
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="package" className="block text-sm font-medium text-gray-700">
                    Paket *
                  </label>
                  <select
                    id="package"
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="premium">Premium (€120/Jahr)</option>
                    <option value="basic">Basic (€100/Jahr)</option>
                  </select>
                </div>
                {role === "Admin" && (
                  <div>
                    <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700">
                      Erstellt von *
                    </label>
                    <input
                      type="text"
                      id="createdBy"
                      value={formData.createdBy}
                      onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Aktiv</option>
                  <option value="pending">Ausstehend</option>
                  <option value="expired">Abgelaufen</option>
                </select>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preisberechnung</h3>
                <p className="text-sm text-gray-600">
                  Preis bis 31.12.{new Date().getFullYear()}: €{calculatePrice(formData.package).proratedPrice} (
                  {calculatePrice(formData.package).daysRemaining} Tage)
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryList;
