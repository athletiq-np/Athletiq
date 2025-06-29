import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

const PlayerDashboard = () => {
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/players/me")
      .then((res) => setPlayer(res.data.player))
      .catch((err) => setError("Failed to load profile: " + (err.response?.data?.message || err.message)));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (error) return <div>{error}</div>;
  if (!player) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Player Profile</h1>
        <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleLogout}>Logout</button>
      </div>
      <div className="bg-white rounded shadow p-6">
        <p><strong>Full Name:</strong> {player.full_name}</p>
        <p><strong>Date of Birth:</strong> {player.dob}</p>
        <p><strong>Gender:</strong> {player.gender}</p>
        <p><strong>Parent Contact:</strong> {player.parent_contact}</p>
        {/* Add more fields as needed */}
      </div>
    </div>
  );
};

export default PlayerDashboard;
