// src/components/SchoolDashboard/PlayersTab.jsx

import React from "react";
import defaultAvatar from "@assets/default-avatar.png";

/**
 * PlayersTab: Shows all registered players of the school
 * Props:
 * - players: array of player objects
 */
export default function PlayersTab({ players = [] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-athletiq-navy">🎽 Registered Players</h2>

      {players.length === 0 ? (
        <p className="text-gray-500">No players registered yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="group border rounded-lg bg-white p-4 shadow hover:border-athletiq-blue hover:shadow-lg cursor-pointer transition-all"
              onClick={() => {
                // Handle click (e.g. open profile modal in future)
                console.log("Clicked:", player.full_name);
              }}
            >
              <div className="flex items-center gap-4">
                <img
                  src={player.photo_url || defaultAvatar}
                  alt="Player"
                  className="w-12 h-12 rounded-full object-cover border border-gray-300 group-hover:border-athletiq-blue"
                />
                <div>
                  <h3 className="text-md font-semibold text-athletiq-navy group-hover:text-athletiq-blue">
                    {player.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">{player.dob?.slice(0, 10)}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-700">
                <p>📞 {player.guardian_phone || "-"}</p>
                <p>Status: {player.status || "pending"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
