// src/api/matchApi.js
import apiClient from './apiClient';

// Fetch matches for a specific tournament
export async function fetchMatches(tournamentId, token) {
  const res = await apiClient.get(`/matches/tournament/${tournamentId}`);
  return res.data;
}

// Create match
export async function createMatch(data, token) {
  const res = await apiClient.post('/matches', data);
  return res.data;
}

// Update match score/results
export async function updateMatch(id, data, token) {
  const res = await apiClient.put(`/matches/${id}`, data);
  return res.data;
}
