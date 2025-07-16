// src/components/ViewTournamentModal.jsx

import React from "react";

export default function ViewTournamentModal({ open, onClose, tournament }) {
  if (!open || !tournament) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-athletiq-navy">{tournament.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{tournament.status || "Upcoming"}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">📍 Location: </span>
              {tournament.location || "N/A"}
            </div>
            <div>
              <span className="font-medium text-gray-700">🗓️ Start Date: </span>
              {tournament.start_date ? 
                (tournament.start_date instanceof Date ? 
                  tournament.start_date.toISOString().slice(0, 10) : 
                  tournament.start_date.slice(0, 10)) : "N/A"}
            </div>
            <div>
              <span className="font-medium text-gray-700">🏁 End Date: </span>
              {tournament.end_date ? 
                (tournament.end_date instanceof Date ? 
                  tournament.end_date.toISOString().slice(0, 10) : 
                  tournament.end_date.slice(0, 10)) : "N/A"}
            </div>
            <div>
              <span className="font-medium text-gray-700">🎯 Format: </span>
              {tournament.format || "N/A"}
            </div>
            <div className="col-span-full">
              <span className="font-medium text-gray-700">🏅 Sports: </span>
              <span>{tournament.sports?.join(", ") || "N/A"}</span>
            </div>
            {tournament.description && (
              <div className="col-span-full">
                <span className="font-medium text-gray-700">📝 Description: </span>
                <p className="text-gray-600 mt-1">{tournament.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
