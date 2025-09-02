import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaArrowLeft, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import logger from '../../utils/logger';
import { toast } from 'react-toastify';

/**
 * 🔐 Password Reset Component
 * Handles password reset request flow with email verification
 * 
 * Features:
 * - Email validation
 * - Rate limiting protection
 * - Success/error handling
 * - Responsive design
 * - Accessibility compliant
 */
export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!email) {
      setErrors({ email: 'Email address is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);

    try {
      logger.info('Password reset requested', { email });
      
      await apiClient.post('/auth/password-reset', {
        email: email.toLowerCase().trim()
      });

      logger.info('Password reset email sent successfully', { email });
      toast.success('Password reset instructions sent to your email');
      setSent(true);

    } catch (error) {
      logger.error('Password reset request failed', error, { email });
      
      if (error.response?.status === 404) {
        setErrors({ email: 'No account found with this email address' });
      } else if (error.response?.status === 429) {
        setErrors({ general: 'Too many requests. Please try again later.' });
      } else {
        setErrors({ general: 'Failed to send reset email. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/password-reset', {
        email: email.toLowerCase().trim()
      });
      toast.success('Reset email sent again');
    } catch (error) {
      toast.error('Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              We've sent password reset instructions to <strong>{email}</strong>. 
              Please check your email and follow the link to reset your password.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Resend Email'}
              </button>

              <Link
                to="/login"
                className="w-full bg-athletiq-blue text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-athletiq-blue hover:underline disabled:opacity-50"
              >
                try again
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6"
          >
            <FaEnvelope className="w-8 h-8 text-athletiq-blue" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <p className="text-red-700 text-sm">{errors.general}</p>
            </motion.div>
          )}

          <div>
            <label 
              htmlFor="reset-email" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-athletiq-blue focus:border-athletiq-blue'
                }`}
                placeholder="Enter your email address"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm mt-2"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-athletiq-blue text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send Reset Instructions'
            )}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-athletiq-blue hover:underline text-sm font-medium flex items-center justify-center space-x-2"
            >
              <FaArrowLeft className="w-3 h-3" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
