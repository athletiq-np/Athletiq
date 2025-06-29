// src/utils/codeGenerator.js

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a unique short code with a prefix.
 * @param {string} prefix - Prefix string (e.g., 'NP', 'EDU')
 * @param {number} length - Total length of the code including prefix
 * @param {Function} existsFn - Async function that returns true if code exists in DB
 * @returns {Promise<string>} Unique code
 */
async function generateShortCode(prefix, length, existsFn) {
  if (prefix.length >= length) {
    throw new Error("Prefix length must be less than total length");
  }

  let code;
  let attempts = 0;
  do {
    attempts++;
    let randomPart = '';
    const randomLength = length - prefix.length;
    for (let i = 0; i < randomLength; i++) {
      randomPart += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    code = prefix.toUpperCase() + randomPart;

    if (attempts > 10) {
      throw new Error('Failed to generate unique code after 10 attempts');
    }
  } while (await existsFn(code));

  return code;
}

module.exports = { generateShortCode };
