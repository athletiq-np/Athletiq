import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSchool, FaSave, FaEdit, FaMapMarkerAlt, FaPhone, 
  FaEnvelope, FaGlobe, FaUsers, FaShieldAlt, FaCog,
  FaCamera, FaUpload, FaCheck, FaTimes, FaInfo
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * 🏫 School Settings Management
 * Complete school configuration and profile management
 */
const SchoolSettings = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [schoolData, setSchoolData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    logo: null,
    logoPreview: null,
    description: '',
    establishedYear: '',
    studentCount: '',
    motto: '',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981'
    },
    settings: {
      allowPublicTournaments: true,
      requireParentalConsent: true,
      enableNotifications: true,
      defaultTournamentFormat: 'single-elimination',
      autoGenerateTeams: false,
      allowCrossSportTeams: false
    },
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    }
  });

  const tabs = [
    { id: 'profile', label: 'School Profile', icon: FaSchool },
    { id: 'settings', label: 'Tournament Settings', icon: FaCog },
    { id: 'branding', label: 'Branding & Colors', icon: FaCamera },
    { id: 'privacy', label: 'Privacy & Security', icon: FaShieldAlt }
  ];

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/schools/me/settings');
      if (response.data.success) {
        setSchoolData(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      toast.error('Failed to load school settings');
      console.error('Error loading school data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSchoolData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSchoolData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file size must be less than 5MB');
        return;
      }
      
      setSchoolData(prev => ({
        ...prev,
        logo: file,
        logoPreview: URL.createObjectURL(file)
      }));
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      Object.keys(schoolData).forEach(key => {
        if (key === 'logo' && schoolData.logo) {
          formData.append('logo', schoolData.logo);
        } else if (typeof schoolData[key] === 'object' && schoolData[key] !== null) {
          formData.append(key, JSON.stringify(schoolData[key]));
        } else if (key !== 'logoPreview') {
          formData.append(key, schoolData[key]);
        }
      });

      const response = await apiClient.put('/schools/me/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('School settings saved successfully!');
        loadSchoolData(); // Reload to get updated data
      }
    } catch (error) {
      toast.error('Failed to save school settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const ProfileTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <FaSchool className="mr-2 text-blue-600 dark:text-blue-400" />
          Basic Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              School Name *
            </label>
            <input
              type="text"
              value={schoolData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter school name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={schoolData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of your school"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Established Year
              </label>
              <input
                type="number"
                value={schoolData.establishedYear}
                onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Count
              </label>
              <input
                type="number"
                value={schoolData.studentCount}
                onChange={(e) => handleInputChange('studentCount', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Motto
            </label>
            <input
              type="text"
              value={schoolData.motto}
              onChange={(e) => handleInputChange('motto', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Excellence in Education"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <FaMapMarkerAlt className="mr-2 text-green-600 dark:text-green-400" />
          Contact Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={schoolData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={schoolData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={schoolData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                value={schoolData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaPhone className="inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                value={schoolData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaEnvelope className="inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={schoolData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contact@school.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaGlobe className="inline mr-1" />
              Website
            </label>
            <input
              type="url"
              value={schoolData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.school.edu"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tournament Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <FaCog className="mr-2 text-blue-600 dark:text-blue-400" />
          Tournament Preferences
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Tournament Format
            </label>
            <select
              value={schoolData.settings?.defaultTournamentFormat || 'single-elimination'}
              onChange={(e) => handleInputChange('settings.defaultTournamentFormat', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="single-elimination">Single Elimination</option>
              <option value="double-elimination">Double Elimination</option>
              <option value="round-robin">Round Robin</option>
              <option value="swiss">Swiss System</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={schoolData.settings?.allowPublicTournaments}
                onChange={(e) => handleInputChange('settings.allowPublicTournaments', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Allow public tournaments</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={schoolData.settings?.autoGenerateTeams}
                onChange={(e) => handleInputChange('settings.autoGenerateTeams', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Auto-generate balanced teams</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={schoolData.settings?.allowCrossSportTeams}
                onChange={(e) => handleInputChange('settings.allowCrossSportTeams', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Allow cross-sport teams</span>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <FaInfo className="mr-2 text-green-600 dark:text-green-400" />
          Notifications & Privacy
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={schoolData.settings?.enableNotifications}
                onChange={(e) => handleInputChange('settings.enableNotifications', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Enable email notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={schoolData.settings?.requireParentalConsent}
                onChange={(e) => handleInputChange('settings.requireParentalConsent', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Require parental consent for students</span>
            </label>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Privacy Notice</h4>
            <p className="text-sm text-yellow-700">
              Student data is protected under FERPA guidelines. All tournament data 
              is stored securely and only shared with authorized personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const BrandingTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Logo Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaCamera className="mr-2 text-purple-600" />
          School Logo
        </h3>
        
        <div className="text-center">
          <div className="mb-4">
            {schoolData.logoPreview ? (
              <img
                src={schoolData.logoPreview}
                alt="School Logo Preview"
                className="w-32 h-32 object-contain mx-auto border rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <FaCamera className="text-gray-400 text-2xl" />
              </div>
            )}
          </div>
          
          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FaUpload className="mr-2" />
            Upload Logo
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
          
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG up to 5MB. Recommended: 256x256px
          </p>
        </div>
      </div>

      {/* School Colors */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          School Colors
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={schoolData.colors?.primary || '#3B82F6'}
                onChange={(e) => handleInputChange('colors.primary', e.target.value)}
                className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={schoolData.colors?.primary || '#3B82F6'}
                onChange={(e) => handleInputChange('colors.primary', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={schoolData.colors?.secondary || '#10B981'}
                onChange={(e) => handleInputChange('colors.secondary', e.target.value)}
                className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={schoolData.colors?.secondary || '#10B981'}
                onChange={(e) => handleInputChange('colors.secondary', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg" style={{
            background: `linear-gradient(135deg, ${schoolData.colors?.primary || '#3B82F6'}, ${schoolData.colors?.secondary || '#10B981'})`
          }}>
            <p className="text-white font-medium text-center">
              Color Preview
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">School Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your school profile, tournament preferences, and system settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 mr-4 mb-2 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'branding' && <BrandingTab />}
          {activeTab === 'privacy' && <SettingsTab />}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <motion.button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              Save Settings
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default SchoolSettings;
