// src/api/playerApi.js

/**
 * All API calls related to players (registration, OCR, etc).
 * Uses fetch API. You can switch to axios if preferred.
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api/players';

// Register a new player (multipart/form-data)
export async function registerPlayer(formData, token) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return res.json();
}

// Run OCR extraction on certificate only (returns extracted fields)
export async function extractCertificateOCR(certificateFile, token) {
  const formData = new FormData();
  formData.append('certificate', certificateFile);
  const res = await fetch(`${API_BASE}/ocr`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return res.json();
}
