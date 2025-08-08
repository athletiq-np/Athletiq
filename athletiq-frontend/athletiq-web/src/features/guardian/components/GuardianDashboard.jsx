import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBriefcase,
  FaGraduationCap, FaUserFriends, FaTrophy, FaCalendarAlt,
  FaFileAlt, FaCamera, FaEdit, FaSave, FaTimes, FaCheckCircle,
  FaEye, FaDownload, FaPrint, FaBell, FaCog, FaPlus, FaChild,
  FaChartLine, FaUsers, FaMedal, FaBook, FaHome, FaSignOutAlt, FaInfoCircle
} from 'react-icons/fa';
import { useGuardianAuth } from '../hooks/useGuardianAuth';
import { useGuardianAthletes } from '../hooks/useGuardianAthletes';
import HybridChildManagement from './HybridChildManagement';
import { DEMO_MODE } from '../../../utils/demoData';

export default function GuardianDashboard() {
  const { guardian, logout, updateProfile, loading: authLoading } = useGuardianAuth();
  const { athletes, getAthletesStats, loading: athletesLoading } = useGuardianAthletes();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (guardian) {
      setFormData({
        fullName: guardian.fullName || guardian.full_name || '',
        email: guardian.email || '',
        phone: guardian.phone || guardian.phoneNumber || guardian.phone_number || '',
        address: guardian.address || '',
        relationship: guardian.relationship || 'parent'
      });
    }
  }, [guardian]);

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoutClick = () => {
    logout();
  };

  const stats = getAthletesStats();

  if (authLoading || athletesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Guardian Dashboard...</p>
        </div>
      </div>
    );
  }

  const navigationTabs = [
    { id: 'overview', name: 'Overview', icon: FaHome },
    { id: 'athletes', name: 'My Athletes', icon: FaChild },
    { id: 'activities', name: 'Activities', icon: FaTrophy },
    { id: 'documents', name: 'Documents', icon: FaFileAlt },
    { id: 'profile', name: 'Profile', icon: FaUser }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {guardian?.fullName || guardian?.full_name || 'Guardian'}!
            </h1>
            <p className="text-blue-100">
              Manage your athletes' sports activities and track their progress
            </p>
          </div>
          <div className="hidden md:block">
            <FaUserFriends className="text-6xl opacity-20" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full">
              <FaChild className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Athletes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-full">
              <FaTrophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Athletes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-full">
              <FaGraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Schools</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.schools.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-full">
              <FaBell className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Notifications</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center py-12">
              <FaCalendarAlt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
              <p className="text-gray-600">Activity will appear here as you use the system</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('athletes')}
                className="w-full flex items-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FaPlus className="mr-3" />
                Manage Athletes
              </button>
              <button className="w-full flex items-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                <FaTrophy className="mr-3" />
                View Tournaments
              </button>
              <button className="w-full flex items-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                <FaFileAlt className="mr-3" />
                View Documents
              </button>
              <button className="w-full flex items-center px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
                <FaBell className="mr-3" />
                Notifications
              </button>
            </div>
          </div>

          {/* Athletes Summary */}
          {athletes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Athletes Summary</h2>
              <div className="space-y-3">
                {athletes.slice(0, 3).map((athlete, index) => (
                  <div key={athlete.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <FaChild className="text-blue-600 text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {athlete.childFullName || athlete.child_full_name || athlete.athleteName || athlete.full_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {athlete.schoolName || athlete.school_name}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>
                ))}
                {athletes.length > 3 && (
                  <button
                    onClick={() => setActiveTab('athletes')}
                    className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
                  >
                    View all {athletes.length} athletes
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Guardian Profile</h2>
          <button
            onClick={editing ? handleSaveProfile : handleEditProfile}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              editing 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {editing ? <><FaSave className="inline mr-2" />Save</> : <><FaEdit className="inline mr-2" />Edit</>}
          </button>
        </div>

        {guardian && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 p-3 bg-gray-50 rounded-md">
                    {guardian.fullName || guardian.full_name || 'Not provided'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 p-3 bg-gray-50 rounded-md flex items-center">
                    <FaPhone className="mr-2 text-blue-600" />
                    {guardian.phone || guardian.phoneNumber || guardian.phone_number || 'Not provided'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 p-3 bg-gray-50 rounded-md flex items-center">
                    <FaEnvelope className="mr-2 text-blue-600" />
                    {guardian.email || 'Not provided'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                {editing ? (
                  <select
                    name="relationship"
                    value={formData.relationship || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                    <option value="relative">Relative</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 p-3 bg-gray-50 rounded-md capitalize">
                    {guardian.relationship || 'Parent'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              {editing ? (
                <textarea
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 p-3 bg-gray-50 rounded-md min-h-[80px]">
                  {guardian.address || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
              <p className="text-gray-900 p-3 bg-gray-50 rounded-md flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-600" />
                {guardian.createdAt || guardian.created_at ? 
                  new Date(guardian.createdAt || guardian.created_at).toLocaleDateString() 
                  : 'Not available'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivities = () => (
    <div className="text-center py-12">
      <FaTrophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">Activities Coming Soon</h3>
      <p className="text-gray-600">Track your athletes' sports activities and achievements here.</p>
    </div>
  );

  const renderDocuments = () => (
    <div className="text-center py-12">
      <FaFileAlt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">Documents Coming Soon</h3>
      <p className="text-gray-600">Manage your athletes' sports documents and certificates here.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <FaUserFriends className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Athletiq Guardian</h1>
                <p className="text-gray-600">
                  Sports Management Platform
                  {DEMO_MODE && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <FaInfoCircle className="inline mr-1" />
                      Demo Mode
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <FaBell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">0</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaCog className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogoutClick}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'athletes' && <HybridChildManagement />}
          {activeTab === 'activities' && renderActivities()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'profile' && renderProfile()}
        </motion.div>
      </div>
    </div>
  );
}
