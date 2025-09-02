import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import logger from '../../utils/logger';
import { toast } from 'react-toastify';

/**
 * 📧 Email Verification Component
 * Handles email verification for new user accounts
 * 
 * Features:
 * - Token-based verification
 * - Resend verification email
 * - Auto-redirect on success
 * - Error handling
 * - Responsive design
 * - Accessibility compliant
 */
export default function EmailVerification() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, failed, expired
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('failed');
    }
  }, [token]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyEmail = async () => {
    try {
      logger.info('Verifying email with token');
      
      const response = await apiClient.post('/auth/verify-email', { token });
      
      logger.info('Email verified successfully');
      setStatus('success');
      setEmail(response.data.email);
      toast.success('Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Email verified! You can now log in.',
            email: response.data.email 
          }
        });
      }, 3000);
      
    } catch (error) {
      logger.error('Email verification failed', error);
      
      if (error.response?.status === 400) {
        setStatus('expired');
      } else {
        setStatus('failed');
      }
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      logger.info('Resending verification email', { email });
      
      await apiClient.post('/auth/resend-verification', {
        email: email.toLowerCase().trim()
      });
      
      logger.info('Verification email resent successfully');
      toast.success('Verification email sent! Please check your inbox.');
      setResendCooldown(60); // 60 second cooldown
      
    } catch (error) {
      logger.error('Failed to resend verification email', error);
      
      if (error.response?.status === 404) {
        toast.error('No account found with this email address');
      } else if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
        setResendCooldown(120); // 2 minute cooldown for rate limiting
      } else {
        toast.error('Failed to send verification email');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <div className="w-8 h-8 border-2 border-athletiq-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verifying Your Email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
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
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">
              Your email address has been successfully verified. You can now access all features of your account.
            </p>
            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full bg-athletiq-blue text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium inline-block"
              >
                Continue to Login
              </Link>
              <p className="text-sm text-gray-500">
                You will be automatically redirected in a few seconds...
              </p>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <FaExclamationTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Link Expired
            </h2>
            <p className="text-gray-600 mb-6">
              This verification link has expired. Please enter your email below to receive a new verification link.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
              <button
                onClick={resendVerification}
                disabled={loading || resendCooldown > 0 || !email}
                className="w-full bg-athletiq-blue text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Send New Verification Email'
                )}
              </button>
            </div>
          </div>
        );

      case 'failed':
      default:
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <FaExclamationTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't verify your email address. The link may be invalid or have expired.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
              <button
                onClick={resendVerification}
                disabled={loading || resendCooldown > 0 || !email}
                className="w-full bg-athletiq-blue text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Send Verification Email'
                )}
              </button>
              <Link
                to="/register"
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium inline-block"
              >
                Create New Account
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {renderContent()}
        
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-athletiq-blue hover:underline text-sm font-medium flex items-center justify-center space-x-2"
          >
            <FaArrowLeft className="w-3 h-3" />
            <span>Back to Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
