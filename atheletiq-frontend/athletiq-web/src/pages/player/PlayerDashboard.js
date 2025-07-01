import React from "react";

export default function PlayerDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Player Dashboard</h1>
      <p>Welcome, {user.full_name || user.email}!</p>
      <p>Your role: <span className="font-semibold">{user.role}</span></p>
      {/* Add player-specific features here */}
    </div>
  );
}
