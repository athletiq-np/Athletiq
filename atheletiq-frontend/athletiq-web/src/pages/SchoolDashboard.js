// src/pages/SchoolDashboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import EditSchoolModal from "../components/features/school/EditSchoolModal";
import AddPlayerModal from "../components/features/player/AddPlayerModal";
import EditPlayerModal from "../components/features/player/EditPlayerModal";
import ViewPlayerModal from "../components/features/player/ViewPlayerModal";

export default function SchoolDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [school, setSchool] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editSchoolOpen, setEditSchoolOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErr("");
      try {
        let schoolData = school;
        if (!school && user.role === "school_admin") {
          const schoolRes = await axios.get("http://localhost:5000/api/schools/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          schoolData = schoolRes.data.school;
          setSchool(schoolData);
        }
        const playersRes = await axios.get(
          `http://localhost:5000/api/players`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPlayers(playersRes.data.players || []);
      } catch (error) {
        setErr(error?.response?.data?.message || "Failed to load school or players.");
      }
      setLoading(false);
    }
    if (user.role === "school_admin" && token) fetchData();
    // eslint-disable-next-line
  }, [token]);

  const handleSchoolUpdated = (updatedSchool) => {
    setSchool(updatedSchool || school);
    setEditSchoolOpen(false);
  };

  const handlePlayerAdded = () => {
    axios
      .get(`http://localhost:5000/api/players`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setPlayers(res.data.players || []))
      .catch(() => {});
    setAddPlayerOpen(false);
  };

  const handlePlayerUpdated = () => {
    axios
      .get(`http://localhost:5000/api/players`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setPlayers(res.data.players || []))
      .catch(() => {});
    setEditPlayer(null);
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm("Delete this player?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/players/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (error) {
      alert("Delete failed.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (user.role !== "school_admin") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Unauthorized</h1>
        <p>You must be logged in as a school admin to access this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout school={school} user={user} onLogout={handleLogout}>
      <div className="flex flex-col gap-3 w-full">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-athletiq-blue text-white rounded-lg p-4 flex flex-col gap-1 shadow-md">
            <div className="font-bold text-lg">Registered Players</div>
            <div className="text-2xl">{players.length}</div>
          </div>
          <div className="bg-athletiq-blue text-white rounded-lg p-4 flex flex-col gap-1 shadow-md">
            <div className="font-bold text-lg">Tournaments Participated</div>
            <div className="text-2xl">2</div>
          </div>
          <div className="bg-athletiq-blue text-white rounded-lg p-4 flex flex-col gap-1 shadow-md">
            <div className="font-bold text-lg">Pending Verifications</div>
            <div className="text-2xl">5</div>
          </div>
          <div className="bg-athletiq-blue text-white rounded-lg p-4 flex flex-col gap-1 shadow-md">
            <div className="font-bold text-lg">Missing Docs</div>
            <div className="text-2xl">3</div>
          </div>
        </div>

        {/* Player Table + Add/Bulk Upload */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-athletiq-navy">Player Table</h2>
          <div className="flex gap-3">
            <button
              className="px-5 py-2 bg-white text-athletiq-navy border border-athletiq-navy rounded-lg font-semibold hover:bg-athletiq-cream transition"
              onClick={() => setAddPlayerOpen(true)}
            >
              Add Player
            </button>
            <button
              className="px-5 py-2 bg-athletiq-green text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Bulk Upload
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-athletiq-blue text-white">
                <th className="p-2 text-left">Player Name</th>
                <th className="p-2 text-left">DOB</th>
                <th className="p-2 text-left">Guardian Phone</th>
                <th className="p-2 text-left">Profile</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 && (
                <tr>
                  <td className="p-2" colSpan={5}>
                    No players found.
                  </td>
                </tr>
              )}
              {players.map((p) => (
                <tr key={p.id} className="border-b last:border-none">
                  <td className="p-2">{p.full_name}</td>
                  <td className="p-2">{p.dob}</td>
                  <td className="p-2">{p.guardian_phone || "-"}</td>
                  <td className="p-2 flex items-center gap-2">
                    <span className="inline-block bg-athletiq-gray text-white rounded-full h-6 w-6 flex items-center justify-center">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="7"/><circle cx="8" cy="6" r="2"/><path d="M4 12a4 4 0 018 0"/></svg>
                    </span>
                    <span className="inline-block bg-athletiq-green text-white rounded-full h-6 w-6 flex items-center justify-center">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect width="12" height="12" x="2" y="2" rx="2"/></svg>
                    </span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="bg-athletiq-blue text-white px-2 py-1 rounded hover:bg-athletiq-navy"
                      onClick={() => setEditPlayer(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                      onClick={() => handleDeletePlayer(p.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="bg-gray-200 text-athletiq-navy px-2 py-1 rounded hover:bg-gray-300"
                      onClick={() => setViewPlayer(p)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upload Notice */}
        <div className="bg-athletiq-green/10 rounded-lg p-3 mt-4 flex items-center text-athletiq-navy">
          <span className="mr-2 text-athletiq-blue font-bold">i</span>
          5 players need profile photos. Click here to upload.
        </div>
      </div>

      {/* Modals */}
      {editSchoolOpen && school && (
        <EditSchoolModal
          open={editSchoolOpen}
          school={school}
          onClose={() => setEditSchoolOpen(false)}
          onUpdated={handleSchoolUpdated}
        />
      )}
      {addPlayerOpen && (
        <AddPlayerModal
          open={addPlayerOpen}
          onClose={() => setAddPlayerOpen(false)}
          onAdded={handlePlayerAdded}
          schools={[school]}
        />
      )}
      {editPlayer && (
        <EditPlayerModal
          open={!!editPlayer}
          onClose={() => setEditPlayer(null)}
          player={editPlayer}
          schools={[school]}
          onUpdated={handlePlayerUpdated}
        />
      )}
      {viewPlayer && (
        <ViewPlayerModal
          open={!!viewPlayer}
          onClose={() => setViewPlayer(null)}
          player={viewPlayer}
          schools={[school]}
        />
      )}
    </DashboardLayout>
  );
}
