// src/api/matchApi.js
import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

// Fetch matches for a specific tournament
export async function fetchMatches(tournamentId) {
  const res = await apiClient.get(API_ENDPOINTS.TOURNAMENTS.MATCHES(tournamentId));
  return res.data;
}

// Create match
export async function createMatch(data) {
  const res = await apiClient.post('/matches', data);
  return res.data;
}

// Update match score/results
export async function updateMatch(id, data) {
  const res = await apiClient.put(`/matches/${id}`, data);
  return res.data;
}
