// src/components/tournament/TournamentList.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get("http://localhost:5000/api/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTournaments(res.data || []);
    } catch (error) {
      setErr(error?.response?.data?.error || "Failed to load tournaments");
    }
    setLoading(false);
  }

  function handleAddTournament() {
    navigate("/admin/tournaments/new");
  }

  function handleEdit(tournamentId) {
    navigate(`/admin/tournaments/${tournamentId}/setup`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow p-6 w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-athletiq-navy">Tournaments</h2>
        <button
          onClick={handleAddTournament}
          className="px-4 py-2 bg-athletiq-green text-white rounded hover:bg-green-700"
        >
          + Add Tournament
        </button>
      </div>

      {err && <div className="text-red-500 mb-2">{err}</div>}

      {loading ? (
        <div>Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div>No tournaments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-athletiq-blue text-white">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Sport(s)</th>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Start Date</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <motion.tr
                  key={t.id}
                  whileHover={{ scale: 1.01 }}
                  className="border-b last:border-none"
                >
                  <td className="p-2 font-semibold">{t.name}</td>
                  <td className="p-2">
                    {Array.isArray(t.sports)
                      ? t.sports.map((s) => s.name || s.id).join(", ")
                      : typeof t.sports === "string"
                      ? t.sports
                      : "-"}
                  </td>
                  <td className="p-2">{t.level}</td>
                  <td className="p-2">{t.start_date?.slice(0, 10)}</td>
                  <td className="p-2">{t.status || "draft"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEdit(t.id)}
                      className="bg-athletiq-blue text-white px-3 py-1 rounded hover:bg-athletiq-navy"
                    >
                      Manage
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
