// src/components/features/admin/DashboardSettings.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaUser, FaLock, FaBell, FaPalette, FaGlobe, FaDatabase, FaShield,
  FaDownload, FaUpload, FaTrash, FaEye, FaEyeSlash, FaSave, FaUndo
} from 'react-icons/fa';
import { MdSettings, MdSecurity, MdNotifications, MdLanguage } from 'react-icons/md';
import { toast } from 'react-toastify';

/**
 * ⚙️ Dashboard Settings Component
 * - User profile settings
 * - Security settings
 * - Notification preferences
 * - Theme and language settings
 * - Data management
 * - System preferences
 */
export default function DashboardSettings({
  user,
  darkMode,
  setDarkMode,
  onLanguageChange,
  currentLanguage
}) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginNotifications: true
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      weeklyReports: true,
      monthlyReports: true,
      systemAlerts: true
    },
    preferences: {
      theme: darkMode ? 'dark' : 'light',
      language: currentLanguage,
      sidebarCollapsed: false,
      showWelcomeMessage: true,
      autoRefresh: true,
      refreshInterval: 5
    },
    data: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 365,
      exportFormat: 'xlsx'
    }
  });

  const sections = [
    {
      id: 'profile',
      title: t('settings.sections.profile'),
      icon: FaUser,
      description: t('settings.sections.profileDesc')
    },
    {
      id: 'security',
      title: t('settings.sections.security'),
      icon: MdSecurity,
      description: t('settings.sections.securityDesc')
    },
    {
      id: 'notifications',
      title: t('settings.sections.notifications'),
      icon: MdNotifications,
      description: t('settings.sections.notificationsDesc')
    },
    {
      id: 'preferences',
      title: t('settings.sections.preferences'),
      icon: FaPalette,
      description: t('settings.sections.preferencesDesc')
    },
    {
      id: 'data',
      title: t('settings.sections.data'),
      icon: FaDatabase,
      description: t('settings.sections.dataDesc')
    }
  ];

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      // API call to save settings
      // await apiClient.put('/admin/settings', settings);
      
      // Apply theme changes
      if (settings.preferences.theme !== (darkMode ? 'dark' : 'light')) {
        setDarkMode(settings.preferences.theme === 'dark');
      }
      
      // Apply language changes
      if (settings.preferences.language !== currentLanguage) {
        onLanguageChange(settings.preferences.language);
      }
      
      toast.success(t('settings.saveSuccess'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      ...settings,
      [activeSection]: {
        ...settings[activeSection]
      }
    });
    toast.info(t('settings.resetSuccess'));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `athletiq-settings-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success(t('settings.exportSuccess'));
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MdSettings className="mr-3 text-athletiq-green" />
              {t('settings.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('settings.subtitle')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FaUndo className="w-4 h-4" />
              <span>{t('settings.reset')}</span>
            </button>
            <button
              onClick={exportSettings}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              <span>{t('settings.export')}</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-athletiq-green text-white rounded-lg hover:bg-athletiq-green/90 transition-colors"
            >
              <FaSave className="w-4 h-4" />
              <span>{t('settings.save')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('settings.navigation.title')}
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-athletiq-green text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs opacity-80">{section.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Profile Settings */}
                {activeSection === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('settings.profile.title')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.profile.name')}
                          </label>
                          <input
                            type="text"
                            value={settings.profile.name}
                            onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.profile.email')}
                          </label>
                          <input
                            type="email"
                            value={settings.profile.email}
                            onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.profile.phone')}
                          </label>
                          <input
                            type="tel"
                            value={settings.profile.phone}
                            onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.profile.timezone')}
                          </label>
                          <select
                            value={settings.profile.timezone}
                            onChange={(e) => handleSettingChange('profile', 'timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                          >
                            <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York</option>
                            <option value="Europe/London">Europe/London</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeSection === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('settings.security.title')}
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {t('settings.security.twoFactor')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t('settings.security.twoFactorDesc')}
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.security.twoFactorEnabled}
                              onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-athletiq-green/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-athletiq-green"></div>
                          </label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('settings.security.sessionTimeout')}
                            </label>
                            <select
                              value={settings.security.sessionTimeout}
                              onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('settings.security.passwordExpiry')}
                            </label>
                            <select
                              value={settings.security.passwordExpiry}
                              onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                            >
                              <option value={30}>30 days</option>
                              <option value={60}>60 days</option>
                              <option value={90}>90 days</option>
                              <option value={365}>1 year</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('settings.notifications.title')}
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(settings.notifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {t(`settings.notifications.${key}`)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t(`settings.notifications.${key}Desc`)}
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-athletiq-green/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-athletiq-green"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Settings */}
                {activeSection === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('settings.preferences.title')}
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('settings.preferences.theme')}
                            </label>
                            <select
                              value={settings.preferences.theme}
                              onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                            >
                              <option value="light">{t('settings.preferences.lightTheme')}</option>
                              <option value="dark">{t('settings.preferences.darkTheme')}</option>
                              <option value="system">{t('settings.preferences.systemTheme')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('settings.preferences.language')}
                            </label>
                            <select
                              value={settings.preferences.language}
                              onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                            >
                              <option value="en">🇺🇸 English</option>
                              <option value="ne">🇳🇵 नेपाली</option>
                              <option value="hi">🇮🇳 हिंदी</option>
                              <option value="es">🇪🇸 Español</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {['autoRefresh', 'showWelcomeMessage', 'sidebarCollapsed'].map((key) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {t(`settings.preferences.${key}`)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {t(`settings.preferences.${key}Desc`)}
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.preferences[key]}
                                  onChange={(e) => handleSettingChange('preferences', key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-athletiq-green/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-athletiq-green"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Settings */}
                {activeSection === 'data' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('settings.data.title')}
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('settings.data.backupFrequency')}
                            </label>
                            <select
                              value={settings.data.backupFrequency}
                              onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                            >
                              <option value="daily">{t('settings.data.daily')}</option>
                              <option value="weekly">{t('settings.data.weekly')}</option>
                              <option value="monthly">{t('settings.data.monthly')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('settings.data.exportFormat')}
                            </label>
                            <select
                              value={settings.data.exportFormat}
                              onChange={(e) => handleSettingChange('data', 'exportFormat', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                            >
                              <option value="xlsx">Excel (.xlsx)</option>
                              <option value="csv">CSV (.csv)</option>
                              <option value="json">JSON (.json)</option>
                              <option value="pdf">PDF (.pdf)</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {t('settings.data.autoBackup')}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t('settings.data.autoBackupDesc')}
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.data.autoBackup}
                              onChange={(e) => handleSettingChange('data', 'autoBackup', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-athletiq-green/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-athletiq-green"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
