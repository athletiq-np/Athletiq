import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaEnvelope,
  FaMapMarkerAlt,
  FaUser,
  FaCamera,
  FaSave,
  FaSpinner
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';

const GuardianProfileManagement = ({ user, onUpdate }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profile_photo_url: user?.profile_photo_url || '',
    emergency_contacts: user?.emergency_contacts || [],
    notification_preferences: user?.notification_preferences || {
      email: true,
      sms: true,
      push: true,
      whatsapp: false
    }
  });
  const [errors, setErrors] = useState({});
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: ''
  });

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/guardian/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate(updatedUser.user);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setErrors(errorData.errors || { general: 'Update failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      return;
    }

    const updatedContacts = [...profileData.emergency_contacts, {
      ...newContact,
      id: Date.now()
    }];

    setProfileData({
      ...profileData,
      emergency_contacts: updatedContacts
    });

    setNewContact({ name: '', relationship: '', phone: '', email: '' });
    setShowAddContact(false);
  };

  const handleRemoveContact = (contactId) => {
    const updatedContacts = profileData.emergency_contacts.filter(
      contact => contact.id !== contactId
    );
    setProfileData({
      ...profileData,
      emergency_contacts: updatedContacts
    });
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_photo', file);

    try {
      const response = await fetch('/api/guardian/profile/photo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setProfileData({
          ...profileData,
          profile_photo_url: result.photo_url
        });
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('profile.guardianProfile')}
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaEdit className="w-4 h-4" />
              <span>{t('common.edit')}</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
                <span>{t('common.save')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Photo */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
              {profileData.profile_photo_url ? (
                <img
                  src={profileData.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaUser className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
                <FaCamera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {profileData.full_name}
            </h3>
            <p className="text-gray-600">{profileData.email}</p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.fullName')}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="py-2 text-gray-900">{profileData.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="py-2 text-gray-900">{profileData.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.phoneNumber')}
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="py-2 text-gray-900">{profileData.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.address')}
            </label>
            {isEditing ? (
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="py-2 text-gray-900">{profileData.address || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('profile.emergencyContacts')}
          </h3>
          {isEditing && (
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaPlus className="w-4 h-4" />
              <span>{t('profile.addContact')}</span>
            </button>
          )}
        </div>

        {profileData.emergency_contacts.length > 0 ? (
          <div className="space-y-3">
            {profileData.emergency_contacts.map((contact, index) => (
              <motion.div
                key={contact.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{contact.name}</h4>
                  <p className="text-sm text-gray-600">{contact.relationship}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <FaPhone className="w-3 h-3" />
                      <span>{contact.phone}</span>
                    </span>
                    {contact.email && (
                      <span className="flex items-center space-x-1">
                        <FaEnvelope className="w-3 h-3" />
                        <span>{contact.email}</span>
                      </span>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            {t('profile.noEmergencyContacts')}
          </p>
        )}

        {/* Add Contact Modal */}
        {showAddContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('profile.addEmergencyContact')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.fullName')}
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.relationship')}
                  </label>
                  <select
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('form.selectRelationship')}</option>
                    <option value="spouse">{t('form.spouse')}</option>
                    <option value="parent">{t('form.parent')}</option>
                    <option value="sibling">{t('form.sibling')}</option>
                    <option value="friend">{t('form.friend')}</option>
                    <option value="other">{t('form.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.email')} ({t('form.optional')})
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddContact}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t('common.add')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('profile.notificationPreferences')}
        </h3>
        
        <div className="space-y-4">
          {[
            { key: 'email', label: t('notifications.email'), icon: FaEnvelope },
            { key: 'sms', label: t('notifications.sms'), icon: FaPhone },
            { key: 'push', label: t('notifications.push'), icon: FaUser },
            { key: 'whatsapp', label: t('notifications.whatsapp'), icon: FaPhone }
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">{label}</span>
              </div>
              {isEditing ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.notification_preferences[key]}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      notification_preferences: {
                        ...profileData.notification_preferences,
                        [key]: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              ) : (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  profileData.notification_preferences[key]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profileData.notification_preferences[key] ? t('common.enabled') : t('common.disabled')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>• {message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GuardianProfileManagement;
