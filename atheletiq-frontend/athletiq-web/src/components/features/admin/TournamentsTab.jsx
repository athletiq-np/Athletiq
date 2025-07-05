// src/components/AdminDashboard/TournamentsTab.jsx

import React, { useState, useEffect } from "react";
import ViewTournamentModal from "@features/tournament/ViewTournamentModal";

export default function TournamentsTab({ tournaments = [] }) {
  const [searchText, setSearchText] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [viewTournament, setViewTournament] = useState(null);

  // Filter tournaments
  useEffect(() => {
    const filteredList = tournaments.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesSport = selectedSport ? t.sports.includes(selectedSport) : true;
      return matchesSearch && matchesSport;
    });

    setFiltered(filteredList);
  }, [tournaments, searchText, selectedSport]);

  const allSports = Array.from(new Set(tournaments.flatMap((t) => t.sports)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-athletiq-navy">🏆 Tournaments</h2>

        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by name..."
            className="border rounded px-4 py-2 text-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            className="border rounded px-4 py-2 text-sm"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            <option value="">All Sports</option>
            {allSports.map((sport) => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 self-center">{filtered.length} shown</span>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tournament) => (
          <div
            key={tournament.id}
            onClick={() => setViewTournament(tournament)}
            className="bg-white shadow-md rounded-xl p-4 cursor-pointer hover:shadow-lg transition border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-athletiq-blue text-lg">{tournament.name}</h3>
              <span className="text-xs capitalize px-2 py-1 bg-athletiq-green text-white rounded">
                {tournament.status || "upcoming"}
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>📍 Location:</strong> {tournament.location || "N/A"}</p>
              <p><strong>🏅 Sports:</strong> {tournament.sports?.join(", ")}</p>
              <p><strong>🗓 Start:</strong> {tournament.start_date?.slice(0, 10) || "N/A"}</p>
              <p><strong>🏁 End:</strong> {tournament.end_date?.slice(0, 10) || "N/A"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      <ViewTournamentModal
        open={!!viewTournament}
        tournament={viewTournament}
        onClose={() => setViewTournament(null)}
      />
    </div>
  );
}
