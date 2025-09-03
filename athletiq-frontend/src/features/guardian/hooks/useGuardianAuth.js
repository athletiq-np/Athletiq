import { useState, useEffect, useContext, createContext } from 'react';
import { toast } from 'react-toastify';
import { guardianAPI, tokenManager } from '@/utils/apiClient';
import { authStorage } from '@/config/auth.config';

// Auth storage keys for Guardian authentication
const AUTH_KEYS = {
  TOKEN: 'athletiq_token',            // unified JWT token
  REFRESH_TOKEN: 'athletiq_refresh',  // optional refresh token
  USER: 'athletiq_user',              // unified user object (admin / school / athlete / guardian)
  GUARDIAN_TOKEN_LEGACY: 'guardian-token',
  GUARDIAN_TOKEN_ALT_LEGACY: 'guardianToken',
  GUARDIAN_DATA_LEGACY: 'guardian-data',
  GUARDIAN_INFO_LEGACY: 'guardianInfo',
};

// Legacy Guardian storage functions
function readLegacyGuardian() {
  const token = localStorage.getItem(AUTH_KEYS.GUARDIAN_TOKEN_LEGACY) || localStorage.getItem(AUTH_KEYS.GUARDIAN_TOKEN_ALT_LEGACY);
  const data = localStorage.getItem(AUTH_KEYS.GUARDIAN_DATA_LEGACY) || localStorage.getItem(AUTH_KEYS.GUARDIAN_INFO_LEGACY);
  let guardian = null;
  try { guardian = data ? JSON.parse(data) : null; } catch { guardian = null; }
  return { token, guardian };
}

function persistUnifiedSession({ token, user }) {
  if (token) localStorage.setItem(AUTH_KEYS.TOKEN, token);
  if (user) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
}

function clearLegacyGuardian() {
  [
    AUTH_KEYS.GUARDIAN_TOKEN_LEGACY,
    AUTH_KEYS.GUARDIAN_TOKEN_ALT_LEGACY,
    AUTH_KEYS.GUARDIAN_DATA_LEGACY,
    AUTH_KEYS.GUARDIAN_INFO_LEGACY
  ].forEach(k => localStorage.removeItem(k));
}

// Create Guardian Auth Context
const GuardianAuthContext = createContext();

export const useGuardianAuth = () => {
  const context = useContext(GuardianAuthContext);
  if (!context) {
    throw new Error('useGuardianAuth must be used within a GuardianAuthProvider');
  }
  return context;
};

export const GuardianAuthProvider = ({ children }) => {
  const [guardian, setGuardian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Migration: read unified session first
      const unifiedToken = localStorage.getItem(AUTH_KEYS.TOKEN);
      const unifiedUserRaw = localStorage.getItem(AUTH_KEYS.USER);
      if (unifiedToken && unifiedUserRaw) {
        try {
          const u = JSON.parse(unifiedUserRaw);
          if (u && (u.role === 'Guardian' || u.guardianId)) {
            setGuardian(u);
            setIsAuthenticated(true);
            return;
          }
        } catch {}
      }
      // Legacy fallback
      const { token, guardian } = readLegacyGuardian();
      if (token && tokenManager.isValid() && guardian) {
        setGuardian(guardian);
        setIsAuthenticated(true);
        try {
          const response = await guardianAPI.getProfile();
          setGuardian(response);
          // Persist to unified storage
          persistUnifiedSession({ token, user: { ...response, role: response.role || 'Guardian' } });
          clearLegacyGuardian();
        } catch (error) {
          console.log('Token verification failed, but keeping local data');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    try {
      setLoading(true);
      const response = await guardianAPI.post('/auth/register', registrationData);
      
  const { token, guardian: guardianInfo } = response;
  tokenManager.set(token);
  const normalized = { ...guardianInfo, role: guardianInfo.role || 'Guardian' };
  persistUnifiedSession({ token, user: normalized });
  clearLegacyGuardian();
  setGuardian(normalized);
  setIsAuthenticated(true);
      
      toast.success('Registration successful!');
      return { success: true, data: guardianInfo };
    } catch (error) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await guardianAPI.post('/auth/login', { email, password });
      
  const { token, guardian: guardianInfo } = response;
  tokenManager.set(token);
  const normalized = { ...guardianInfo, role: guardianInfo.role || 'Guardian' };
  persistUnifiedSession({ token, user: normalized });
  clearLegacyGuardian();
  setGuardian(normalized);
  setIsAuthenticated(true);
      
      toast.success('Login successful!');
      return { success: true, data: guardianInfo };
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Try to call server logout endpoint
      await fetch('/auth/logout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenManager.get() || localStorage.getItem(AUTH_KEYS.TOKEN)}`
        }
      });
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      // Always clear local data
      tokenManager.remove();
      clearLegacyGuardian();
      localStorage.removeItem(AUTH_KEYS.TOKEN);
      localStorage.removeItem(AUTH_KEYS.USER);
      setGuardian(null);
      setIsAuthenticated(false);
      toast.info('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await guardianAPI.put('/profile', profileData);
      
      const updatedGuardian = response;
      setGuardian(updatedGuardian);
      localStorage.setItem('guardian-data', JSON.stringify(updatedGuardian));
      toast.success('Profile updated successfully!');
      return { success: true, data: updatedGuardian };
    } catch (error) {
      const message = error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    guardian,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    checkAuthStatus
  };

  return (
    <GuardianAuthContext.Provider value={value}>
      {children}
    </GuardianAuthContext.Provider>
  );
};

export default GuardianAuthContext;
