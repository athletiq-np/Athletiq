import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaGoogle, 
  FaEnvelope, 
  FaPhone, 
  FaEye, 
  FaEyeSlash,
  FaSpinner,
  FaCheck,
  FaGlobe
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';
import LanguageToggle from '../i18n/LanguageToggle';

const MultiProviderAuth = ({ 
  mode = 'signup', // 'signup' or 'login'
  onAuthSuccess,
  onModeSwitch 
}) => {
  const { t } = useTranslation();
  const [authMethod, setAuthMethod] = useState(null); // null, 'email', 'google', 'phone'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    otp: '',
    fullName: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpMethod, setOtpMethod] = useState('sms'); // 'sms' or 'whatsapp'

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    // Nepal phone number validation
    return /^(\+977|977|0)?[0-9]{10}$/.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone) => {
    // Format to +977XXXXXXXXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('977')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+977' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return '+977' + cleaned;
    }
    return phone;
  };

  const handleEmailAuth = async () => {
    setErrors({});
    
    // Validation
    const newErrors = {};
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          auth_provider: 'email'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onAuthSuccess({
          user: data.user,
          token: data.token,
          method: 'email'
        });
      } else {
        setErrors({ general: data.message || 'Authentication failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      // Initialize Google OAuth
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback
        });
        
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup
            window.google.accounts.id.renderButton(
              document.getElementById('google-signin-button'),
              { 
                theme: 'outline', 
                size: 'large',
                text: mode === 'signup' ? 'signup_with' : 'signin_with'
              }
            );
          }
        });
      } else {
        // Load Google Identity Services
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => handleGoogleAuth();
        document.head.appendChild(script);
      }
    } catch (error) {
      setErrors({ general: 'Google authentication failed' });
      setIsLoading(false);
    }
  };

  const handleGoogleCallback = async (response) => {
    try {
      const authResponse = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id_token: response.credential,
          auth_provider: 'google'
        })
      });
      
      const data = await authResponse.json();
      
      if (authResponse.ok) {
        onAuthSuccess({
          user: data.user,
          token: data.token,
          method: 'google'
        });
      } else {
        setErrors({ general: data.message || 'Google authentication failed' });
      }
    } catch (error) {
      setErrors({ general: 'Google authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async () => {
    setErrors({});
    
    if (!validatePhone(formData.phone)) {
      setErrors({ phone: 'Please enter a valid Nepal phone number' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formatPhoneNumber(formData.phone),
          method: otpMethod, // 'sms' or 'whatsapp'
          full_name: formData.fullName
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
      } else {
        setErrors({ phone: data.message || 'Failed to send OTP' });
      }
    } catch (error) {
      setErrors({ phone: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    setErrors({});
    
    if (!formData.otp || formData.otp.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: formatPhoneNumber(formData.phone),
          otp: formData.otp,
          full_name: formData.fullName,
          auth_provider: 'phone'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onAuthSuccess({
          user: data.user,
          token: data.token,
          method: 'phone'
        });
      } else {
        setErrors({ otp: data.message || 'Invalid OTP' });
      }
    } catch (error) {
      setErrors({ otp: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const AuthMethodSelector = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'signup' ? t('auth.signUp') : t('auth.signIn')}
        </h2>
        <p className="text-gray-600">
          {mode === 'signup' ? t('auth.signUpSubtitle') : t('auth.signInSubtitle')}
        </p>
      </div>

      {/* Language Toggle */}
      <div className="flex justify-center">
        <LanguageToggle />
      </div>

      {/* Auth Methods */}
      <div className="space-y-3">
        {/* Google */}
        <button
          onClick={() => setAuthMethod('google')}
          className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaGoogle className="w-5 h-5 text-red-500" />
          <span className="font-medium">
            {mode === 'signup' ? t('auth.signUpWith') : t('auth.signInWith')} Google
          </span>
        </button>

        {/* Email */}
        <button
          onClick={() => setAuthMethod('email')}
          className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaEnvelope className="w-5 h-5 text-blue-500" />
          <span className="font-medium">
            {mode === 'signup' ? t('auth.signUpWith') : t('auth.signInWith')} {t('auth.email')}
          </span>
        </button>

        {/* Phone */}
        <button
          onClick={() => setAuthMethod('phone')}
          className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaPhone className="w-5 h-5 text-green-500" />
          <span className="font-medium">
            {mode === 'signup' ? t('auth.signUpWith') : t('auth.signInWith')} {t('auth.phone')}
          </span>
        </button>
      </div>

      {/* Mode Switch */}
      <div className="text-center text-sm">
        <span className="text-gray-600">
          {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
        </span>
        <button
          onClick={() => onModeSwitch(mode === 'signup' ? 'login' : 'signup')}
          className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
        >
          {mode === 'signup' ? t('auth.signIn') : t('auth.signUp')}
        </button>
      </div>
    </div>
  );

  const EmailForm = () => (
    <div className="space-y-4">
      <button
        onClick={() => setAuthMethod(null)}
        className="text-blue-600 hover:text-blue-700 text-sm"
      >
        ← {t('common.back')}
      </button>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {mode === 'signup' ? t('auth.signUpWith') : t('auth.signInWith')} {t('auth.email')}
        </h3>

        {mode === 'signup' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.fullName')}
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('form.fullNamePlaceholder')}
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.email')}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('auth.emailPlaceholder')}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('auth.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4 text-gray-400" /> : <FaEye className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {mode === 'signup' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.confirmPassword')}
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('auth.confirmPasswordPlaceholder')}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        )}

        {mode === 'signup' && (
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t('auth.agreeToTerms')} <a href="#" className="text-blue-600 hover:text-blue-700">{t('auth.termsAndConditions')}</a>
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
          </div>
        )}

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        <button
          onClick={handleEmailAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaEnvelope className="w-4 h-4" />
          )}
          <span>{mode === 'signup' ? t('auth.signUp') : t('auth.signIn')}</span>
        </button>
      </div>
    </div>
  );

  const PhoneForm = () => (
    <div className="space-y-4">
      <button
        onClick={() => setAuthMethod(null)}
        className="text-blue-600 hover:text-blue-700 text-sm"
      >
        ← {t('common.back')}
      </button>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {mode === 'signup' ? t('auth.signUpWith') : t('auth.signInWith')} {t('auth.phone')}
        </h3>

        {!otpSent ? (
          <>
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.fullName')}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('form.fullNamePlaceholder')}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.phoneNumber')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+977 98XXXXXXXX"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.otpMethod')}
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="sms"
                    checked={otpMethod === 'sms'}
                    onChange={(e) => setOtpMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">SMS</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="whatsapp"
                    checked={otpMethod === 'whatsapp'}
                    onChange={(e) => setOtpMethod(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">WhatsApp</span>
                </label>
              </div>
            </div>

            <button
              onClick={sendOTP}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaPhone className="w-4 h-4" />
              )}
              <span>{t('auth.sendOTP')}</span>
            </button>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-green-800">
                <FaCheck className="w-4 h-4" />
                <span className="font-medium">{t('auth.otpSent')}</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {t('auth.otpSentToPhone')} {formData.phone} {t('auth.via')} {otpMethod.toUpperCase()}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.enterOTP')}
              </label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest ${
                  errors.otp ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="000000"
                maxLength="6"
              />
              {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setOtpSent(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('auth.resendOTP')}
              </button>
              <button
                onClick={verifyOTP}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaCheck className="w-4 h-4" />
                )}
                <span>{t('auth.verifyOTP')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const GoogleForm = () => {
    // Trigger Google auth immediately
    React.useEffect(() => {
      handleGoogleAuth();
    }, []);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setAuthMethod(null)}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          ← {t('common.back')}
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            {mode === 'signup' ? t('auth.signUpWith') : t('auth.signInWith')} Google
          </h3>
          
          <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
            <FaSpinner className="w-4 h-4 animate-spin" />
            <span>{t('auth.redirectingToGoogle')}</span>
          </div>

          <div id="google-signin-button" className="flex justify-center"></div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6"
    >
      {!authMethod && <AuthMethodSelector />}
      {authMethod === 'email' && <EmailForm />}
      {authMethod === 'phone' && <PhoneForm />}
      {authMethod === 'google' && <GoogleForm />}
    </motion.div>
  );
};

export default MultiProviderAuth;
