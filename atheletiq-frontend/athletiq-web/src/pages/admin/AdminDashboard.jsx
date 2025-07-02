// src/pages/admin/AdminDashboard.jsx

import React, { useEffect, useState } from 'react';
import {
  FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaPlus, FaSchool,
} from 'react-icons/fa';
import { MdPending } from 'react-icons/md';
import { Link } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

/**
 * 🧠 ATHLETIQ - Admin Dashboard Page
 * - Shows summary stats (players, schools, pending verifications, missing docs)
 * - Shows recent player registrations in a styled table
 * - All data is fetched with authentication (cookie-based)
 * - Onboarding notes for new developers are included
 */
export default function AdminDashboard() {
  const { user } = useUserStore();

  // Local state for summary and players
  const [summary, setSummary] = useState({
    registeredPlayers: 0,
    schools: 0,
    pendingVerifications: 0,
    missingDocs: 0,
  });
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [summaryRes, playersRes] = await Promise.all([
          apiClient.get('/admin/dashboard/summary'),
          apiClient.get('/players?limit=10&page=1'),
        ]);
        setSummary(summaryRes.data);
        setPlayers(playersRes.data.players);
      } catch (error) {
        // Optionally add error UI here
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-0 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-4">
          <img src={athletiqLogo} alt="ATHLETIQ Logo" className="w-32 h-auto" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-athletiq-navy">Admin Dashboard</h1>
            <div className="text-sm text-gray-500">{user?.email} ({user?.role})</div>
          </div>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link to="/admin/players/add" className="inline-flex items-center bg-athletiq-green text-white font-bold rounded-lg px-5 py-2 shadow hover:bg-green-700 transition">
            <FaPlus className="mr-2" /> Add Player
          </Link>
          <Link to="/admin/schools/add" className="inline-flex items-center bg-athletiq-navy text-white font-bold rounded-lg px-5 py-2 shadow hover:bg-navy-700 transition">
            <FaPlus className="mr-2" /> Add School
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
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
          <Link to="/admin/players" className="text-athletiq-green font-semibold hover:underline">
            View All Players &rarr;
          </Link>
        </div>
        {loading ? (
          <div className="py-10 text-center text-gray-400">Loading players...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-athletiq-navy text-white">
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">DOB</th>
                  <th className="p-2 font-semibold">School</th>
                  <th className="p-2 font-semibold">Status</th>
                  <th className="p-2 font-semibold">Profile</th>
                  <th className="p-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">
                      No recent player registrations.
                    </td>
                  </tr>
                ) : (
                  players.map((player) => (
                    <tr key={player.id} className="border-b last:border-b-0 hover:bg-athletiq-green/10">
                      <td className="p-2">{player.full_name}</td>
                      <td className="p-2">{player.dob}</td>
                      <td className="p-2">
                        {player.school_name} <span className="text-xs text-gray-400">({player.school_code})</span>
                      </td>
                      <td className="p-2">
                        {player.is_active
                          ? <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full"><FaCheckCircle className="mr-1" /> Active</span>
                          : <span className="inline-flex items-center text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full"><MdPending className="mr-1" /> Pending</span>}
                      </td>
                      <td className="p-2">
                        {player.profile_photo_url
                          ? <img src={`/uploads/${player.profile_photo_url}`} alt="Profile" className="w-8 h-8 rounded-full object-cover mx-auto" />
                          : <span className="text-gray-400 italic">No Photo</span>}
                      </td>
                      <td className="p-2">
                        <Link to={`/admin/players/${player.id}`} className="text-athletiq-navy font-medium hover:underline mr-2">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} ATHLETIQ • Track the Rise. Train the Future.
      </footer>
    </div>
  );
}

// Small stat card for dashboard summary
function SummaryCard({ icon, label, value, bg }) {
  return (
    <div className={`rounded-xl shadow-md flex flex-col items-center justify-center p-6 ${bg}`}>
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-extrabold text-athletiq-navy">{value ?? '-'}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
}
