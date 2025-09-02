import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import useUserStore from '@/store/userStore';
import apiClient from '@/api/apiClient';
import { AUTH_KEYS, persistUnifiedSession, readLegacyGuardian, clearLegacyGuardian } from '@/utils/authKeys';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserStore();
  
  // Always use auto-detect for unified login experience
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const handleAdminSuccess = (response) => {
      const userData = response.data.data || response.data.user || response.data;
      const token = response.data.token || response.data.data?.token;
      persistUnifiedSession({ token, user: userData });
      setUser(userData); // Zustand store
      toast.success(t('login_successful'));
      const from = location.state?.from?.pathname || '/';
      if (userData.role === 'SuperAdmin') {
        navigate('/admin', { replace: true });
      } else if (userData.role === 'SchoolAdmin') {
        navigate('/school', { replace: true });
      } else if (userData.role === 'Athlete') {
        navigate('/athlete/profile', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    };

    const handleGuardianSuccess = (response) => {
      const userData = response.data.data || response.data.guardian || response.data.user || response.data;
      const token = response.data.token || response.data.data?.token;
      const normalized = { ...userData, role: userData.role || 'Guardian' };
      persistUnifiedSession({ token, user: normalized });
      clearLegacyGuardian();
      setUser(normalized);
      toast.success('Guardian login successful!');
      navigate('/guardian/dashboard', { replace: true });
    };

    try {
      // Always use unified auto-detect login
      const unifiedResp = await apiClient.post('/auth/unified-login', formData);
      if (unifiedResp.data?.success) {
        const { data, userType: uType } = unifiedResp.data;
        if (uType === 'guardian' || data.role === 'Guardian') {
          handleGuardianSuccess({ data: unifiedResp.data });
        } else {
          handleAdminSuccess({ data: unifiedResp.data });
        }
        return;
      }
      toast.error(t('login_failed'));
    } catch (error) {
      console.error('Unified login error:', error);
      const backendMsg = error?.response?.data?.message || error?.message || 'Login failed';
      const isInvalid = backendMsg.toLowerCase().includes('invalid');
      if (isInvalid) {
        toast.error('Invalid email or password');
      } else if (error?.response?.status) {
        toast.error(`Login failed (${error.response.status}): ${backendMsg}`);
      } else {
        toast.error(`Login failed: ${backendMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={athletiqLogo} alt="Athletiq Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">ATHLETIQ Login Portal</h1>
          <p className="text-gray-600 mt-2">Single access point for all users</p>
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

        <div className="mt-4 text-center">
          <Link
            to="/auth/password-reset"
            className="text-sm text-athletiq-blue hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Automatically detects: Schools • Admins • Parents • Guardians
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            {t('test_accounts')}:
          </p>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <p>SuperAdmin: superadmin@athletiq.com / admin123</p>
            <p>SchoolAdmin: admin@test.com / password123</p>
            <p>Guardian: guardian@demo.com / guardian123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
