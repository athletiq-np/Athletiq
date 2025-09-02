import { useState, useEffect, useContext, createContext } from 'react';
import { toast } from 'react-toastify';
import { guardianAPI, tokenManager } from '../../../utils/apiClient';
import { AUTH_KEYS, persistUnifiedSession, readLegacyGuardian, clearLegacyGuardian } from '@/utils/authKeys';

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
        } catch (error) {
          // Ignore user validation errors, continue with legacy fallback
        }
      }
      // Legacy fallback
      const { token, guardian } = readLegacyGuardian();
      if (token && tokenManager.isValid() && guardian) {
        setGuardian(guardian);
        setIsAuthenticated(true);
        try {
          const response = await guardianAPI.getProfile();
          setGuardian(response.data);
          // Persist to unified storage
          persistUnifiedSession({ token, user: { ...response.data, role: response.data.role || 'Guardian' } });
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
      const response = await guardianAPI.register(registrationData);
      
  const { token, guardian: guardianInfo } = response.data;
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
      const response = await guardianAPI.login({ email, password });
      
  const { token, guardian: guardianInfo } = response.data;
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
      const response = await guardianAPI.updateProfile(profileData);
      
      const updatedGuardian = response.data;
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
