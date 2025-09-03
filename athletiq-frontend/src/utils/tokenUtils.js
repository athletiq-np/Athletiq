/**
 * Utility functions for JWT token handling
 */

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token to check
 * @param {number} bufferSeconds - Buffer time in seconds before considering token expired (default: 300 = 5 minutes)
 * @returns {boolean} - True if token is expired or invalid
 */
export function isTokenExpired(token, bufferSeconds = 300) {
  if (!token) return true;
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if the token has an expiration claim
    if (!payload.exp) {
      // If no expiration claim, consider it valid (some tokens don't expire)
      return false;
    }
    
    // Calculate current time in seconds + buffer
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const expirationWithBuffer = currentTimeInSeconds + bufferSeconds;
    
    // Token is expired if current time + buffer >= expiration time
    return expirationWithBuffer >= payload.exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    // If we can't parse the token, consider it expired
    return true;
  }
}

/**
 * Get token expiration date
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiration date or null if no expiration or invalid token
 */
export function getTokenExpiration(token) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) return null;
    
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
}

/**
 * Get remaining time until token expires
 * @param {string} token - JWT token
 * @returns {number} - Remaining time in seconds, or 0 if expired/invalid
 */
export function getTokenRemainingTime(token) {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  
  const remainingMs = expiration.getTime() - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
}