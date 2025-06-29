// src/utils/idGenerator.js

/**
 * Player ID Generator (short, country-aware)
 * Format: [COUNTRY][YY][4 Random]
 * Example: NP25X7A9
 */

const COUNTRY_CODE = 'NP';

function generatePlayerId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 chars
  return `${COUNTRY_CODE}${year}${rand}`;
}

module.exports = { generatePlayerId };
