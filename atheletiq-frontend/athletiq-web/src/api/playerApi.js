// src/api/playerApi.js

/**
 * All API calls related to players (registration, OCR, etc).
 * Uses the centralized apiClient that's configured with withCredentials: true
 * for cookie-based authentication.
 */

import apiClient from './apiClient';

// Register a new player (multipart/form-data)
export async function registerPlayer(formData, token) {
  const res = await apiClient.post('/players/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// Run OCR extraction on certificate only (returns extracted fields)
export async function extractCertificateOCR(certificateFile, token) {
  const formData = new FormData();
  formData.append('certificate', certificateFile);
  const res = await apiClient.post('/players/ocr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}
