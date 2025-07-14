// src/pages/admin/tournaments/TournamentListPage.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function TournamentListPage() {
  const [tournaments, setTournaments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    level: "",
    status: "",
  });

  const token = localStorage.getItem("token");

  // Fetch tournaments on mount
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTournaments(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch tournaments:", err);
    }
  };

  // Update filtered list
  useEffect(() => {
    let result = tournaments;

    if (filters.name) {
      result = result.filter(t => t.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.level) {
      result = result.filter(t => t.level?.toLowerCase() === filters.level.toLowerCase());
    }
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }

    setFiltered(result);
  }, [filters, tournaments]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🏆 Tournament List</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          name="name"
          placeholder="Search by Name"
          className="px-3 py-2 border rounded"
          value={filters.name}
          onChange={handleChange}
        />
        <select name="level" className="px-3 py-2 border rounded" value={filters.level} onChange={handleChange}>
          <option value="">All Levels</option>
          <option value="District">District</option>
          <option value="Province">Province</option>
          <option value="National">National</option>
        </select>
        <select name="status" className="px-3 py-2 border rounded" value={filters.status} onChange={handleChange}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full border-collapse bg-white shadow-md rounded">
        <thead>
          <tr className="bg-gray-100 text-left text-sm">
            <th className="p-3 border-b">🏷 Name</th>
            <th className="p-3 border-b">🎯 Level</th>
            <th className="p-3 border-b">📅 Start</th>
            <th className="p-3 border-b">📍 Status</th>
            <th className="p-3 border-b">⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.id} className="text-sm hover:bg-gray-50">
              <td className="p-3 border-b">{t.name}</td>
              <td className="p-3 border-b">{t.level || "-"}</td>
              <td className="p-3 border-b">{t.start_date || "-"}</td>
              <td className="p-3 border-b capitalize">{t.status}</td>
              <td className="p-3 border-b">
                <Link
                  to={`/admin/tournaments/${t.id}/setup`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-4 text-gray-500">
                No tournaments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
