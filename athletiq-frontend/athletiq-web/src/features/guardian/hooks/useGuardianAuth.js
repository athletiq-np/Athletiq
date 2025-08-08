import { useState, useEffect, useContext, createContext } from 'react';
import { toast } from 'react-toastify';
import { guardianAPI, tokenManager } from '../../../utils/apiClient';

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
      const token = tokenManager.get();
      const guardianData = localStorage.getItem('guardian-data');

      if (token && tokenManager.isValid() && guardianData) {
        const parsedGuardian = JSON.parse(guardianData);
        setGuardian(parsedGuardian);
        setIsAuthenticated(true);
        
        // Optionally verify token with server
        try {
          const response = await guardianAPI.getProfile();
          setGuardian(response.data);
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
      
      // Store auth data
      tokenManager.set(token);
      localStorage.setItem('guardian-data', JSON.stringify(guardianInfo));
      
      setGuardian(guardianInfo);
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
      
      // Store auth data
      tokenManager.set(token);
      localStorage.setItem('guardian-data', JSON.stringify(guardianInfo));
      
      setGuardian(guardianInfo);
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

  const logout = () => {
    tokenManager.remove();
    setGuardian(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
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
