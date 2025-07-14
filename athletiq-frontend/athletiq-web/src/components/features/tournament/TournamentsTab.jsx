// src/components/SchoolDashboard/TournamentsTab.jsx

import React from "react";

/**
 * TournamentsTab: Lists tournaments associated with the school
 * Props:
 * - tournaments: array of tournament objects
 */
export default function TournamentsTab({ tournaments = [] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-athletiq-navy">🏆 Participated Tournaments</h2>

      {tournaments.length === 0 ? (
        <p className="text-gray-500">No tournaments available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="border rounded-lg bg-white p-4 shadow hover:shadow-md hover:border-athletiq-blue cursor-pointer transition-all"
              onClick={() => {
                // Handle click to view tournament details
                console.log("Clicked:", t.name);
              }}
            >
              <h3 className="text-lg font-semibold text-athletiq-navy mb-1">{t.name}</h3>
              <p className="text-sm text-gray-600">📍 {t.location}</p>
              <p className="text-sm text-gray-600">
                🏅 {Array.isArray(t.sports) ? t.sports.join(", ") : t.sports}
              </p>
              <p className="text-sm text-gray-600">
                📆 {t.start_date?.slice(0, 10)} – {t.end_date?.slice(0, 10)}
              </p>
              <p className="text-sm text-gray-600 capitalize">
                Status: <span className="font-medium">{t.status || "upcoming"}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
