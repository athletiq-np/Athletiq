// src/pages/admin/AdminDashboard.jsx

import React, { useEffect, useState } from 'react';
import {
  FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaPlus, FaSchool, FaTrophy,
  FaChartLine, FaCogs, FaUsers, FaGraduationCap, FaHome
} from 'react-icons/fa';
import { MdPending } from 'react-icons/md';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

// Import tab components
import PlayersTab from '@features/admin/PlayersTab';
import SchoolsTab from '@features/admin/SchoolsTab';
import TournamentsTab from '@features/admin/TournamentsTab';
import StatsTab from '@features/admin/StatsTab';

/**
 * 🧠 ATHLETIQ - Admin Dashboard Page
 * - Shows summary stats (players, schools, pending verifications, missing docs)
 * - Multiple tabs for different admin functions
 * - All data is fetched with authentication (cookie-based)
 * - Tab-based navigation for better UX
 */
export default function AdminDashboard() {
  const { user } = useUserStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';

  // Local state for summary and data
  const [summary, setSummary] = useState({
    registeredPlayers: 0,
    schools: 0,
    pendingVerifications: 0,
    missingDocs: 0,
    tournaments: 0,
    activeTournaments: 0,
  });
  const [players, setPlayers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [summaryRes, playersRes, schoolsRes, tournamentsRes] = await Promise.all([
          apiClient.get('/admin/dashboard-stats'),
          apiClient.get('/admin/players?limit=50&page=1'),
          apiClient.get('/admin/schools?limit=50&page=1'),
          apiClient.get('/admin/tournaments?limit=50&page=1'),
        ]);
        
        // Map the backend response to match our state structure
        const stats = summaryRes.data.data || summaryRes.data;
        setSummary({
          registeredPlayers: stats.playerCount || stats.players?.length || 0,
          schools: stats.schoolCount || stats.schools?.length || 0,
          pendingVerifications: stats.pendingVerifications || 0,
          missingDocs: stats.missingDocs || 0,
          tournaments: stats.tournamentCount || tournamentsRes.data?.pagination?.totalCount || 0,
          activeTournaments: tournamentsRes.data?.data?.filter(t => t.status === 'active').length || 0,
        });
        
        setPlayers(playersRes.data?.data || stats.players || []);
        setSchools(schoolsRes.data?.data || stats.schools || []);
        setTournaments(tournamentsRes.data?.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values on error
        setSummary({
          registeredPlayers: 0,
          schools: 0,
          pendingVerifications: 0,
          missingDocs: 0,
          tournaments: 0,
          activeTournaments: 0,
        });
        setPlayers([]);
        setSchools([]);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Function to refetch data when needed
  const refetchData = () => {
    setLoading(true);
    // Re-run the data fetching
    window.location.reload(); // Simple solution, can be optimized
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaHome },
    { id: 'players', label: 'Players', icon: FaUserGraduate },
    { id: 'schools', label: 'Schools', icon: FaSchool },
    { id: 'tournaments', label: 'Tournaments', icon: FaTrophy },
    { id: 'stats', label: 'Statistics', icon: FaChartLine },
  ];

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
            <div className="flex items-center gap-4">
              <img src={athletiqLogo} alt="ATHLETIQ Logo" className="w-28 h-auto" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-athletiq-navy">Admin Dashboard</h1>
                <div className="text-sm text-gray-500">{user?.email} ({user?.role})</div>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="inline-flex items-center bg-athletiq-green text-white font-bold rounded-lg px-4 py-2 text-sm shadow hover:bg-green-700 transition">
                <FaPlus className="mr-2" /> Add Player
              </button>
              <button className="inline-flex items-center bg-athletiq-navy text-white font-bold rounded-lg px-4 py-2 text-sm shadow hover:bg-navy-700 transition">
                <FaPlus className="mr-2" /> Add School
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-athletiq-green text-athletiq-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading dashboard data...</div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <SummaryCard
                    icon={<FaUserGraduate className="text-athletiq-green text-2xl" />}
                    label="Registered Players"
                    value={summary.registeredPlayers}
                    bg="bg-white"
                  />
                  <SummaryCard
                    icon={<FaSchool className="text-athletiq-navy text-2xl" />}
                    label="Schools"
                    value={summary.schools}
                    bg="bg-white"
                  />
                  <SummaryCard
                    icon={<FaTrophy className="text-yellow-600 text-2xl" />}
                    label="Tournaments"
                    value={summary.tournaments}
                    bg="bg-white"
                  />
                  <SummaryCard
                    icon={<FaCheckCircle className="text-green-600 text-2xl" />}
                    label="Active Tournaments"
                    value={summary.activeTournaments}
                    bg="bg-green-50"
                  />
                  <SummaryCard
                    icon={<MdPending className="text-yellow-600 text-2xl" />}
                    label="Pending Verifications"
                    value={summary.pendingVerifications}
                    bg="bg-yellow-50"
                  />
                  <SummaryCard
                    icon={<FaExclamationCircle className="text-red-600 text-2xl" />}
                    label="Missing Docs"
                    value={summary.missingDocs}
                    bg="bg-red-50"
                  />
                </div>

                {/* Recent Players Table */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-athletiq-navy">Recent Player Registrations</h2>
                    <button 
                      onClick={() => setActiveTab('players')}
                      className="text-athletiq-green font-semibold hover:underline"
                    >
                      View All Players &rarr;
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-athletiq-navy text-white">
                          <th className="p-3 text-left font-semibold">Name</th>
                          <th className="p-3 text-left font-semibold">DOB</th>
                          <th className="p-3 text-left font-semibold">School</th>
                          <th className="p-3 text-left font-semibold">Status</th>
                          <th className="p-3 text-left font-semibold">Profile</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-400">
                              No recent player registrations.
                            </td>
                          </tr>
                        ) : (
                          players.slice(0, 10).map((player, index) => (
                            <tr key={player.id || index} className="border-b last:border-b-0 hover:bg-athletiq-green/5">
                              <td className="p-3 font-medium">{player.full_name || player.name || 'N/A'}</td>
                              <td className="p-3 text-gray-600">{player.dob || 'N/A'}</td>
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-medium">{player.school_name || 'N/A'}</span>
                                  {player.school_code && (
                                    <span className="text-xs text-gray-400">({player.school_code})</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                {player.is_active || player.status === 'active' ? (
                                  <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs">
                                    <FaCheckCircle className="mr-1" /> Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full text-xs">
                                    <MdPending className="mr-1" /> Pending
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                {player.profile_photo_url ? (
                                  <img 
                                    src={`/uploads/${player.profile_photo_url}`} 
                                    alt="Profile" 
                                    className="w-8 h-8 rounded-full object-cover mx-auto" 
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                                    <FaUserGraduate className="text-gray-400 text-xs" />
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <PlayersTab 
                players={players} 
                schools={schools}
                user={user}
                refetchData={refetchData}
              />
            )}

            {/* Schools Tab */}
            {activeTab === 'schools' && (
              <SchoolsTab 
                schools={schools} 
                refetchData={refetchData}
              />
            )}

            {/* Tournaments Tab */}
            {activeTab === 'tournaments' && (
              <TournamentsTab 
                tournaments={tournaments} 
                refetchData={refetchData}
              />
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <StatsTab 
                summary={summary}
                players={players}
                schools={schools}
                tournaments={tournaments}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} ATHLETIQ • Track the Rise. Train the Future.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Small stat card for dashboard summary
function SummaryCard({ icon, label, value, bg }) {
  return (
    <div className={`rounded-xl shadow-md flex flex-col items-center justify-center p-6 ${bg} hover:shadow-lg transition-shadow`}>
      <div className="mb-3">{icon}</div>
      <div className="text-2xl font-extrabold text-athletiq-navy">{value ?? '-'}</div>
      <div className="text-gray-600 font-medium text-center text-sm">{label}</div>
    </div>
  );
}
