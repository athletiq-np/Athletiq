/**
 * Nepali Calendar Utility
 * Provides conversion between Bikram Sambat (BS) and Anno Domini (AD) calendars
 * 
 * Note: This is a simplified implementation. In production, use a proper 
 * BS-AD conversion library like 'nepali-date' or 'bikram-sambat'
 */

export const nepaliMonths = [
  { np: 'बैशाख', en: 'Baisakh', days: [31, 31], index: 0 },
  { np: 'जेष्ठ', en: 'Jestha', days: [31, 31], index: 1 },
  { np: 'आषाढ', en: 'Ashadh', days: [31, 32], index: 2 },
  { np: 'श्रावण', en: 'Shrawan', days: [31, 32], index: 3 },
  { np: 'भाद्र', en: 'Bhadra', days: [31, 32], index: 4 },
  { np: 'आश्विन', en: 'Ashwin', days: [30, 32], index: 5 },
  { np: 'कार्तिक', en: 'Kartik', days: [30, 30], index: 6 },
  { np: 'मंसिर', en: 'Mangsir', days: [30, 30], index: 7 },
  { np: 'पौष', en: 'Poush', days: [29, 30], index: 8 },
  { np: 'माघ', en: 'Magh', days: [29, 30], index: 9 },
  { np: 'फाल्गुन', en: 'Falgun', days: [29, 30], index: 10 },
  { np: 'चैत्र', en: 'Chaitra', days: [30, 30], index: 11 }
];

// Simplified conversion data (in production, use proper conversion tables)
const bsAdOffset = 56.7; // Approximate offset between BS and AD years

/**
 * Convert Nepali date to English date
 * @param {number} bsYear - Bikram Sambat year
 * @param {number} bsMonth - BS month (1-12)
 * @param {number} bsDay - BS day
 * @returns {string} English date in YYYY-MM-DD format
 */
export const convertNepaliToEnglish = (bsYear, bsMonth, bsDay) => {
  try {
    // This is a simplified conversion - use proper library in production
    let approximateAdYear = Math.floor(bsYear - bsAdOffset);
    
    // Basic month mapping (simplified)
    let adMonth, adDay;
    
    if (bsMonth <= 3) {
      // Baisakh, Jestha, Ashadh typically fall in April-July
      adMonth = bsMonth + 3;
      adDay = Math.min(bsDay, 31);
    } else if (bsMonth <= 6) {
      // Shrawan, Bhadra, Ashwin typically fall in July-October  
      adMonth = bsMonth + 3;
      if (adMonth > 12) {
        adMonth -= 12;
        approximateAdYear++;
      }
      adDay = Math.min(bsDay, 31);
    } else if (bsMonth <= 9) {
      // Kartik, Mangsir, Poush typically fall in October-January
      adMonth = bsMonth - 3;
      if (adMonth <= 0) {
        adMonth += 12;
      }
      adDay = Math.min(bsDay, 31);
    } else {
      // Magh, Falgun, Chaitra typically fall in January-April
      adMonth = bsMonth - 9;
      adDay = Math.min(bsDay, 31);
    }
    
    // Ensure valid date ranges
    adMonth = Math.max(1, Math.min(12, adMonth));
    adDay = Math.max(1, Math.min(31, adDay));
    
    return `${approximateAdYear}-${String(adMonth).padStart(2, '0')}-${String(adDay).padStart(2, '0')}`;
  } catch (error) {
    console.error('Nepali to English conversion error:', error);
    return '';
  }
};

/**
 * Convert English date to Nepali date
 * @param {string} englishDate - English date in YYYY-MM-DD format
 * @returns {object} { year, month, day } in Bikram Sambat
 */
export const convertEnglishToNepali = (englishDate) => {
  try {
    const date = new Date(englishDate);
    const adYear = date.getFullYear();
    const adMonth = date.getMonth() + 1;
    const adDay = date.getDate();
    
    // Simplified conversion
    const approximateBsYear = Math.floor(adYear + bsAdOffset);
    
    let bsMonth, bsDay;
    
    if (adMonth <= 3) {
      // January-March typically fall in Magh-Chaitra
      bsMonth = adMonth + 9;
      bsDay = Math.min(adDay, 30);
    } else if (adMonth <= 6) {
      // April-June typically fall in Baisakh-Ashadh
      bsMonth = adMonth - 3;
      bsDay = Math.min(adDay, 32);
    } else if (adMonth <= 9) {
      // July-September typically fall in Ashadh-Ashwin
      bsMonth = adMonth - 3;
      bsDay = Math.min(adDay, 32);
    } else {
      // October-December typically fall in Kartik-Poush
      bsMonth = adMonth - 3;
      bsDay = Math.min(adDay, 30);
    }
    
    // Ensure valid ranges
    bsMonth = Math.max(1, Math.min(12, bsMonth));
    bsDay = Math.max(1, Math.min(32, bsDay));
    
    return {
      year: approximateBsYear,
      month: bsMonth,
      day: bsDay
    };
  } catch (error) {
    console.error('English to Nepali conversion error:', error);
    return { year: '', month: '', day: '' };
  }
};

/**
 * Get days in a Nepali month
 * @param {number} bsYear - Bikram Sambat year
 * @param {number} bsMonth - BS month (1-12)
 * @returns {number} Number of days in the month
 */
export const getDaysInNepaliMonth = (bsYear, bsMonth) => {
  if (bsMonth < 1 || bsMonth > 12) return 30;
  
  const monthData = nepaliMonths[bsMonth - 1];
  // Simplified - in production, use proper calendar data for each year
  return monthData.days[0]; // Using first value as default
};

/**
 * Format Nepali date for display
 * @param {number} bsYear - Bikram Sambat year
 * @param {number} bsMonth - BS month (1-12)
 * @param {number} bsDay - BS day
 * @param {string} lang - Language ('np' for Nepali, 'en' for English)
 * @returns {string} Formatted date
 */
export const formatNepaliDate = (bsYear, bsMonth, bsDay, lang = 'en') => {
  if (!bsYear || !bsMonth || !bsDay) return '';
  
  const monthData = nepaliMonths[bsMonth - 1];
  if (!monthData) return '';
  
  const monthName = lang === 'np' ? monthData.np : monthData.en;
  
  if (lang === 'np') {
    return `${monthName} ${bsDay}, ${bsYear}`;
  } else {
    return `${monthName} ${bsDay}, ${bsYear} BS`;
  }
};

/**
 * Calculate age from date of birth
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export const calculateAge = (birthDate) => {
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  } catch (error) {
    console.error('Age calculation error:', error);
    return 0;
  }
};

/**
 * Validate Nepali date
 * @param {number} bsYear - Bikram Sambat year
 * @param {number} bsMonth - BS month (1-12)
 * @param {number} bsDay - BS day
 * @returns {boolean} True if valid
 */
export const isValidNepaliDate = (bsYear, bsMonth, bsDay) => {
  if (!bsYear || !bsMonth || !bsDay) return false;
  if (bsMonth < 1 || bsMonth > 12) return false;
  if (bsDay < 1) return false;
  
  const daysInMonth = getDaysInNepaliMonth(bsYear, bsMonth);
  return bsDay <= daysInMonth;
};

/**
 * Validate English date
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day
 * @returns {boolean} True if valid
 */
export const isValidEnglishDate = (year, month, day) => {
  try {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  } catch (error) {
    return false;
  }
};
