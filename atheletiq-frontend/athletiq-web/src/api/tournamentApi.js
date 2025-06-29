// src/api/tournamentApi.js

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export async function fetchTournaments(token, organization_id) {
  const res = await fetch(`${API_URL}/tournaments?orgId=${organization_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch tournaments");
  return res.json();
}

export async function createTournament(data, token, organization_id) {
  const res = await fetch(`${API_URL}/tournaments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...data, organizer_id: organization_id }),
  });
  if (!res.ok) throw new Error("Failed to create tournament");
  return res.json();
}
