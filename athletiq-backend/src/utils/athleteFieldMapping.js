// src/utils/athleteFieldMapping.js
const pool = require('../config/db');

/**
 * Mapping between birth certificate fields and athlete database columns
 */
const FIELD_MAPPINGS = {
  // Personal Information
  'childName.english': 'full_name',
  'childName.nepali': 'full_name_nepali',
  'dateOfBirth.gregorian': 'date_of_birth',
  'gender': 'gender',
  
  // Address Information
  'permanentAddress.province': 'province',
  'permanentAddress.district': 'district', 
  'permanentAddress.municipality': 'municipality_or_rural_municipality',
  'permanentAddress.wardNumber': 'ward_no',
  'permanentAddress.tole': 'tole_village',
  
  // Birth Place
  'placeOfBirth.province': 'birth_province',
  'placeOfBirth.district': 'birth_district',
  'placeOfBirth.municipality': 'birth_municipality',
  'placeOfBirth.wardNumber': 'birth_ward_no',
  
  // Family Information
  'fatherName.english': 'guardian_father_name',
  'fatherName.nepali': 'guardian_father_name_nepali',
  'motherName.english': 'guardian_mother_name',
  'motherName.nepali': 'guardian_mother_name_nepali',
  'grandfatherName.english': 'grandfather_name',
  'grandfatherName.nepali': 'grandfather_name_nepali',
  
  // Citizenship Information
  'parentCitizenship.fatherCitizenshipNo': 'father_citizenship_no',
  'parentCitizenship.motherCitizenshipNo': 'mother_citizenship_no',
  
  // Registration Information
  'registrationDetails.registrationNumber': 'birth_certificate_number',
  'registrationDetails.registrationDate.gregorian': 'birth_certificate_date',
  'registrationDetails.issuingOffice': 'birth_certificate_office'
};

/**
 * Required columns that should exist in the players table for full birth certificate integration
 */
const REQUIRED_COLUMNS = [
  // Basic columns (should already exist)
  { name: 'full_name', type: 'VARCHAR(255)' },
  { name: 'date_of_birth', type: 'DATE' },
  { name: 'gender', type: 'VARCHAR(20)' },
  { name: 'address', type: 'TEXT' },
  
  // Enhanced columns for birth certificate integration
  { name: 'full_name_nepali', type: 'VARCHAR(255)' },
  { name: 'province', type: 'VARCHAR(100)' },
  { name: 'district', type: 'VARCHAR(100)' },
  { name: 'municipality_or_rural_municipality', type: 'VARCHAR(150)' },
  { name: 'ward_no', type: 'VARCHAR(20)' },
  { name: 'tole_village', type: 'VARCHAR(100)' },
  
  // Birth place information
  { name: 'birth_province', type: 'VARCHAR(100)' },
  { name: 'birth_district', type: 'VARCHAR(100)' },
  { name: 'birth_municipality', type: 'VARCHAR(150)' },
  { name: 'birth_ward_no', type: 'VARCHAR(20)' },
  
  // Family information
  { name: 'guardian_father_name', type: 'VARCHAR(255)' },
  { name: 'guardian_father_name_nepali', type: 'VARCHAR(255)' },
  { name: 'guardian_mother_name', type: 'VARCHAR(255)' },
  { name: 'guardian_mother_name_nepali', type: 'VARCHAR(255)' },
  { name: 'grandfather_name', type: 'VARCHAR(255)' },
  { name: 'grandfather_name_nepali', type: 'VARCHAR(255)' },
  
  // Citizenship information
  { name: 'father_citizenship_no', type: 'VARCHAR(50)' },
  { name: 'mother_citizenship_no', type: 'VARCHAR(50)' },
  
  // Birth certificate information
  { name: 'birth_certificate_number', type: 'VARCHAR(100)' },
  { name: 'birth_certificate_date', type: 'DATE' },
  { name: 'birth_certificate_office', type: 'VARCHAR(200)' },
  { name: 'birth_certificate_url', type: 'TEXT' },
  { name: 'birth_certificate_verified', type: 'BOOLEAN DEFAULT FALSE' },
  { name: 'document_verified', type: 'BOOLEAN DEFAULT FALSE' },
  { name: 'profile_completion_percentage', type: 'INTEGER DEFAULT 0' }
];

/**
 * Check if all required columns exist in the players table
 */
async function checkRequiredColumns() {
  try {
    // Get current table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'players' AND table_schema = 'public'
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name.toLowerCase());
    const missingColumns = REQUIRED_COLUMNS.filter(col => 
      !existingColumns.includes(col.name.toLowerCase())
    );
    
    return {
      existingColumns: existingColumns.length,
      missingColumns: missingColumns,
      totalRequired: REQUIRED_COLUMNS.length,
      isComplete: missingColumns.length === 0
    };
  } catch (error) {
    console.error('Error checking columns:', error);
    throw error;
  }
}

/**
 * Add missing columns to the players table
 */
async function addMissingColumns() {
  try {
    const columnCheck = await checkRequiredColumns();
    
    if (columnCheck.missingColumns.length === 0) {
      return { success: true, message: 'All columns already exist', added: 0 };
    }
    
    console.log(`Adding ${columnCheck.missingColumns.length} missing columns...`);
    
    for (const column of columnCheck.missingColumns) {
      try {
        const alterQuery = `ALTER TABLE players ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`;
        await pool.query(alterQuery);
        console.log(`✓ Added column: ${column.name}`);
      } catch (columnError) {
        console.error(`✗ Failed to add column ${column.name}:`, columnError.message);
      }
    }
    
    return { 
      success: true, 
      message: `Added ${columnCheck.missingColumns.length} columns successfully`,
      added: columnCheck.missingColumns.length
    };
  } catch (error) {
    console.error('Error adding columns:', error);
    throw error;
  }
}

/**
 * Extract values from birth certificate data using field mappings
 */
function extractAthleteFields(birthCertData) {
  const athleteData = {};
  
  for (const [certField, dbField] of Object.entries(FIELD_MAPPINGS)) {
    const value = getNestedValue(birthCertData, certField);
    if (value !== null && value !== undefined && value !== '') {
      athleteData[dbField] = value;
    }
  }
  
  // Special handling for composite address field
  if (birthCertData.permanentAddress) {
    const addr = birthCertData.permanentAddress;
    const addressParts = [
      addr.municipality,
      addr.wardNumber ? `Ward ${addr.wardNumber}` : null,
      addr.tole,
      addr.district,
      addr.province
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      athleteData.address = addressParts.join(', ');
    }
  }
  
  // Special handling for place of birth
  if (birthCertData.placeOfBirth) {
    const birth = birthCertData.placeOfBirth;
    const birthParts = [
      birth.municipality,
      birth.district
    ].filter(Boolean);
    
    if (birthParts.length > 0) {
      athleteData.place_of_birth = birthParts.join(', ');
    }
  }
  
  return athleteData;
}

/**
 * Get nested object value by dot notation path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Calculate profile completion percentage based on filled fields
 */
function calculateCompletionPercentage(athleteData) {
  const importantFields = [
    'full_name', 'date_of_birth', 'gender', 'address',
    'guardian_father_name', 'guardian_mother_name',
    'province', 'district', 'birth_certificate_number'
  ];
  
  const filledFields = importantFields.filter(field => 
    athleteData[field] && athleteData[field] !== ''
  );
  
  return Math.round((filledFields.length / importantFields.length) * 100);
}

module.exports = {
  FIELD_MAPPINGS,
  REQUIRED_COLUMNS,
  checkRequiredColumns,
  addMissingColumns,
  extractAthleteFields,
  calculateCompletionPercentage
};
