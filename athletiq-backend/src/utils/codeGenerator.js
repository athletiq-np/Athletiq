// src/utils/codeGenerator.js
const { pool } = require('../config/db');

/**
 * Character sets for different code types
 */
const CHARACTER_SETS = {
  ALPHANUMERIC: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  NUMERIC: "0123456789",
  LETTERS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  LETTERS_LOWER: "abcdefghijklmnopqrstuvwxyz",
  NO_AMBIGUOUS: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excludes I, O, 0, 1
};

/**
 * Generate a random code with specified parameters
 * @param {string} prefix - Code prefix (e.g., "CLAIM", "MTCH")
 * @param {number} length - Length of random part (default: 5)
 * @param {string} charset - Character set to use (default: ALPHANUMERIC)
 * @param {string} separator - Separator between prefix and code (default: "-")
 * @returns {string} Generated code
 */
function generateRandomCode(prefix = "", length = 5, charset = CHARACTER_SETS.ALPHANUMERIC, separator = "-") {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return prefix ? `${prefix}${separator}${code}` : code;
}

/**
 * Default existence checker for claim codes
 * @param {string} code - Code to check
 * @returns {boolean} True if code exists
 */
async function defaultClaimCodeExists(code) {
  try {
    const result = await pool.query(
      'SELECT 1 FROM players WHERE claim_code = $1 LIMIT 1',
      [code]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error checking claim code existence:', error);
    return true; // Assume exists to be safe
  }
}

/**
 * Default existence checker for registration codes
 * @param {string} code - Code to check
 * @returns {boolean} True if code exists
 */
async function defaultRegistrationCodeExists(code) {
  try {
    const result = await pool.query(
      'SELECT 1 FROM registration_codes WHERE code = $1 LIMIT 1',
      [code]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error checking registration code existence:', error);
    return true; // Assume exists to be safe
  }
}

/**
 * Generates a unique code with multiple parameter signatures for backward compatibility
 * 
 * Signatures:
 * 1. generateShortCode(prefix, existsFn) - Original signature
 * 2. generateShortCode(prefix, length) - New: prefix and length only
 * 3. generateShortCode(prefix, length, existsFn) - New: prefix, length, and checker
 * 4. generateShortCode(options) - New: options object
 * 
 * @param {string|object} prefixOrOptions - Prefix string or options object
 * @param {number|function} lengthOrExistsFn - Length number or existence function
 * @param {function} existsFn - Optional existence checker function
 * @returns {string} Unique generated code
 */
async function generateShortCode(prefixOrOptions, lengthOrExistsFn, existsFn) {
  let options = {};
  
  // Handle different parameter signatures
  if (typeof prefixOrOptions === 'object') {
    // Object signature: generateShortCode({ prefix, length, existsFn, ... })
    options = {
      prefix: '',
      length: 5,
      charset: CHARACTER_SETS.ALPHANUMERIC,
      separator: '-',
      maxAttempts: 10,
      existsFn: null,
      ...prefixOrOptions
    };
  } else {
    // String prefix signatures
    options.prefix = prefixOrOptions || '';
    
    if (typeof lengthOrExistsFn === 'function') {
      // Original signature: generateShortCode(prefix, existsFn)
      options.length = 5;
      options.existsFn = lengthOrExistsFn;
    } else if (typeof lengthOrExistsFn === 'number') {
      // New signature: generateShortCode(prefix, length, existsFn?)
      options.length = lengthOrExistsFn;
      options.existsFn = existsFn;
    } else {
      // Default case
      options.length = 5;
      options.existsFn = lengthOrExistsFn;
    }
    
    // Set defaults
    options.charset = options.charset || CHARACTER_SETS.ALPHANUMERIC;
    options.separator = options.separator || '-';
    options.maxAttempts = options.maxAttempts || 10;
  }

  // Auto-select existence checker if not provided
  if (!options.existsFn) {
    if (options.prefix === 'CLAIM') {
      options.existsFn = defaultClaimCodeExists;
    } else if (options.prefix === 'REG' || options.prefix === 'QR') {
      options.existsFn = defaultRegistrationCodeExists;
    } else {
      // For other prefixes, generate without uniqueness checking
      // This maintains backward compatibility for simple random codes
      console.warn(`generateShortCode: No existence checker for prefix "${options.prefix}", generating without uniqueness check`);
      const code = generateRandomCode(
        options.prefix, 
        options.length, 
        options.charset, 
        options.separator
      );
      return code;
    }
  }

  if (typeof options.existsFn !== "function") {
    throw new Error("generateShortCode: existsFn must be a function");
  }

  let code;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < options.maxAttempts) {
    code = generateRandomCode(
      options.prefix, 
      options.length, 
      options.charset, 
      options.separator
    );
    
    try {
      exists = await options.existsFn(code);
    } catch (error) {
      console.error('Error checking code existence:', error);
      exists = true; // Assume exists to retry
    }
    
    attempts++;
  }

  if (exists) {
    throw new Error(`Failed to generate unique code after ${options.maxAttempts} attempts`);
  }

  return code;
}

/**
 * Generate a simple claim code for guardian workflows
 * @param {number} length - Length of the code (default: 12)
 * @returns {string} Unique claim code
 */
async function generateClaimCode(length = 12) {
  return generateShortCode('CLAIM', length, defaultClaimCodeExists);
}

/**
 * Generate a registration code for QR codes and invitations
 * @param {number} length - Length of the code (default: 8)
 * @returns {string} Unique registration code
 */
async function generateRegistrationCode(length = 8) {
  return generateShortCode('REG', length, defaultRegistrationCodeExists);
}

/**
 * Generate a match code
 * @param {number} length - Length of the code (default: 8)
 * @returns {string} Match code (note: may not be unique, depends on match service)
 */
async function generateMatchCode(length = 8) {
  return generateRandomCode('MTCH', length);
}

/**
 * Generate a tournament code
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} Tournament code (note: may not be unique, depends on tournament service)
 */
async function generateTournamentCode(length = 6) {
  return generateRandomCode('TOURN', length);
}

/**
 * Generate multiple unique codes in batch
 * @param {string} prefix - Code prefix
 * @param {number} count - Number of codes to generate
 * @param {number} length - Length of each code (default: 8)
 * @param {function} existsFn - Existence checker function
 * @returns {Array<string>} Array of unique codes
 */
async function generateBatchCodes(prefix, count, length = 8, existsFn) {
  const codes = [];
  const maxAttempts = 50; // Higher limit for batch operations
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let code;
    let exists = true;
    
    while (exists && attempts < maxAttempts) {
      code = generateRandomCode(prefix, length);
      
      if (existsFn) {
        try {
          exists = await existsFn(code);
          // Also check if the code is already in our current batch
          if (!exists && codes.includes(code)) {
            exists = true;
          }
        } catch (error) {
          console.error('Error in batch code generation:', error);
          exists = true;
        }
      } else {
        // If no existence checker, just ensure uniqueness within batch
        exists = codes.includes(code);
      }
      
      attempts++;
    }
    
    if (exists) {
      throw new Error(`Failed to generate unique code ${i + 1} after ${maxAttempts} attempts`);
    }
    
    codes.push(code);
  }
  
  return codes;
}

/**
 * Validate code format and strength
 * @param {string} code - Code to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result with score and details
 */
function validateCodeStrength(code, options = {}) {
  const defaults = {
    minLength: 6,
    maxLength: 20,
    requirePrefix: false,
    allowedCharsets: [CHARACTER_SETS.ALPHANUMERIC, CHARACTER_SETS.NO_AMBIGUOUS]
  };
  
  const opts = { ...defaults, ...options };
  const result = {
    isValid: true,
    score: 0,
    issues: [],
    strength: 'weak'
  };
  
  // Length validation
  if (code.length < opts.minLength) {
    result.isValid = false;
    result.issues.push(`Code too short (minimum ${opts.minLength} characters)`);
  } else if (code.length > opts.maxLength) {
    result.isValid = false;
    result.issues.push(`Code too long (maximum ${opts.maxLength} characters)`);
  } else {
    result.score += Math.min(20, code.length * 2);
  }
  
  // Character variety
  const hasUpper = /[A-Z]/.test(code);
  const hasLower = /[a-z]/.test(code);
  const hasNumbers = /[0-9]/.test(code);
  const hasSpecial = /[^A-Za-z0-9]/.test(code);
  
  const variety = [hasUpper, hasLower, hasNumbers, hasSpecial].filter(Boolean).length;
  result.score += variety * 15;
  
  // Avoid common patterns
  if (!/(.)\1{2,}/.test(code)) { // No 3+ consecutive same characters
    result.score += 10;
  } else {
    result.issues.push('Contains repetitive patterns');
  }
  
  if (!/012|123|234|345|456|567|678|789|890|abc|bcd|cde/i.test(code)) {
    result.score += 10;
  } else {
    result.issues.push('Contains sequential patterns');
  }
  
  // Determine strength
  if (result.score >= 70) {
    result.strength = 'strong';
  } else if (result.score >= 40) {
    result.strength = 'medium';
  }
  
  return result;
}

/**
 * Generate Nepal athlete ID compatible code
 * @param {number} length - Length of the alphanumeric part (default: 6)
 * @returns {string} Nepal format compatible code (without NP prefix)
 */
function generateNepalCode(length = 6) {
  return generateRandomCode('', length, CHARACTER_SETS.NO_AMBIGUOUS, '');
}

/**
 * Estimate code space size for given parameters
 * @param {number} length - Code length
 * @param {string} charset - Character set to use
 * @returns {object} Code space analysis
 */
function analyzeCodeSpace(length, charset = CHARACTER_SETS.ALPHANUMERIC) {
  const charsetSize = charset.length;
  const totalCombinations = Math.pow(charsetSize, length);
  
  return {
    length,
    charsetSize,
    totalCombinations,
    formattedTotal: totalCombinations.toLocaleString(),
    // Rough collision probability with birthday paradox
    safeUsageLimit: Math.floor(Math.sqrt(totalCombinations) * 0.5),
    recommendations: {
      excellent: totalCombinations > 1000000000, // 1B+
      good: totalCombinations > 100000000,       // 100M+
      adequate: totalCombinations > 10000000,    // 10M+
      warning: totalCombinations < 1000000       // < 1M
    }
  };
}

module.exports = { 
  generateShortCode,
  generateClaimCode,
  generateRegistrationCode,
  generateMatchCode,
  generateTournamentCode,
  generateBatchCodes,
  validateCodeStrength,
  generateNepalCode,
  analyzeCodeSpace,
  generateRandomCode,
  CHARACTER_SETS
};
