// src/api/matchApi.js

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Fetch matches for a specific tournament
export async function fetchMatches(tournamentId, token) {
  const res = await fetch(`${API_URL}/matches/tournament/${tournamentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

// Create match
export async function createMatch(data, token) {
  const res = await fetch(`${API_URL}/matches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create match");
  return res.json();
}

// Update match score/results
export async function updateMatch(id, data, token) {
  const res = await fetch(`${API_URL}/matches/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update match");
  return res.json();
}
