// src/components/SchoolDashboard/TournamentModal.jsx

import React from "react";

export default function TournamentModal({ open, tournament, onClose }) {
  if (!open || !tournament) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-athletiq-blue hover:text-red-500 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>

        {/* Tournament Info */}
        <h2 className="text-2xl font-bold text-athletiq-navy mb-4">{tournament.name}</h2>

        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>📍 Location:</strong> {tournament.location}</p>
          <p><strong>🏅 Sports:</strong> {tournament.sports?.join(", ") || "N/A"}</p>
          <p><strong>🗓 Date:</strong> {tournament.start_date?.slice(0, 10)} → {tournament.end_date?.slice(0, 10)}</p>
          <p><strong>🔒 Level:</strong> {tournament.level || "N/A"}</p>
          <p><strong>📊 Status:</strong> <span className="capitalize">{tournament.status || "upcoming"}</span></p>
          <p><strong>📝 Description:</strong> {tournament.description || "No description available."}</p>
        </div>
      </div>
    </div>
  );
}
