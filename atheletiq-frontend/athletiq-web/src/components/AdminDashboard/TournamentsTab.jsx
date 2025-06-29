// src/pages/TournamentsTab.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

export default function TournamentsTab({ tournaments = [], onAdd }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-athletiq-navy">
          🏆 Manage Tournaments
        </h2>
        <Button
          className="bg-athletiq-green text-white px-4 py-2 rounded-lg hover:bg-green-600"
          onClick={onAdd}
        >
          + Create New Tournament
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-200 p-4 border border-athletiq-blue/10 cursor-pointer hover:scale-[1.02]"
            onClick={() => navigate(`/admin/tournament/${tournament.id}`)}
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={tournament.logo_url || "/logo-placeholder.png"}
                alt={tournament.name}
                className="w-14 h-14 object-contain rounded-full border border-athletiq-cream"
              />
              <div>
                <h3 className="text-lg font-bold text-athletiq-navy">
                  {tournament.name || "Unnamed"}
                </h3>
                <p className="text-sm text-athletiq-blue">
                  {tournament.location || "Unknown location"}
                  {tournament.start_date && tournament.end_date && (
                    <span className="block text-xs text-athletiq-navy/80">
                      {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="text-athletiq-blue border-athletiq-blue"
              >
                Manage
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
