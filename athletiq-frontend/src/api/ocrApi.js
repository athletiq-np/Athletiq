// src/api/ocrApi.js
import apiClient from '@/utils/apiClient';

export const uploadBirthCertificate = async (file) => {
  const formData = new FormData();
  formData.append('birthCert', file);

  const response = await apiClient.post('/documents/ocr/birth-certificate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
