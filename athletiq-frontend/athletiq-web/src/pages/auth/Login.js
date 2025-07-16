import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaUserShield, FaGraduationCap, FaUserTie } from 'react-icons/fa';
import useUserStore from '@/store/userStore';
import apiClient from '@/api/apiClient';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserStore();
  
  const [userType, setUserType] = useState('admin'); // 'admin', 'guardian'
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
        // Backend returns user data in response.data.data
        const userData = response.data.data;
        setUser(userData);
        toast.success(t('login_successful'));
        
        // Redirect based on user role
        const from = location.state?.from?.pathname || '/';
        if (userData.role === 'SuperAdmin') {
          navigate('/admin', { replace: true });
        } else if (userData.role === 'SchoolAdmin') {
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

        {/* User Type Selection */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                userType === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FaUserTie className="mr-2" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => setUserType('guardian')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                userType === 'guardian'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FaUserShield className="mr-2" />
              Guardian
            </button>
          </div>
        </div>

        {userType === 'admin' ? (
          // Admin Login Form
          <>
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
          </>
        ) : (
          // Guardian Access Options
          <div className="space-y-4">
            <div className="text-center mb-6">
              <FaUserShield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800">Guardian Access</h3>
              <p className="text-sm text-gray-600">Manage your athlete's profile and activities</p>
            </div>

            {/* Guardian Login Button */}
            <button
              onClick={() => navigate('/guardian-claim')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <FaUserShield className="mr-2" />
              Access Guardian Portal
            </button>

            {/* Guardian Signup/Claim Button */}
            <button
              onClick={() => navigate('/guardian-claim')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
            >
              <FaGraduationCap className="mr-2" />
              Register as Guardian
            </button>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-600">
                Use your claim code or search for your student to get started
              </p>
            </div>

            <div className="border-t pt-4 mt-6">
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact your school administration or call support.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
