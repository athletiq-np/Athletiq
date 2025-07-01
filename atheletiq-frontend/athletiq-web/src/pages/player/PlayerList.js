import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function PlayerList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await API.get("/players");
        setPlayers(res.data.players);
      } catch (e) {
        setError("Failed to load players");
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  if (loading) return <div className="p-6">Loading players...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen p-6 bg-blue-50">
      <h1 className="text-2xl font-bold mb-4">Players</h1>
      {players.length === 0 ? (
        <p>No players registered yet.</p>
      ) : (
        <ul className="space-y-3">
          {players.map((player) => (
            <li
              key={player.id}
              className="bg-white p-4 rounded shadow flex items-center cursor-pointer"
              onClick={() => navigate(`/player/${player.id}`)}
            >
              <img
                src={player.photo_url ? `/uploads/${player.photo_url}` : "/default-avatar.png"}
                alt={player.full_name}
                className="w-12 h-12 rounded-full mr-4 object-cover"
              />
              <div>
                <div className="font-semibold">{player.full_name}</div>
                <div className="text-sm text-gray-600">
                  DOB: {new Date(player.dob).toLocaleDateString()} | Gender: {player.gender}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
