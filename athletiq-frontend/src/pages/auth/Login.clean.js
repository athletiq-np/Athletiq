import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import useAuth from '@/hooks/useAuth';
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
    case 'super_admin':
    case 'super-admin':
    case 'admin':
      return '/admin';
    case 'schooladmin':
    case 'school_admin':
    case 'school-admin':
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
  const { login, loading: authLoading, error: authError, isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
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
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError(t('email_password_required') || 'Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Starting login process...', { email: formData.email });
      
      // Use the auth hook's login method
      const user = await login(formData.email, formData.password);
      
      console.log('✅ Login successful:', user);

      // Get redirect path
      const redirectPath = location.state?.from?.pathname || 
                          getRoleBasedPath(user?.role, user?.user_type) ||
                          '/';
      
      console.log('🎯 Redirecting to:', redirectPath);
      
      // Navigate to the determined path
      navigate(redirectPath, { replace: true });
      toast.success(t('login_successful') || 'Login successful!');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <img 
            src={athletiqLogo} 
            alt="Athletiq"
            className="mx-auto h-20 w-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('sign_in') || 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('welcome_back') || 'Welcome back to Athletiq'}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Display */}
          {(error || authError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <FaExclamationCircle className="mr-2" />
              <span className="text-sm">{error || authError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                {t('email') || 'Email address'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-athletiq-green focus:border-athletiq-green focus:z-10 sm:text-sm"
                placeholder={t('email') || 'Email address'}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">
                {t('password') || 'Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-athletiq-green focus:border-athletiq-green focus:z-10 sm:text-sm"
                placeholder={t('password') || 'Password'}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={loading || authLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-athletiq-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-athletiq-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {(loading || authLoading) ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {t('signing_in') || 'Signing in...'}
                </>
              ) : (
                t('sign_in') || 'Sign in'
              )}
            </button>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between text-sm">
            <a
              href="#"
              className="font-medium text-athletiq-green hover:text-green-700"
            >
              {t('forgot_password') || 'Forgot your password?'}
            </a>
            <a
              href="/register"
              className="font-medium text-athletiq-green hover:text-green-700"
            >
              {t('create_account') || 'Create an account'}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}