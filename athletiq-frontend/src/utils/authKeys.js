// Centralized auth storage keys for all user types
// Ensures consistent naming and easier future migration to secure storage

export const AUTH_KEYS = {
  TOKEN: 'athletiq_token',            // unified JWT token
  REFRESH_TOKEN: 'athletiq_refresh',  // optional refresh token
  USER: 'athletiq_user',              // unified user object (admin / school / athlete / guardian)
  GUARDIAN_TOKEN_LEGACY: 'guardian-token',
  GUARDIAN_TOKEN_ALT_LEGACY: 'guardianToken',
  GUARDIAN_DATA_LEGACY: 'guardian-data',
  GUARDIAN_INFO_LEGACY: 'guardianInfo',
};

export function readLegacyGuardian() {
  const token = localStorage.getItem(AUTH_KEYS.GUARDIAN_TOKEN_LEGACY) || localStorage.getItem(AUTH_KEYS.GUARDIAN_TOKEN_ALT_LEGACY);
  const data = localStorage.getItem(AUTH_KEYS.GUARDIAN_DATA_LEGACY) || localStorage.getItem(AUTH_KEYS.GUARDIAN_INFO_LEGACY);
  let guardian = null;
  try { guardian = data ? JSON.parse(data) : null; } catch { guardian = null; }
  return { token, guardian };
}

export function persistUnifiedSession({ token, user }) {
  if (token) localStorage.setItem(AUTH_KEYS.TOKEN, token);
  if (user) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
}

export function clearLegacyGuardian() {
  [
    AUTH_KEYS.GUARDIAN_TOKEN_LEGACY,
    AUTH_KEYS.GUARDIAN_TOKEN_ALT_LEGACY,
    AUTH_KEYS.GUARDIAN_DATA_LEGACY,
    AUTH_KEYS.GUARDIAN_INFO_LEGACY
  ].forEach(k => localStorage.removeItem(k));
}

export function clearUnifiedSession() {
  [AUTH_KEYS.TOKEN, AUTH_KEYS.REFRESH_TOKEN, AUTH_KEYS.USER].forEach(k => localStorage.removeItem(k));
}
