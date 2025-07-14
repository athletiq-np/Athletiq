// src/components/features/school/SchoolSettings.jsx
import React, { useState } from 'react';
import { FaCogs, FaBell, FaLock, FaUsers, FaLanguage, FaPalette, FaSave } from 'react-icons/fa';

export default function SchoolSettings({ school, onUpdate }) {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      tournamentUpdates: true,
      systemAlerts: true
    },
    privacy: {
      publicProfile: true,
      showStudentCount: true,
      allowDirectMessages: false
    },
    academic: {
      academicYear: '2024-2025',
      gradingSystem: 'A-F',
      language: 'English'
    }
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">School Settings</h2>
          <p className="text-gray-600">Configure your school's preferences and settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBell className="h-5 w-5 mr-2 text-yellow-500" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                })}
                className="rounded border-gray-300 text-athletiq-blue focus:ring-athletiq-blue"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                <p className="text-sm text-gray-500">Receive urgent updates via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.smsNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, smsNotifications: e.target.checked }
                })}
                className="rounded border-gray-300 text-athletiq-blue focus:ring-athletiq-blue"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Tournament Updates</label>
                <p className="text-sm text-gray-500">Get notified about tournament opportunities</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.tournamentUpdates}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, tournamentUpdates: e.target.checked }
                })}
                className="rounded border-gray-300 text-athletiq-blue focus:ring-athletiq-blue"
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaLock className="h-5 w-5 mr-2 text-red-500" />
            Privacy & Visibility
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Public School Profile</label>
                <p className="text-sm text-gray-500">Allow other schools to view your profile</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.publicProfile}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, publicProfile: e.target.checked }
                })}
                className="rounded border-gray-300 text-athletiq-blue focus:ring-athletiq-blue"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Show Student Count</label>
                <p className="text-sm text-gray-500">Display number of registered students</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.showStudentCount}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showStudentCount: e.target.checked }
                })}
                className="rounded border-gray-300 text-athletiq-blue focus:ring-athletiq-blue"
              />
            </div>
          </div>
        </div>

        {/* Academic Settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaUsers className="h-5 w-5 mr-2 text-blue-500" />
            Academic Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                value={settings.academic.academicYear}
                onChange={(e) => setSettings({
                  ...settings,
                  academic: { ...settings.academic, academicYear: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
              <select
                value={settings.academic.gradingSystem}
                onChange={(e) => setSettings({
                  ...settings,
                  academic: { ...settings.academic, gradingSystem: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
              >
                <option value="A-F">A-F System</option>
                <option value="1-10">1-10 Scale</option>
                <option value="Percentage">Percentage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
              <select
                value={settings.academic.language}
                onChange={(e) => setSettings({
                  ...settings,
                  academic: { ...settings.academic, language: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
              >
                <option value="English">English</option>
                <option value="Nepali">नेपाली</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-athletiq-blue text-white px-6 py-3 rounded-lg hover:bg-athletiq-navy transition-colors flex items-center space-x-2"
          >
            <FaSave className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
