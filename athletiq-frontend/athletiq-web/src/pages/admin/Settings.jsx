// src/pages/admin/Settings.jsx

import React, { useState } from 'react';
import { FaCog, FaUser, FaDatabase, FaGlobe, FaBell, FaLock } from 'react-icons/fa';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: FaCog },
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'database', label: 'Database', icon: FaDatabase },
    { id: 'localization', label: 'Localization', icon: FaGlobe },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'security', label: 'Security', icon: FaLock },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-athletiq-navy">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your application preferences and configuration</p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-1/4 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-athletiq-green text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-athletiq-navy">General Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name
                    </label>
                    <input
                      type="text"
                      defaultValue="ATHLETIQ"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-athletiq-green"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Language
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-athletiq-green">
                      <option value="en">English</option>
                      <option value="np">नेपाली</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="px-4 py-2 bg-athletiq-green text-white rounded-md hover:bg-green-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-athletiq-navy">Profile Settings</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600">Profile settings will be available in a future update.</p>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-athletiq-navy">Database Settings</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600">Database configuration will be available in a future update.</p>
                </div>
              </div>
            )}

            {activeTab === 'localization' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-athletiq-navy">Localization Settings</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600">Localization settings will be available in a future update.</p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-athletiq-navy">Notification Settings</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600">Notification settings will be available in a future update.</p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-athletiq-navy">Security Settings</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600">Security settings will be available in a future update.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
