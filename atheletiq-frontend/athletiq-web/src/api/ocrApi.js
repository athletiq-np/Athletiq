// src/api/ocrApi.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const uploadBirthCertificate = async (file, token) => {
  const formData = new FormData();
  formData.append('birthCert', file);

  const response = await axios.post(`${API_BASE}/ocr/birth-certificate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
