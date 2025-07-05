import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useUserStore from '@/store/userStore';
import apiClient from '@/api/apiClient';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserStore();
  
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

    try {
      const response = await apiClient.post('/auth/login', formData);
      
      if (response.data.success) {
        setUser(response.data.user);
        toast.success(t('login_successful'));
        
        // Redirect based on user role
        const from = location.state?.from?.pathname || '/';
        if (response.data.user.role === 'SuperAdmin') {
          navigate('/admin', { replace: true });
        } else if (response.data.user.role === 'SchoolAdmin') {
          navigate('/school', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={athletiqLogo} alt="Athletiq Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">{t('login_title')}</h1>
          <p className="text-gray-600 mt-2">{t('login_subtitle')}</p>
        </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('enter_password')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? t('logging_in') : t('login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('test_accounts')}:
          </p>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <p>SuperAdmin: superadmin@athletiq.com / admin123</p>
            <p>SchoolAdmin: admin@test.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
