const pool = require('../src/config/db');

/**
 * Generate unique athlete ID in Nepal format
 */
async function generateAthleteId() {
  try {
    // Get the next sequence number
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM players WHERE athlete_id LIKE 'NP-%'
    `);
    
    const count = parseInt(result.rows[0].count) + 1;
    const athleteId = `NP-${count.toString().padStart(7, '0')}`;
    
    // Ensure uniqueness
    const existingCheck = await pool.query(
      'SELECT id FROM players WHERE athlete_id = $1',
      [athleteId]
    );
    
    if (existingCheck.rows.length > 0) {
      // If somehow duplicate, recursively try next number
      return generateAthleteId();
    }
    
    return athleteId;
  } catch (error) {
    console.error('Error generating athlete ID:', error);
    throw new Error('Failed to generate athlete ID');
  }
}

/**
 * Calculate profile completion percentage
 */
function calculateProfileCompletion(athleteData, files = {}) {
  const fields = [
    // Required fields (higher weight)
    { field: 'full_name', weight: 10, required: true },
    { field: 'date_of_birth', weight: 10, required: true },
    { field: 'gender', weight: 10, required: true },
    { field: 'school_id', weight: 10, required: true },
    { field: 'guardian_name', weight: 10, required: true },
    { field: 'guardian_phone', weight: 10, required: true },
    { field: 'address', weight: 10, required: true },
    
    // Optional but important fields
    { field: 'full_name_nepali', weight: 5 },
    { field: 'citizenship_no', weight: 5 },
    { field: 'guardian_email', weight: 5 },
    { field: 'height_cm', weight: 3 },
    { field: 'weight_kg', weight: 3 },
    { field: 'blood_group', weight: 3 },
    { field: 'primary_sport', weight: 5 },
    
    // File uploads
    { field: 'profile_photo', weight: 8, isFile: true },
    { field: 'birth_certificate', weight: 12, isFile: true }
  ];
  
  let totalWeight = 0;
  let completedWeight = 0;
  
  fields.forEach(({ field, weight, required, isFile }) => {
    totalWeight += weight;
    
    let isCompleted = false;
    
    if (isFile) {
      // Check file uploads
      if (field === 'profile_photo' && files.hasProfilePhoto) {
        isCompleted = true;
      } else if (field === 'birth_certificate' && files.hasBirthCertificate) {
        isCompleted = true;
      }
    } else {
      // Check form data
      const value = athleteData[field];
      isCompleted = value !== null && value !== undefined && value !== '';
    }
    
    if (isCompleted) {
      completedWeight += weight;
    }
  });
  
  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Validate athlete data integrity
 */
function validateAthleteData(athleteData) {
  const errors = [];
  
  // Check required fields
  const requiredFields = [
    'full_name', 'date_of_birth', 'gender', 'school_id',
    'guardian_name', 'guardian_phone', 'address'
  ];
  
  requiredFields.forEach(field => {
    if (!athleteData[field] || athleteData[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Validate date of birth
  if (athleteData.date_of_birth) {
    const dob = new Date(athleteData.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (age < 5 || age > 25) {
      errors.push('Age must be between 5 and 25 years');
    }
  }
  
  // Validate phone number
  if (athleteData.guardian_phone) {
    const phoneRegex = /^(\+977)?[0-9]{10}$/;
    if (!phoneRegex.test(athleteData.guardian_phone.replace(/[\s-]/g, ''))) {
      errors.push('Invalid phone number format');
    }
  }
  
  // Validate email if provided
  if (athleteData.guardian_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(athleteData.guardian_email)) {
      errors.push('Invalid email format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate athlete summary for dashboard
 */
async function getAthleteSummary(guardianId) {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN profile_completion < 80 THEN 1 END) as incomplete,
        ROUND(AVG(profile_completion), 0) as average_completion
      FROM players 
      WHERE guardian_id = $1 AND is_active = true
    `, [guardianId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting athlete summary:', error);
    throw new Error('Failed to get athlete summary');
  }
}

module.exports = {
  generateAthleteId,
  calculateProfileCompletion,
  validateAthleteData,
  getAthleteSummary
};
