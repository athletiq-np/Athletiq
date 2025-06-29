// src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import SchoolsTab from "../components/AdminDashboard/SchoolsTab";
import PlayersTab from "../components/AdminDashboard/PlayersTab";
import TournamentsTab from "../components/AdminDashboard/TournamentsTab";
import StatsTab from "../components/AdminDashboard/StatsTab";
import AddTournamentModal from "../components/AdminDashboard/AddTournamentModal"; // Ensure path is correct!

export default function AdminDashboard() {
  // --- STATE ---
  const [schools, setSchools] = useState([]);
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [view, setView] = useState("Schools");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ schools: 0, players: 0, tournaments: 0 });
  const [err, setErr] = useState("");
  const [changePwdSchool, setChangePwdSchool] = useState(null);

  // Modals (schools)
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [bulkSchoolOpen, setBulkSchoolOpen] = useState(false);
  const [editSchool, setEditSchool] = useState(null);

  // Modals (players)
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);
  const [bulkPlayerOpen, setBulkPlayerOpen] = useState(false);

  // Tournament modal
  const [addTournamentOpen, setAddTournamentOpen] = useState(false);

  // Bulk deletes & filters
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErr("");
      try {
        // Fetch schools & players (for schools/players/stats)
        if (["Schools", "Players", "Stats"].includes(view)) {
          const [sRes, pRes] = await Promise.all([
            axios.get("http://localhost:5000/api/schools", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(
              `http://localhost:5000/api/players${
                user.role === "super_admin" && selectedSchoolId
                  ? `?school_id=${selectedSchoolId}`
                  : ""
              }`,
              { headers: { Authorization: `Bearer ${token}` } }
            ),
          ]);
          setSchools(sRes.data.schools || []);
          setPlayers(pRes.data.players || []);
          setStats((prev) => ({
            ...prev,
            schools: (sRes.data.schools || []).length,
            players: (pRes.data.players || []).length,
          }));
        }
        // Fetch tournaments (for tournaments/stats)
        if (["Tournaments", "Stats"].includes(view)) {
          await reloadTournaments();
        }
        setSelectedPlayerIds([]);
      } catch (e) {
        setErr(e.response?.data?.message || "Error loading data.");
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [view, token, selectedSchoolId, user.role]);

  // --- RELOAD HELPERS ---
  const reloadSchools = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/schools", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(res.data.schools || []);
    } catch {
      setErr("Error reloading schools.");
    }
  };

  const reloadPlayers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/players${
          user.role === "super_admin" && selectedSchoolId
            ? `?school_id=${selectedSchoolId}`
            : ""
        }`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlayers(res.data.players || []);
      setSelectedPlayerIds([]);
      setStats((prev) => ({
        ...prev,
        players: res.data.players?.length || prev.players,
      }));
    } catch {
      setErr("Error reloading players.");
    }
  };

  const reloadTournaments = async () => {
    try {
      const tRes = await axios.get("http://localhost:5000/api/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(tRes.data) ? tRes.data : [];
      setTournaments(list);
      setStats((prev) => ({ ...prev, tournaments: list.length }));
    } catch {
      setErr("Error loading tournaments.");
    }
  };

  // --- DELETE HANDLERS ---
  const handleDeleteSchool = async (id) => {
    if (!window.confirm("Delete this school?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/schools/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      reloadSchools();
    } catch {
      alert("Delete failed.");
    }
  };
  const handleDeletePlayer = async (id) => {
    if (!window.confirm("Delete this player?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/players/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      reloadPlayers();
    } catch {
      alert("Delete failed.");
    }
  };
  const handleBulkDeletePlayers = async () => {
    if (
      selectedPlayerIds.length === 0 ||
      !window.confirm("Delete selected players?")
    )
      return;
    try {
      await axios.post(
        "http://localhost:5000/api/players/bulk-delete",
        { ids: selectedPlayerIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      reloadPlayers();
    } catch {
      alert("Bulk delete failed.");
    }
  };

  // --- SIDEBAR NAVIGATION ---
  const sidebarLinks = [
    { label: "Schools", icon: "🏫", onClick: () => setView("Schools"), active: view === "Schools" },
    { label: "Players", icon: "🧑‍🎓", onClick: () => setView("Players"), active: view === "Players" },
    { label: "Tournaments", icon: "🏆", onClick: () => setView("Tournaments"), active: view === "Tournaments" },
    { label: "Platform Stats", icon: "📊", onClick: () => setView("Stats"), active: view === "Stats" },
  ];

  // --- PLAYER CHECKBOX LOGIC ---
  const togglePlayerSelection = (id) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const handleSelectAllPlayers = (e) => {
    if (e.target.checked) {
      setSelectedPlayerIds(players.map((p) => p.id));
    } else {
      setSelectedPlayerIds([]);
    }
  };

  // --- RENDER ---
  return (
    <DashboardLayout
      user={user}
      sidebarLinks={sidebarLinks}
      onLogout={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }}
    >
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-3xl font-extrabold text-athletiq-navy mb-2">
          Super Admin Dashboard
        </h1>
        {err && <div className="text-red-500 mb-4">{err}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {view === "Schools" && (
              <SchoolsTab
                {...{
                  schools,
                  addSchoolOpen,
                  setAddSchoolOpen,
                  bulkSchoolOpen,
                  setBulkSchoolOpen,
                  editSchool,
                  setEditSchool,
                  changePwdSchool,
                  setChangePwdSchool,
                  reloadSchools,
                  handleDeleteSchool,
                  loading,
                  err,
                }}
              />
            )}
            {view === "Players" && (
              <PlayersTab
                {...{
                  players,
                  schools,
                  user,
                  selectedSchoolId,
                  setSelectedSchoolId,
                  addPlayerOpen,
                  setAddPlayerOpen,
                  bulkPlayerOpen,
                  setBulkPlayerOpen,
                  editPlayer,
                  setEditPlayer,
                  viewPlayer,
                  setViewPlayer,
                  selectedPlayerIds,
                  setSelectedPlayerIds,
                  handleDeletePlayer,
                  handleBulkDeletePlayers,
                  togglePlayerSelection,
                  handleSelectAllPlayers,
                  reloadPlayers,
                }}
              />
            )}
            {view === "Tournaments" && (
              <>
                <TournamentsTab
                  tournaments={tournaments}
                  user={user}
                  onAdd={() => setAddTournamentOpen(true)}
                  onAdded={reloadTournaments}
                />
                <AddTournamentModal
                  open={addTournamentOpen}
                  onClose={() => setAddTournamentOpen(false)}
                  user={user}
                  onAdded={() => {
                    setAddTournamentOpen(false);
                    reloadTournaments();
                  }}
                />
              </>
            )}
            {view === "Stats" && <StatsTab stats={stats} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
