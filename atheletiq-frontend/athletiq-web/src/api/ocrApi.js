// src/api/ocrApi.js
import apiClient from './apiClient';

export const uploadBirthCertificate = async (file, token) => {
  const formData = new FormData();
  formData.append('birthCert', file);

  const response = await apiClient.post('/ocr/birth-certificate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
