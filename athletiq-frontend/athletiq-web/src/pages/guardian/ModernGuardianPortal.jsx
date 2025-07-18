// src/pages/guardian/ModernGuardianPortal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUserShield, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaBriefcase, FaLock, FaChild, FaSchool, FaCalendarAlt,
  FaCheckCircle, FaSpinner, FaEye, FaEyeSlash, FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';

// Single source of truth for empty forms
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

export default function ModernGuardianPortal() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('welcome');
  const [loading, setLoading] = useState(false);

  // Auth state
  const [guardianInfo, setGuardianInfo] = useState(null);
  const [token, setToken] = useState(null);

  // Password show/hide
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forms
  const [registerData, setRegisterData] = useState({ ...defaultRegister });
  const [loginData, setLoginData] = useState({ ...defaultLogin });
  const [childData, setChildData] = useState({ ...defaultChild });

  // School search
  const [schools, setSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const schoolSearchTimeout = useRef(null);

  // List of guardian's children
  const [children, setChildren] = useState([]);

  // ==== EFFECTS ====

  // On mount: check for existing login
  useEffect(() => {
    const storedToken = localStorage.getItem('guardianToken');
    const storedInfo = localStorage.getItem('guardianInfo');
    if (storedToken && storedInfo) {
      setToken(storedToken);
      setGuardianInfo(JSON.parse(storedInfo));
      setCurrentView('dashboard');
      loadChildren(storedToken);
    }
  }, []);

  // On mount: load school list
  useEffect(() => {
    loadSchools();
  }, []);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (schoolSearchTimeout.current) clearTimeout(schoolSearchTimeout.current);
    };
  }, []);

  // ==== API LOADERS ====

  // Load schools with optional search
  const loadSchools = (searchTerm = '') => {
    if (schoolSearchTimeout.current) clearTimeout(schoolSearchTimeout.current);
    schoolSearchTimeout.current = setTimeout(async () => {
      try {
        const url = searchTerm
          ? `/guardian-simple/schools?search=${encodeURIComponent(searchTerm)}`
          : '/guardian-simple/schools';
        const res = await apiClient.get(url);
        if (res.data.success) setSchools(res.data.data);
      } catch {
        toast.error('Failed to load schools list');
      }
    }, 250);
  };

  // Load guardian's children
  const loadChildren = async (authToken = token) => {
    try {
      const response = await apiClient.get('/guardian-simple/children', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.data.success) setChildren(response.data.data);
    } catch {
      // Silent fail for now
    }
  };

  // ==== HANDLERS ====

  // School search field handler for Registration & Add Child
  const handleSchoolTyping = (text, forRegistration = true) => {
    setSchoolSearch(text);
    loadSchools(text);
    if (forRegistration) {
      setRegisterData(prev => ({ ...prev, schoolName: '', schoolId: null }));
    } else {
      setChildData(prev => ({ ...prev, schoolName: '', schoolId: null }));
    }
  };

  // School select (from dropdown)
  const selectSchool = (school, forRegistration = true) => {
    setSchoolSearch(school.school_name);
    if (forRegistration) {
      setRegisterData(prev => ({ ...prev, schoolName: school.school_name, schoolId: school.school_id }));
    } else {
      setChildData(prev => ({ ...prev, schoolName: school.school_name, schoolId: school.school_id }));
    }
  };

  // Clear selected school and allow re-search
  const clearSchool = (forRegistration = true) => {
    setSchoolSearch('');
    if (forRegistration) {
      setRegisterData(prev => ({ ...prev, schoolName: '', schoolId: null }));
    } else {
      setChildData(prev => ({ ...prev, schoolName: '', schoolId: null }));
    }
  };

  // ==== REGISTER ====
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match!');
      setLoading(false);
      return;
    }
    try {
      // 1. Register guardian
      const response = await apiClient.post('/guardian-simple/register', {
        fullName: `Guardian of ${registerData.studentName}`,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        address: '',
        occupation: 'Guardian'
      });

      if (!response.data.success) throw new Error(response.data.message);

      toast.success('Registration successful! Logging you in...');
      // 2. Login guardian
      const loginResponse = await apiClient.post('/guardian-simple/login', {
        email: registerData.email,
        password: registerData.password
      });

      if (!loginResponse.data.success) throw new Error(loginResponse.data.message);

      const { token, guardian } = loginResponse.data.data;
      setToken(token);
      setGuardianInfo(guardian);
      localStorage.setItem('guardianToken', token);
      localStorage.setItem('guardianInfo', JSON.stringify(guardian));

      // 3. Add child (auto)
      const addChildResponse = await apiClient.post('/guardian-simple/add-child', {
        childFullName: registerData.studentName,
        dateOfBirth: registerData.dateOfBirth,
        gender: 'Male',
        grade: '',
        schoolName: registerData.schoolName,
        schoolId: registerData.schoolId
      }, { headers: { 'Authorization': `Bearer ${token}` } });

      if (addChildResponse.data.success) {
        toast.success(`Child ${registerData.studentName} added to your account!`);
      }

      setRegisterData({ ...defaultRegister });
      setSchoolSearch('');
      setCurrentView('dashboard');
      loadChildren(token);

    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ==== LOGIN ====
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/guardian-simple/login', loginData);
      if (!response.data.success) throw new Error(response.data.message);
      const { token, guardian } = response.data.data;
      setToken(token);
      setGuardianInfo(guardian);
      localStorage.setItem('guardianToken', token);
      localStorage.setItem('guardianInfo', JSON.stringify(guardian));
      toast.success('Login successful!');
      setCurrentView('dashboard');
      loadChildren(token);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ==== ADD CHILD ====
  const handleAddChild = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/guardian-simple/add-child', childData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        if (response.data.linkedToSchool) {
          toast.success(`✅ Success! ${childData.childFullName} linked to school. Athlete ID: ${response.data.athleteId}`);
        } else {
          toast.success(`✅ Child added! Awaiting school approval for Athlete ID.`);
        }
        setChildData({ ...defaultChild });
        setSchoolSearch('');
        setCurrentView('dashboard');
        loadChildren();
      } else {
        toast.error(response.data.message || 'Failed to add child');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  // ==== LOGOUT ====
  const handleLogout = () => {
    localStorage.removeItem('guardianToken');
    localStorage.removeItem('guardianInfo');
    setToken(null);
    setGuardianInfo(null);
    setChildren([]);
    setRegisterData({ ...defaultRegister });
    setLoginData({ ...defaultLogin });
    setChildData({ ...defaultChild });
    setSchoolSearch('');
    setCurrentView('welcome');
    toast.success('Logged out successfully');
  };

  // ==== RENDER COMPONENTS ====

  // School search dropdown
  const renderSchoolDropdown = (onSelect, forRegistration = true) => (
    schoolSearch && !((forRegistration ? registerData : childData).schoolName) && schools.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {schools.map((school, idx) => (
          <button
            key={school.school_id || idx}
            type="button"
            className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            onClick={() => onSelect(school, forRegistration)}
          >
            <div className="font-medium">{school.school_name}</div>
            <div className="text-sm text-gray-500">{school.city || 'City not specified'}</div>
          </button>
        ))}
      </div>
    )
  );

  // ==== VIEWS ====

  // Welcome
  const WelcomeScreen = () => (
    <div className="text-center">
      <div className="mb-8">
        <FaUserShield className="h-20 w-20 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Guardian Portal</h1>
        <p className="text-gray-600 text-lg">Quick registration with your child's school details. Get instant access to your dashboard!</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">New Guardian</h3>
          <p className="text-gray-600 mb-4">Register with email, phone, searchable school, and child details</p>
          <button
            onClick={() => {
              setCurrentView('register');
              loadSchools();
            }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Quick Registration
          </button>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Existing Guardian</h3>
          <p className="text-gray-600 mb-4">Login to access your guardian dashboard</p>
          <button
            onClick={() => setCurrentView('login')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Login to Dashboard
          </button>
        </div>
      </div>
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>✨ Simple Process:</strong> Email & Phone • Search School • Child Name & DOB • Create Password & Confirm → Guardian Dashboard
        </p>
      </div>
    </div>
  );

  // Registration
  const RegistrationForm = () => (
    <div>
      <div className="flex items-center mb-6">
        <button onClick={() => setCurrentView('welcome')} className="mr-4 text-gray-600 hover:text-gray-800" type="button">
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Guardian Registration</h2>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          <strong>✨ Quick Registration:</strong> Register with your child's details and get instant access to your guardian dashboard!
        </p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaEnvelope className="inline mr-2" />Email Address
          </label>
          <input
            type="email"
            value={registerData.email}
            onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
            required
          />
        </div>
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaPhone className="inline mr-2" />Phone Number
          </label>
          <input
            type="tel"
            value={registerData.phone}
            onChange={e => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+977-9XXXXXXXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* School search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaSchool className="inline mr-2" />School
          </label>
          <div className="relative">
            <input
              type="text"
              value={registerData.schoolName || schoolSearch}
              onChange={e => handleSchoolTyping(e.target.value, true)}
              placeholder="Search for your child's school..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!registerData.schoolName}
              required
            />
            {renderSchoolDropdown(selectSchool, true)}
            {registerData.schoolName && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-green-600">✓ Selected: {registerData.schoolName}</p>
                <button
                  type="button"
                  onClick={() => clearSchool(true)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Change School
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Student name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaChild className="inline mr-2" />Student Name
          </label>
          <input
            type="text"
            value={registerData.studentName}
            onChange={e => setRegisterData(prev => ({ ...prev, studentName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your child's full name"
            required
          />
        </div>
        {/* DOB */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-2" />Student Date of Birth
          </label>
          <input
            type="date"
            value={registerData.dateOfBirth}
            onChange={e => setRegisterData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaLock className="inline mr-2" />Create Password
          </label>
          <div className="relative">
            <input
              type={showRegisterPassword ? "text" : "password"}
              value={registerData.password}
              onChange={e => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Create a secure password"
              minLength="6"
              required
            />
            <button
              type="button"
              onClick={() => setShowRegisterPassword(v => !v)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
        </div>
        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaLock className="inline mr-2" />Confirm Password
          </label>
          <div className="relative">
            <input
              type={showRegisterPassword ? "text" : "password"}
              value={registerData.confirmPassword}
              onChange={e => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                registerData.confirmPassword && registerData.password !== registerData.confirmPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Confirm your password"
              minLength="6"
              required
            />
          </div>
          {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
          {registerData.confirmPassword && registerData.password === registerData.confirmPassword && (
            <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? <FaSpinner className="animate-spin inline mr-2" /> : null}
          {loading ? 'Creating Account...' : 'Register & Go to Dashboard'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?
          <button onClick={() => setCurrentView('login')} className="text-blue-600 hover:text-blue-800 ml-1" type="button">
            Login here
          </button>
        </p>
      </div>
    </div>
  );

  // Login
  const LoginForm = () => (
    <div>
      <div className="flex items-center mb-6">
        <button onClick={() => setCurrentView('welcome')} className="mr-4 text-gray-600 hover:text-gray-800" type="button">
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Guardian Login</h2>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaEnvelope className="inline mr-2" />Email
          </label>
          <input
            type="email"
            value={loginData.email}
            onChange={e => setLoginData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaLock className="inline mr-2" />Password
          </label>
          <div className="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              value={loginData.password}
              onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(v => !v)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? <FaSpinner className="animate-spin inline mr-2" /> : null}
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?
          <button onClick={() => setCurrentView('register')} className="text-blue-600 hover:text-blue-800 ml-1" type="button">
            Register here
          </button>
        </p>
      </div>
    </div>
  );

  // Dashboard
  const Dashboard = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {guardianInfo?.fullName}!</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentView('add-child');
              setSchoolSearch('');
              loadSchools();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            <FaChild className="inline mr-2" />Add Child
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800">👥 My Children</h3>
          <p className="text-3xl font-bold text-blue-600">{children.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800">✅ Active Athletes</h3>
          <p className="text-3xl font-bold text-green-600">
            {children.filter(child => child.athlete_id).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-800">⏳ Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {children.filter(child => !child.athlete_id).length}
          </p>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">👶 My Children</h2>
        {children.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FaChild className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No children added yet</p>
            <button
              onClick={() => {
                setCurrentView('add-child');
                setSchoolSearch('');
                loadSchools();
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
            >
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{child.full_name}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p><strong>School:</strong> {child.school_name}</p>
                  <p><strong>Grade:</strong> {child.grade}</p>
                  <p><strong>DOB:</strong> {new Date(child.date_of_birth).toLocaleDateString()}</p>
                </div>
                {child.athlete_id ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">🎯 Nepal Athlete ID</h4>
                    <p className="font-mono text-green-700 font-bold">{child.athlete_id}</p>
                    <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-full mt-2">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">⏳ Athlete ID Status</h4>
                    <p className="text-yellow-700">Pending school approval</p>
                    <span className="inline-block bg-yellow-600 text-white text-xs px-2 py-1 rounded-full mt-2">
                      Pending
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Add Child
  const AddChildForm = () => (
    <div>
      <div className="flex items-center mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="mr-4 text-gray-600 hover:text-gray-800" type="button">
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Add Child to Your Account</h2>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800">
          <strong>✨ No claim codes needed!</strong> Just enter your child's details. If they're already registered at school, we'll link automatically. Otherwise, the school will approve their registration.
        </p>
      </div>
      <form onSubmit={handleAddChild} className="space-y-4">
        {/* Child full name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaChild className="inline mr-2" />Child's Full Name
          </label>
          <input
            type="text"
            value={childData.childFullName}
            onChange={e => setChildData(prev => ({ ...prev, childFullName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter child's full name"
            required
          />
        </div>
        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCalendarAlt className="inline mr-2" />Date of Birth
          </label>
          <input
            type="date"
            value={childData.dateOfBirth}
            onChange={e => setChildData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={childData.gender}
            onChange={e => setChildData(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {/* Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
          <input
            type="text"
            value={childData.grade}
            onChange={e => setChildData(prev => ({ ...prev, grade: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 10, KG, Nursery"
          />
        </div>
        {/* School search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaSchool className="inline mr-2" />School
          </label>
          <div className="relative">
            <input
              type="text"
              value={childData.schoolName || schoolSearch}
              onChange={e => handleSchoolTyping(e.target.value, false)}
              placeholder="Search for your child's school..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!childData.schoolName}
              required
            />
            {renderSchoolDropdown(selectSchool, false)}
            {childData.schoolName && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-green-600">✓ Selected: {childData.schoolName}</p>
                <button
                  type="button"
                  onClick={() => clearSchool(false)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Change School
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? <FaSpinner className="animate-spin inline mr-2" /> : null}
          {loading ? 'Adding Child...' : 'Add Child'}
        </button>
      </form>
    </div>
  );

  // ==== MAIN RENDER ====

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentView === 'welcome' && <WelcomeScreen />}
          {currentView === 'register' && <RegistrationForm />}
          {currentView === 'login' && <LoginForm />}
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'add-child' && <AddChildForm />}
        </div>
      </div>
    </div>
  );
}
