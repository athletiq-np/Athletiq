import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import useUserStore from '@/store/userStore';
import { unifiedAuthAPI } from '@/utils/apiClient';
import { AUTH_KEYS } from '@/utils/authKeys';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

// Helper function to get role-based redirect path
const getRoleBasedPath = (role, userType) => {
  // Handle different user types
  if (userType === 'guardian') {
    return '/guardian';
  }
  
  if (userType === 'athlete') {
    return '/athlete/profile';
  }
  
  // Handle admin/system user roles
  switch (role?.toLowerCase()) {
    case 'superadmin':
      return '/admin';
    case 'schooladmin':
      return '/school';
    case 'coach':
      return '/coach/dashboard';
    case 'referee':
      return '/referee/dashboard';
    case 'organization':
      return '/organization/dashboard';
    default:
      return '/dashboard';
  }
};

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setUser } = useUserStore();
  
  // Check for session expired parameter
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'session_expired') {
      toast.error('Your session has expired. Please log in again.', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }, [searchParams]);
  
  // Always use auto-detect for unified login experience
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Starting login process...', { email: formData.email });
      
      // Use the unified auth API login method
      const result = await unifiedAuthAPI.login({
        email: formData.email,
        password: formData.password
      });
      
      console.log('✅ Login successful:', result);

      // Extract data from nested response
      const { data } = result;
      
      // Store authentication data
      if (data.token) {
        localStorage.setItem(AUTH_KEYS.TOKEN, data.token);
      }
      if (data.refresh_token) {
        localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(data.user));
        setUser(data.user);
      }
      
      // Get redirect path from user data or use default
      const redirectPath = data.redirect_path || 
                          location.state?.from?.pathname || 
                          getRoleBasedPath(data.user?.role, data.user_type);
      
      console.log('🎯 Redirect logic:', {
        from_response: data.redirect_path,
        from_location: location.state?.from?.pathname,
        from_role_logic: getRoleBasedPath(data.user?.role, data.user_type),
        final_path: redirectPath,
        user_role: data.user?.role,
        user_type: data.user_type
      });
      
      // Navigate to the determined path
      navigate(redirectPath, { replace: true });
      toast.success(t('login_successful') || 'Login successful!');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={athletiqLogo} alt="Athletiq Logo" className="h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-2">Please sign in to your account</p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <FaExclamationCircle className="mr-2" />
              {error}
            </div>
          )}
        </div>

        {/* Simplified Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('login_email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-athletiq-green"
              placeholder={t('enter_email')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-athletiq-green"
              placeholder={t('enter_password')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-athletiq-green text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-athletiq-green disabled:opacity-50 font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                {t('logging_in')}
              </span>
            ) : (
              t('login')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Automatically detects: Schools • Admins • Parents • Guardians
          </p>
        </div>


      </div>
    </div>
  );
};