// ✅ Set correct API base URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * Fetch all tournaments
 */
export async function fetchTournaments(token) {
  const res = await fetch(`${API_URL}/tournaments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch tournaments");
  return res.json();
}

/**
 * Create a new tournament
 */
export async function createTournament(data, token) {
  const res = await fetch(`${API_URL}/tournaments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("Failed to create tournament:\n" + errorText);
  }

  return res.json();
}
