// src/pages/AdminDashboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for programmatic navigation

import DashboardLayout from '@/components/layout/DashboardLayout';
import SchoolsTab from "../../components/features/admin/SchoolsTab";
import PlayersTab from "../../components/features/admin/PlayersTab";
// TournamentsTab will now primarily link to the dedicated TournamentListPage
// If TournamentsTab *only* shows a subset or a summary, it can stay.
// For now, let's assume TournamentListPage is the main place for tournaments.
import TournamentsTab from "../../components/features/admin/TournamentsTab"; // Keeping it if it serves a distinct purpose
import StatsTab from "../../components/features/admin/StatsTab";
import TournamentsList from "../../components/features/tournament/TournamentsList";

// Removed AddTournamentModal import as we now use a dedicated TournamentCreate page.
// import AddTournamentModal from "../components/AdminDashboard/AddTournamentModal";

export default function AdminDashboard() {
  // --- STATE ---
  const [schools, setSchools] = useState([]);
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]); // Keep for stats if needed, or if TournamentsTab has a summary
  const [view, setView] = useState("Schools"); // Default view
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

  // Tournament modal state removed as we use a dedicated page for creation now
  // const [addTournamentOpen, setAddTournamentOpen] = useState(false);

  // Bulk deletes & filters
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

  const navigate = useNavigate(); // Initialize useNavigate

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErr("");
      try {
        // Fetch schools & players (for schools/players/stats)
        // Ensure user.role is checked robustly before using it in conditional logic
        if (["Schools", "Players", "Stats"].includes(view)) {
          const [sRes, pRes] = await Promise.all([
            axios.get("http://localhost:5000/api/schools", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(
              // Conditionally add school_id filter based on user role and selection
              `http://localhost:5000/api/players${
                user?.role === "super_admin" && selectedSchoolId
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
        // Fetch tournaments (for tournaments/stats) - Keeping this for TournamentsTab or StatsTab summary
        if (["Tournaments", "Stats"].includes(view)) {
           // We are fetching all tournaments here. If TournamentsTab in AdminDashboard only shows a summary, this is fine.
           // However, the main list is now handled by TournamentListPage.
          await reloadTournaments();
        }
        setSelectedPlayerIds([]);
      } catch (e) {
        // Log the full error for better debugging
        console.error("Error fetching admin dashboard data:", e);
        setErr(e.response?.data?.message || "Error loading data.");
      } finally {
         setLoading(false); // Ensure loading is set to false in finally
      }
    };
    if (token) { // Only fetch data if a token exists
      fetchData();
    } else {
        setLoading(false);
        setErr("Authentication token missing. Please log in.");
        navigate('/login'); // Redirect to login if token is missing
    }
    // eslint-disable-next-line
  }, [view, token, selectedSchoolId, user?.role, navigate]); // Add navigate to dependency array

  // --- RELOAD HELPERS ---
  const reloadSchools = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/schools", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(res.data.schools || []);
    } catch (e) {
      console.error("Error reloading schools:", e);
      setErr("Error reloading schools.");
    }
  };

  const reloadPlayers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/players${
          user?.role === "super_admin" && selectedSchoolId
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
    } catch (e) {
      console.error("Error reloading players:", e);
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
    } catch (e) {
      console.error("Error loading tournaments:", e);
      setErr("Error loading tournaments.");
    }
  };

  // --- DELETE HANDLERS ---
  const handleDeleteSchool = async (id) => {
    // Replaced window.confirm with a more robust custom modal/dialog in a real app
    if (!window.confirm("Delete this school? This action is irreversible.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/schools/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      reloadSchools();
    } catch (e) {
      console.error("Delete school failed:", e);
      alert(e.response?.data?.message || "Delete failed.");
    }
  };
  const handleDeletePlayer = async (id) => {
    // Replaced window.confirm with a more robust custom modal/dialog in a real app
    if (!window.confirm("Delete this player? This action is irreversible.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/players/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      reloadPlayers();
    } catch (e) {
      console.error("Delete player failed:", e);
      alert(e.response?.data?.message || "Delete failed.");
    }
  };
  const handleBulkDeletePlayers = async () => {
    if (
      selectedPlayerIds.length === 0 ||
      !window.confirm(`Delete ${selectedPlayerIds.length} selected players? This action is irreversible.`)
    )
      return;
    try {
      await axios.post(
        "http://localhost:5000/api/players/bulk-delete",
        { ids: selectedPlayerIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      reloadPlayers();
    } catch (e) {
      console.error("Bulk delete failed:", e);
      alert(e.response?.data?.message || "Bulk delete failed.");
    }
  };

  // --- SIDEBAR NAVIGATION ---
  const sidebarLinks = [
    { label: "Schools", icon: "🏫", onClick: () => setView("Schools"), active: view === "Schools" },
    { label: "Players", icon: "🧑‍🎓", onClick: () => setView("Players"), active: view === "Players" },
    // Changed Tournaments link to navigate to the dedicated TournamentsListPage
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
        window.location.href = "/login"; // Full page reload to clear state
      }}
    >
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-3xl font-extrabold text-athletiq-navy mb-2">
          Super Admin Dashboard
        </h1>
        {err && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">{err}</div>}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="text-athletiq-blue text-lg">Loading dashboard data...</div>
          </div>
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
                  loading, // Pass loading state to tabs if they need to show their own loaders
                  err,     // Pass error state
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
  <TournamentsList user={user} token={token} />
)}

            {view === "Stats" && <StatsTab stats={stats} />}
          </>
        )}
      </div>
      {/* AddTournamentModal and other modals are now likely managed elsewhere or are separate pages/components */}
      {/* If AddTournamentModal is truly a modal and not the wizard, it needs to be imported and managed here.
          However, based on our previous conversation, TournamentCreate.jsx is the wizard. */}
      {/* Example of how to structure a modal if it were still needed:
      <AddSchoolModal
        open={addSchoolOpen}
        onClose={() => setAddSchoolOpen(false)}
        onAdded={reloadSchools}
      /> */}
    </DashboardLayout>
  );
}
