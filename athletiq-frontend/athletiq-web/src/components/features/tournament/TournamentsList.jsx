import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * TournamentsList Component
 * Props:
 * - user: logged-in user object
 * - token: JWT token for auth
 */
export default function TournamentsList({ user, token }) {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchTournaments();
    // eslint-disable-next-line
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTournaments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to load tournaments:", e);
      setErr("Could not fetch tournaments.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tournament?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/tournaments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTournaments();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Delete failed.");
    }
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-athletiq-navy">Tournaments</h2>
        <input
          type="text"
          placeholder="Search by name"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-md w-64"
        />
      </div>

      {err && <div className="text-red-500">{err}</div>}
      {loading ? (
        <div className="text-athletiq-blue">Loading tournaments...</div>
      ) : filteredTournaments.length === 0 ? (
        <div>No tournaments found.</div>
      ) : (
        <table className="w-full border text-sm bg-white shadow-sm rounded">
          <thead className="bg-athletiq-blue text-white">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Sport</th>
              <th className="text-left p-2">Level</th>
              <th className="text-left p-2">Start</th>
              <th className="text-left p-2">End</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTournaments.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.name || "-"}</td>
                <td className="p-2">
                  {Array.isArray(t.sports) ? t.sports.join(", ") : "-"}
                </td>
                <td className="p-2">{t.level || "-"}</td>
                <td className="p-2">{t.start_date || "-"}</td>
                <td className="p-2">{t.end_date || "-"}</td>
                <td className="p-2">
                  <button
                    className="text-red-500 hover:underline mr-2"
                    onClick={() => handleDelete(t.id)}
                  >
                    Delete
                  </button>
                  {/* Add edit/view buttons here if needed */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
