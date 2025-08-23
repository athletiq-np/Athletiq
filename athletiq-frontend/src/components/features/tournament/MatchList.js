// src/components/MatchList.js

import React from "react";

const MatchList = ({ matches }) => (
  <div>
    <h2 className="text-xl font-bold mb-2">Matches</h2>
    <ul className="space-y-2">
      {matches.map((match) => (
        <li key={match.id} className="p-3 bg-white rounded shadow">
          <div className="font-semibold">{match.home_team_name} vs {match.away_team_name}</div>
          <div className="text-sm text-gray-500">
            {new Date(match.scheduled_at).toLocaleString()}
          </div>
          <div className="text-xs">Status: {match.status}</div>
        </li>
      ))}
    </ul>
  </div>
);

export default MatchList;
