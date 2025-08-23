// src/api/playerApi.js

/**
 * All API calls related to athletes (registration, OCR, etc).
 * Uses the consolidated apiClient configured for Django REST framework.
 */

import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

// Register a new athlete (multipart/form-data)
export async function registerPlayer(formData) {
  try {
    console.log('Sending request to:', API_ENDPOINTS.ATHLETES.REGISTER);
    console.log('Request data:', Array.from(formData.entries()));
    
    const res = await apiClient.post(API_ENDPOINTS.ATHLETES.REGISTER, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds timeout
    });
    
    console.log('API Response:', res);
    return res.data;
  } catch (error) {
    console.error('Error in registerPlayer:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Run OCR extraction on certificate only (returns extracted fields)
export async function extractCertificateOCR(certificateFile) {
  const formData = new FormData();
  formData.append('certificate', certificateFile);
  const res = await apiClient.post('/documents/ocr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}
