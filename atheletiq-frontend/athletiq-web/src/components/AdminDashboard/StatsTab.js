// src/components/AdminDashboard/StatsTab.js
import React from "react";

export default function StatsTab({ stats }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-athletiq-navy mb-4">Platform Stats</h2>
      <div className="flex gap-8">
        <div className="bg-athletiq-blue px-6 py-4 rounded text-center shadow text-white">
          <div className="text-3xl font-bold">{stats.schools}</div>
          <div>Schools</div>
        </div>
        <div className="bg-athletiq-green px-6 py-4 rounded text-center shadow text-white">
          <div className="text-3xl font-bold">{stats.players}</div>
          <div>Players</div>
        </div>
        <div className="bg-athletiq-blue px-6 py-4 rounded text-center shadow text-white">
          <div className="text-3xl font-bold">{stats.tournaments}</div>
          <div>Tournaments</div>
        </div>
      </div>
    </div>
  );
}
