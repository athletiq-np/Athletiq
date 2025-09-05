/**
 * Auth Status Checker
 * Simple utility to check authentication status in development
 */

import { authStorage, AUTH_CONFIG } from '@/config/auth.config';

export const checkAuthStatus = () => {
  console.log('🔍 Checking authentication status...');
  
  const token = authStorage.getToken();
  const refreshToken = authStorage.getRefreshToken();
  const userData = authStorage.getUserData();
  const isAuthenticated = authStorage.isAuthenticated();
  
  console.log('📋 Authentication Status:', {
    isAuthenticated,
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    hasUserData: !!userData,
    tokenLength: token?.length || 0,
    refreshTokenLength: refreshToken?.length || 0
  });
  
  if (userData) {
    console.log('👤 User Data:', {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      user_type: userData.user_type
    });
  }
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;
      const timeUntilExpiry = payload.exp - currentTime;
      
      console.log('🔑 Token Info:', {
        isExpired,
        expiresAt: new Date(payload.exp * 1000).toLocaleString(),
        timeUntilExpiry: timeUntilExpiry > 0 ? `${Math.floor(timeUntilExpiry / 60)} minutes` : 'Expired',
        userId: payload.user_id,
        tokenType: payload.token_type
      });
    } catch (error) {
      console.error('❌ Could not parse token:', error);
    }
  }
  
  return {
    isAuthenticated,
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    hasUserData: !!userData,
    userData
  };
};

// Quick fix for authentication issues
export const quickAuthFix = () => {
  console.log('🔧 Attempting quick authentication fix...');
  
  // Clear any corrupted auth data
  authStorage.clearAll();
  console.log('✅ Cleared authentication data');
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
  
  console.log('🔄 Redirecting to login in 1 second...');
};

// Test API call with current auth
export const testApiCall = async () => {
  console.log('🔄 Testing API call with current authentication...');
  
  const token = authStorage.getToken();
  if (!token) {
    console.log('❌ No token available for API test');
    return;
  }
  
  try {
    const response = await fetch('/api/athletes/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful. Sample data:', {
        count: data.results?.length || data.length || 'Unknown',
        firstItem: data.results?.[0] || data[0] || 'No items'
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ API call failed:', errorData);
    }
  } catch (error) {
    console.error('❌ API call error:', error);
  }
};

// Add to window for console access
if (process.env.NODE_ENV === 'development') {
  window.checkAuthStatus = checkAuthStatus;
  window.quickAuthFix = quickAuthFix;
  window.testApiCall = testApiCall;
  
  // Auto-check on load
  setTimeout(() => {
    console.log('\n=== 🔍 ATHLETIQ AUTH DEBUG ===');
    console.log('Available debugging functions:');
    console.log('• checkAuthStatus() - Check current auth state');
    console.log('• testApiCall() - Test API with current auth');
    console.log('• quickAuthFix() - Clear auth and redirect to login');
    console.log('• testAuth() - Test auth endpoints');
    console.log('• testUploadAuth() - Test upload auth');
    console.log('• authDebug.runDiagnostic() - Full auth diagnostic');
    console.log('===============================\n');
    
    checkAuthStatus();
  }, 2000);
}

export default {
  checkAuthStatus,
  quickAuthFix,
  testApiCall
};