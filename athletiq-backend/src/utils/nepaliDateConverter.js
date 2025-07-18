// src/utils/nepaliDateConverter.js
// Utility functions for converting Nepali (Bikram Sambat) dates to Gregorian (AD) dates

/**
 * Convert Bikram Sambat date to Gregorian date
 * @param {string} bsDate - BS date in format "२०७१-०४-१७" or "2071-04-17"
 * @returns {string} - Gregorian date in format "YYYY-MM-DD"
 */
function convertBSToAD(bsDate) {
  if (!bsDate) return null;
  
  try {
    // Convert Nepali numerals to English if needed
    const englishDate = convertNepaliNumeralsToEnglish(bsDate);
    
    // Parse BS date
    const [bsYear, bsMonth, bsDay] = englishDate.split('-').map(Number);
    
    // BS to AD conversion lookup table (simplified - covers common years)
    const bsToAdMap = {
      2070: { offset: 56, year: 2013 },
      2071: { offset: 56, year: 2014 },
      2072: { offset: 56, year: 2015 },
      2073: { offset: 56, year: 2016 },
      2074: { offset: 56, year: 2017 },
      2075: { offset: 56, year: 2018 },
      2076: { offset: 56, year: 2019 },
      2077: { offset: 56, year: 2020 },
      2078: { offset: 56, year: 2021 },
      2079: { offset: 56, year: 2022 },
      2080: { offset: 56, year: 2023 },
      2081: { offset: 56, year: 2024 },
      2082: { offset: 56, year: 2025 }
    };
    
    // Days in each BS month (approximate)
    const bsMonthDays = [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30];
    
    if (!bsToAdMap[bsYear]) {
      // Fallback calculation for years not in map
      const adYear = bsYear - 57; // Approximate conversion
      return `${adYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
    }
    
    // Calculate total days from BS year start
    let totalDays = 0;
    for (let month = 1; month < bsMonth; month++) {
      totalDays += bsMonthDays[month - 1];
    }
    totalDays += bsDay - 1;
    
    // Convert to AD
    const baseAdDate = new Date(`${bsToAdMap[bsYear].year}-04-14`); // BS year typically starts around April 14
    const adDate = new Date(baseAdDate.getTime() + (totalDays * 24 * 60 * 60 * 1000));
    
    return adDate.toISOString().split('T')[0];
    
  } catch (error) {
    console.error('BS to AD conversion error:', error);
    return null;
  }
}

/**
 * Convert Nepali numerals to English numerals
 * @param {string} nepaliText - Text containing Nepali numerals
 * @returns {string} - Text with English numerals
 */
function convertNepaliNumeralsToEnglish(nepaliText) {
  if (!nepaliText) return nepaliText;
  
  const nepaliToEnglishMap = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  
  return nepaliText.replace(/[०-९]/g, (match) => nepaliToEnglishMap[match] || match);
}

/**
 * Convert English numerals to Nepali numerals
 * @param {string} englishText - Text containing English numerals
 * @returns {string} - Text with Nepali numerals
 */
function convertEnglishNumeralsToNepali(englishText) {
  if (!englishText) return englishText;
  
  const englishToNepaliMap = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
  };
  
  return englishText.replace(/[0-9]/g, (match) => englishToNepaliMap[match] || match);
}

/**
 * Parse and validate Nepali place names
 * @param {string} address - Nepali address text
 * @returns {object} - Parsed address components
 */
function parseNepaliAddress(address) {
  if (!address) return null;
  
  const addressParts = address.split(',').map(part => part.trim());
  
  // Common Nepali administrative terms
  const provinceTerms = ['प्रदेश', 'Pradesh'];
  const municipalityTerms = ['महानगरपालिका', 'नगरपालिका', 'Municipality', 'Metro'];
  const wardTerms = ['वडा', 'Ward'];
  
  let parsed = {
    province: null,
    district: null,
    municipality: null,
    wardNumber: null,
    tole: null
  };
  
  addressParts.forEach(part => {
    if (provinceTerms.some(term => part.includes(term))) {
      parsed.province = part;
    } else if (municipalityTerms.some(term => part.includes(term))) {
      parsed.municipality = part;
    } else if (wardTerms.some(term => part.includes(term))) {
      const wardMatch = part.match(/(\d+|[०-९]+)/);
      if (wardMatch) {
        parsed.wardNumber = convertNepaliNumeralsToEnglish(wardMatch[0]);
      }
    } else if (!parsed.district && addressParts.indexOf(part) <= 2) {
      // Likely district if early in address and not categorized
      parsed.district = part;
    } else {
      // Remaining parts likely tole/village
      if (!parsed.tole) parsed.tole = part;
    }
  });
  
  return parsed;
}

/**
 * Validate and normalize Nepali gender terms
 * @param {string} gender - Gender in Nepali or English
 * @returns {string} - Normalized gender (Male/Female/Other)
 */
function normalizeGender(gender) {
  if (!gender) return null;
  
  const genderMap = {
    'पुरुष': 'Male',
    'महिला': 'Female',
    'अन्य': 'Other',
    'Male': 'Male',
    'Female': 'Female',
    'Other': 'Other',
    'M': 'Male',
    'F': 'Female'
  };
  
  return genderMap[gender.trim()] || 'Other';
}

/**
 * Extract confidence level based on OCR extraction quality
 * @param {object} extractedData - Raw extracted data
 * @returns {object} - Confidence assessment
 */
function assessExtractionConfidence(extractedData) {
  let confidence = 1.0;
  let uncertainFields = [];
  
  // Check mandatory fields
  if (!extractedData.childName?.nepali && !extractedData.childName?.english) {
    confidence -= 0.3;
    uncertainFields.push('childName');
  }
  
  if (!extractedData.dateOfBirth?.bikramSambat && !extractedData.dateOfBirth?.gregorian) {
    confidence -= 0.2;
    uncertainFields.push('dateOfBirth');
  }
  
  if (!extractedData.gender) {
    confidence -= 0.1;
    uncertainFields.push('gender');
  }
  
  if (!extractedData.fatherName?.nepali && !extractedData.fatherName?.english) {
    confidence -= 0.1;
    uncertainFields.push('fatherName');
  }
  
  if (!extractedData.motherName?.nepali && !extractedData.motherName?.english) {
    confidence -= 0.1;
    uncertainFields.push('motherName');
  }
  
  return {
    overall: Math.max(0, confidence),
    uncertainFields
  };
}

module.exports = {
  convertBSToAD,
  convertNepaliNumeralsToEnglish,
  convertEnglishNumeralsToNepali,
  parseNepaliAddress,
  normalizeGender,
  assessExtractionConfidence
};
