import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaUserShield, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaBriefcase, FaLock, FaChild, FaSchool, FaCalendarAlt,
  FaCheckCircle, FaSpinner, FaEye, FaEyeSlash, FaArrowLeft,
  FaUserFriends, FaTrophy, FaFileAlt, FaHome, FaSignOutAlt,
  FaPlus, FaEdit, FaSave, FaTimes, FaInfoCircle, FaGraduationCap,
  FaChartLine, FaUsers, FaMedal, FaBook, FaBell, FaCog
} from 'react-icons/fa';

import { GuardianAuthProvider, useGuardianAuth } from '../hooks/useGuardianAuth';
import { useGuardianChildren } from '../hooks/useGuardianChildren';
import HybridChildManagement from '../components/HybridChildManagement';
import EnhancedGuardianDashboard from '../components/EnhancedGuardianDashboard';
import EnhancedAthletePanel from '../components/EnhancedAthletePanel';
import apiClient from '@/api/apiClient';

// Form defaults
const defaultRegister = {
  email: '',
  phone: '+977-',
  studentName: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
  schoolName: '',
  schoolId: null
};

const defaultLogin = {
  email: '',
  password: ''
};

const defaultChild = {
  childFullName: '',
  dateOfBirth: '',
  gender: 'Male',
  grade: '',
  schoolName: '',
  schoolId: null
};

// Main portal content component
function UnifiedPortalContent() {
  const { guardian, isAuthenticated, loading: authLoading, login, register, logout, updateProfile } = useGuardianAuth();
  const { children, getChildrenStats, refreshChildren, loading: childrenLoading } = useGuardianChildren();
  const navigate = useNavigate();
  const location = useLocation();

  // View state
  const [currentView, setCurrentView] = useState('welcome');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Forms state
  const [registerData, setRegisterData] = useState({ ...defaultRegister });
  const [loginData, setLoginData] = useState({ ...defaultLogin });
  const [childData, setChildData] = useState({ ...defaultChild });
  const [profileData, setProfileData] = useState({});
  const [editing, setEditing] = useState(false);

  // UI state
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // School search state
  const [schools, setSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const schoolSearchTimeout = useRef(null);

  // Effects
  useEffect(() => {
    if (isAuthenticated && guardian) {
      setCurrentView('dashboard');
      setProfileData({
        fullName: guardian.fullName || guardian.full_name || '',
        email: guardian.email || '',
        phone: guardian.phone || guardian.phoneNumber || guardian.phone_number || '',
        address: guardian.address || '',
        relationship: guardian.relationship || 'parent'
      });
    } else if (!authLoading) {
      setCurrentView('welcome');
    }
  }, [isAuthenticated, guardian, authLoading]);

  useEffect(() => {
    loadSchools();
    return () => {
      if (schoolSearchTimeout.current) clearTimeout(schoolSearchTimeout.current);
    };
  }, []);

  // School loading function
  const loadSchools = (searchTerm = '') => {
    if (schoolSearchTimeout.current) clearTimeout(schoolSearchTimeout.current);
    schoolSearchTimeout.current = setTimeout(async () => {
      try {
        const url = searchTerm
          ? `/guardian/schools?search=${encodeURIComponent(searchTerm)}`
          : '/guardian/schools';
        const res = await apiClient.get(url);
        if (res.data.success) setSchools(res.data.data || res.data.schools || []);
      } catch (error) {
        console.error('Failed to load schools:', error);
      }
    }, 300);
  };

  // School selection handlers
  const selectSchool = (school, forRegistration = false) => {
    if (forRegistration) {
      setRegisterData(prev => ({
        ...prev,
        schoolName: school.name,
        schoolId: school.id
      }));
    } else {
      setChildData(prev => ({
        ...prev,
        schoolName: school.name,
        schoolId: school.id
      }));
    }
    setSchoolSearch('');
  };

  const clearSchool = (forRegistration = false) => {
    setSchoolSearch('');
    if (forRegistration) {
      setRegisterData(prev => ({ ...prev, schoolName: '', schoolId: null }));
    } else {
      setChildData(prev => ({ ...prev, schoolName: '', schoolId: null }));
    }
  };

  // Authentication handlers
  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        fullName: `Guardian of ${registerData.studentName}`,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        address: '',
        relationship: 'parent'
      });

      if (result.success) {
        // Auto-add the child from registration
        await addChildFromRegistration();
        toast.success('Registration successful! Welcome to your dashboard!');
        setCurrentView('dashboard');
        setRegisterData({ ...defaultRegister });
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(loginData.email, loginData.password);
      if (result.success) {
        toast.success('Login successful!');
        setCurrentView('dashboard');
        setLoginData({ ...defaultLogin });
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('welcome');
    setActiveTab('overview');
    setProfileData({});
    setEditing(false);
  };

  // Child management
  const addChildFromRegistration = async () => {
    if (!registerData.studentName || !registerData.dateOfBirth) return;

    try {
      const response = await apiClient.post('/guardian-simple/add-child', {
        childFullName: registerData.studentName,
        dateOfBirth: registerData.dateOfBirth,
        gender: 'Male',
        grade: '',
        schoolName: registerData.schoolName,
        schoolId: registerData.schoolId
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('guardian-token')}` }
      });

      if (response.data.success) {
        await refreshChildren();
        toast.success(`Child ${registerData.studentName} added successfully!`);
      }
    } catch (error) {
      console.error('Failed to add child from registration:', error);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/guardian-simple/add-child', childData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('guardian-token')}` }
      });

      if (response.data.success) {
        if (response.data.linkedToSchool) {
          toast.success(`${childData.childFullName} linked to existing school record with Nepal Athlete ID!`);
        } else {
          toast.success(`${childData.childFullName} added! Pending school approval.`);
        }
        setChildData({ ...defaultChild });
        await refreshChildren();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  // Profile management
  const handleEditProfile = () => setEditing(true);
  
  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleInputChange = (e, formType = 'profile') => {
    const { name, value } = e.target;
    
    switch (formType) {
      case 'register':
        setRegisterData(prev => ({ ...prev, [name]: value }));
        break;
      case 'login':
        setLoginData(prev => ({ ...prev, [name]: value }));
        break;
      case 'child':
        setChildData(prev => ({ ...prev, [name]: value }));
        break;
      case 'profile':
      default:
        setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Guardian Portal...</p>
        </div>
      </div>
    );
  }

  // Navigation tabs for dashboard
  const navigationTabs = [
    { id: 'overview', name: 'Overview', icon: FaHome },
    { id: 'children', name: 'My Children', icon: FaChild },
    { id: 'activities', name: 'Activities', icon: FaTrophy },
    { id: 'documents', name: 'Documents', icon: FaFileAlt },
    { id: 'enhanced', name: 'Enhanced Athletes', icon: FaMedal },
    { id: 'profile', name: 'Profile', icon: FaUser }
  ];

  // Dashboard overview render
  const renderOverview = () => {
    const stats = getChildrenStats();
    
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {guardian?.fullName || guardian?.full_name || 'Guardian'}!
              </h1>
              <p className="text-blue-100">
                Manage your children's sports activities and track their progress
              </p>
            </div>
            <div className="hidden md:block">
              <FaUserFriends className="text-6xl opacity-20" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaChild />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Total Children</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaCheckCircle />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Active Athletes</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FaSpinner />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Pending Approval</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FaSchool />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Schools</h2>
                <p className="text-2xl font-semibold text-gray-900">{stats.schools}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <FaInfoCircle className="mx-auto text-4xl mb-4" />
              <p>No recent activity to display</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Children management render
  const renderChildren = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Child Management</h3>
        </div>
        <div className="p-6">
          <HybridChildManagement />
        </div>
      </div>
    </div>
  );

  // Profile management render
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
          {!editing ? (
            <button
              onClick={handleEditProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaEdit className="mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProfile}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <FaSave className="mr-2" />
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="fullName"
                  value={profileData.fullName || ''}
                  onChange={(e) => handleInputChange(e, 'profile')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData.fullName || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={profileData.email || ''}
                  onChange={(e) => handleInputChange(e, 'profile')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData.email || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone || ''}
                  onChange={(e) => handleInputChange(e, 'profile')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData.phone || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              {editing ? (
                <input
                  type="text"
                  name="address"
                  value={profileData.address || ''}
                  onChange={(e) => handleInputChange(e, 'profile')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profileData.address || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Welcome screen render
  const renderWelcome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <FaUserShield className="mx-auto text-6xl text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guardian Portal</h1>
          <p className="text-gray-600">Manage your children's athletic journey</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => setCurrentView('register')}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Register
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>New to our platform? Register to get started.</p>
            <p>Already have an account? Login to continue.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Login form render
  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setCurrentView('welcome')}
              className="mr-3 p-2 text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={(e) => handleInputChange(e, 'login')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  name="password"
                  value={loginData.password}
                  onChange={(e) => handleInputChange(e, 'login')}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                'Login to Guardian Portal'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setCurrentView('register')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Don't have an account? Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Registration form render
  const renderRegister = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setCurrentView('welcome')}
              className="mr-3 p-2 text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Guardian Registration</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={(e) => handleInputChange(e, 'register')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={registerData.phone}
                    onChange={(e) => handleInputChange(e, 'register')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+977-9876543210"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name
                </label>
                <div className="relative">
                  <FaChild className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="studentName"
                    value={registerData.studentName}
                    onChange={(e) => handleInputChange(e, 'register')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Child's full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={registerData.dateOfBirth}
                    onChange={(e) => handleInputChange(e, 'register')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    name="password"
                    value={registerData.password}
                    onChange={(e) => handleInputChange(e, 'register')}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={(e) => handleInputChange(e, 'register')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* School Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Selection
              </label>
              {registerData.schoolName ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-600 mr-2" />
                    <span className="text-green-800">{registerData.schoolName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearSchool(true)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <FaSchool className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      loadSchools(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search for school..."
                  />
                  {schoolSearch && schools.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                      {schools.map((school) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => selectSchool(school, true)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                        >
                          <FaSchool className="mr-3 text-gray-400" />
                          <div>
                            <div className="font-medium">{school.name}</div>
                            <div className="text-sm text-gray-500">{school.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Guardian Account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setCurrentView('login')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Already have an account? Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Dashboard render - Now uses Enhanced Dashboard with all features
  const renderDashboard = () => {
    // If we later differentiate dashboards, keep legacy for children tab
    if (activeTab === 'enhanced') {
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Enhanced Athlete Management</h1>
          <p className="text-sm text-gray-600 mb-6">Search, bulk import, and manage enhanced athlete records using the new unified endpoints.</p>
          <EnhancedAthletePanel />
        </div>
      );
    }
    return <EnhancedGuardianDashboard />;
  };

  // Main render logic
  switch (currentView) {
    case 'login':
      return renderLogin();
    case 'register':
      return renderRegister();
    case 'dashboard':
      return renderDashboard();
    default:
      return renderWelcome();
  }
}

// Main export with provider wrapper
export default function UnifiedGuardianPortal() {
  return (
    <GuardianAuthProvider>
      <UnifiedPortalContent />
    </GuardianAuthProvider>
  );
}
