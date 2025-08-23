// src/components/features/school/SchoolProfile.jsx
import React, { useState } from 'react';
import { FaSchool, FaEdit, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUpload, FaSave } from 'react-icons/fa';

export default function SchoolProfile({ school, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: school?.name || '',
    address: school?.address || '',
    phone: school?.phone || '',
    email: school?.email || '',
    website: school?.website || '',
    principal: school?.principal || '',
    province: school?.province || '',
    district: school?.district || '',
    established: school?.established || '',
    description: school?.description || ''
  });

  const handleSave = () => {
    console.log('Saving school profile:', formData);
    setIsEditing(false);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">School Profile</h2>
          <p className="text-gray-600">Manage your school's information and settings</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-athletiq-blue text-white px-4 py-2 rounded-lg hover:bg-athletiq-navy transition-colors flex items-center space-x-2"
        >
          <FaEdit className="h-4 w-4" />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Logo */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Logo</h3>
          <div className="text-center">
            <div className="w-32 h-32 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              {school?.logo_url ? (
                <img src={school.logo_url} alt="School Logo" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <FaSchool className="h-12 w-12 text-gray-400" />
              )}
            </div>
            {isEditing && (
              <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 mx-auto">
                <FaUpload className="h-4 w-4" />
                <span>Upload Logo</span>
              </button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.name || 'Not specified'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.principal}
                  onChange={(e) => setFormData({...formData, principal: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.principal || 'Not specified'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.phone || 'Not specified'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.email || 'Not specified'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              {isEditing ? (
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({...formData, province: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                >
                  <option value="">Select Province</option>
                  <option value="Province 1">Province 1</option>
                  <option value="Madhesh">Madhesh</option>
                  <option value="Bagmati">Bagmati</option>
                  <option value="Gandaki">Gandaki</option>
                  <option value="Lumbini">Lumbini</option>
                  <option value="Karnali">Karnali</option>
                  <option value="Sudurpashchim">Sudurpashchim</option>
                </select>
              ) : (
                <p className="text-gray-900">{formData.province || 'Not specified'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.district || 'Not specified'}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{formData.address || 'Not specified'}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                  placeholder="Brief description about your school..."
                />
              ) : (
                <p className="text-gray-900">{formData.description || 'No description provided'}</p>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-athletiq-blue text-white px-4 py-2 rounded-lg hover:bg-athletiq-navy transition-colors flex items-center space-x-2"
              >
                <FaSave className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
