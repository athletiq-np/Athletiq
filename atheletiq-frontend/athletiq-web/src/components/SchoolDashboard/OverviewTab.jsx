// src/components/SchoolDashboard/OverviewTab.jsx

import React from "react";

/**
 * OverviewTab
 * Props:
 * - school: school object
 * - players: array of players
 * - tournaments: array of tournaments
 */
export default function OverviewTab({ school, players, tournaments }) {
  if (!school) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-white rounded shadow px-6 py-5">
        <h2 className="text-lg font-semibold text-athletiq-navy">
          Welcome, {school.name}
        </h2>
        <p className="text-sm text-gray-600">
          School Code: <strong>{school.code}</strong>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Province: {school.province} | District: {school.district}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-100 text-blue-900 rounded shadow p-5">
          <h3 className="text-sm font-medium">Registered Players</h3>
          <p className="text-2xl font-bold">{players.length}</p>
        </div>

        <div className="bg-green-100 text-green-900 rounded shadow p-5">
          <h3 className="text-sm font-medium">Tournaments Participated</h3>
          <p className="text-2xl font-bold">{tournaments.length}</p>
        </div>

        <div className="bg-yellow-100 text-yellow-900 rounded shadow p-5">
          <h3 className="text-sm font-medium">Pending Verifications</h3>
          <p className="text-2xl font-bold">
            {
              players.filter((p) => p.status !== "verified").length
            }
          </p>
        </div>
      </div>
    </div>
  );
}
