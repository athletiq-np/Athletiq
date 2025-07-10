import apiClient from './apiClient';

/**
 * Certificate API Service
 * Handles all certificate-related API operations
 */

// ==========================================
// CERTIFICATE TEMPLATE MANAGEMENT
// ==========================================

/**
 * Create a new certificate template for a tournament
 */
export const createCertificateTemplate = async (tournamentId, templateData) => {
  try {
    const response = await apiClient.post(
      `/tournaments/${tournamentId}/certificates/templates`,
      templateData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating certificate template:', error);
    throw handleApiError(error, 'Failed to create certificate template');
  }
};

/**
 * Get all certificate templates for a tournament
 */
export const getCertificateTemplates = async (tournamentId) => {
  try {
    const response = await apiClient.get(
      `/tournaments/${tournamentId}/certificates/templates`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    throw handleApiError(error, 'Failed to fetch certificate templates');
  }
};

/**
 * Update a certificate template
 */
export const updateCertificateTemplate = async (tournamentId, templateId, templateData) => {
  try {
    const response = await apiClient.put(
      `/tournaments/${tournamentId}/certificates/templates/${templateId}`,
      templateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating certificate template:', error);
    throw handleApiError(error, 'Failed to update certificate template');
  }
};

/**
 * Delete a certificate template
 */
export const deleteCertificateTemplate = async (tournamentId, templateId) => {
  try {
    const response = await apiClient.delete(
      `/tournaments/${tournamentId}/certificates/templates/${templateId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    throw handleApiError(error, 'Failed to delete certificate template');
  }
};

// ==========================================
// CERTIFICATE GENERATION
// ==========================================

/**
 * Generate a single certificate for a participant
 */
export const generateCertificate = async (tournamentId, certificateData) => {
  try {
    const response = await apiClient.post(
      `/tournaments/${tournamentId}/certificates/generate`,
      certificateData
    );
    return response.data;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw handleApiError(error, 'Failed to generate certificate');
  }
};

/**
 * Bulk generate certificates for multiple participants
 */
export const bulkGenerateCertificates = async (tournamentId, certificateRequests) => {
  try {
    const response = await apiClient.post(
      `/tournaments/${tournamentId}/certificates/bulk-generate`,
      { certificate_requests: certificateRequests }
    );
    return response.data;
  } catch (error) {
    console.error('Error bulk generating certificates:', error);
    throw handleApiError(error, 'Failed to bulk generate certificates');
  }
};

/**
 * Get all certificates for a tournament
 */
export const getTournamentCertificates = async (tournamentId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.participant_type) params.append('participant_type', filters.participant_type);
    if (filters.certificate_type) params.append('certificate_type', filters.certificate_type);
    
    const response = await apiClient.get(
      `/tournaments/${tournamentId}/certificates?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament certificates:', error);
    throw handleApiError(error, 'Failed to fetch tournament certificates');
  }
};

// ==========================================
// CERTIFICATE ACCESS & VERIFICATION
// ==========================================

/**
 * Get a specific certificate by ID
 */
export const getCertificate = async (certificateId) => {
  try {
    const response = await apiClient.get(`/certificates/${certificateId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    throw handleApiError(error, 'Failed to fetch certificate');
  }
};

/**
 * Download a certificate as PDF
 */
export const downloadCertificate = async (certificateId) => {
  try {
    const response = await apiClient.get(
      `/certificates/${certificateId}/download`,
      {
        responseType: 'blob' // Important for binary data
      }
    );
    return response;
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw handleApiError(error, 'Failed to download certificate');
  }
};

/**
 * Verify a certificate using verification code
 */
export const verifyCertificate = async (verificationCode) => {
  try {
    const response = await apiClient.get(`/certificates/verify/${verificationCode}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying certificate:', error);
    throw handleApiError(error, 'Failed to verify certificate');
  }
};

// ==========================================
// CERTIFICATE ANALYTICS
// ==========================================

/**
 * Get certificate statistics for a tournament
 */
export const getCertificateStats = async (tournamentId) => {
  try {
    const response = await apiClient.get(`/tournaments/${tournamentId}/certificates/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching certificate stats:', error);
    throw handleApiError(error, 'Failed to fetch certificate statistics');
  }
};

/**
 * Get certificate activity log
 */
export const getCertificateActivity = async (tournamentId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.activity_type) params.append('activity_type', filters.activity_type);
    
    const response = await apiClient.get(
      `/tournaments/${tournamentId}/certificates/activity?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching certificate activity:', error);
    throw handleApiError(error, 'Failed to fetch certificate activity');
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Handle API errors consistently
 */
const handleApiError = (error, defaultMessage) => {
  if (error.response && error.response.data && error.response.data.message) {
    const newError = new Error(error.response.data.message);
    newError.response = error.response;
    return newError;
  } else if (error.response && error.response.data) {
    const newError = new Error(defaultMessage);
    newError.response = error.response;
    return newError;
  } else {
    const newError = new Error(`${defaultMessage}. Please check your connection and try again.`);
    newError.response = error.response;
    return newError;
  }
};

/**
 * Create a download link for certificate download
 */
export const createCertificateDownloadLink = (certificateId, filename) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await downloadCertificate(certificateId);
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `certificate_${certificateId}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Validate certificate template data
 */
export const validateCertificateTemplate = (templateData) => {
  const errors = {};
  
  if (!templateData.name || templateData.name.trim().length === 0) {
    errors.name = 'Template name is required';
  }
  
  if (!templateData.template_type) {
    errors.template_type = 'Template type is required';
  } else if (!['participation', 'winner', 'runner_up', 'achievement'].includes(templateData.template_type)) {
    errors.template_type = 'Invalid template type';
  }
  
  if (!templateData.template_data || Object.keys(templateData.template_data).length === 0) {
    errors.template_data = 'Template configuration is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Format certificate data for display
 */
export const formatCertificateData = (certificate) => {
  return {
    ...certificate,
    issued_date: new Date(certificate.issued_at).toLocaleDateString(),
    verification_url: `${window.location.origin}/verify/${certificate.verification_code}`,
    download_url: `${window.location.origin}/certificates/${certificate.id}/download`
  };
};

// Export all functions
export default {
  // Template management
  createCertificateTemplate,
  getCertificateTemplates,
  updateCertificateTemplate,
  deleteCertificateTemplate,
  
  // Certificate generation
  generateCertificate,
  bulkGenerateCertificates,
  getTournamentCertificates,
  
  // Certificate access
  getCertificate,
  downloadCertificate,
  verifyCertificate,
  
  // Analytics
  getCertificateStats,
  getCertificateActivity,
  
  // Utilities
  createCertificateDownloadLink,
  validateCertificateTemplate,
  formatCertificateData
};
