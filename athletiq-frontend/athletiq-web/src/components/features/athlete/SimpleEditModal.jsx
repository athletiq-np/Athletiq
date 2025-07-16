// Simple Edit Student Modal
import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaMale, FaFemale } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function SimpleEditModal({ isOpen, onClose, onSubmit, student, houses = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    nameNepali: '',
    grade: '',
    section: '',
    rollNumber: '',
    dateOfBirth: '',
    gender: '',
    house: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    bloodGroup: '',
    medicalConditions: '',
    emergencyContact: ''
  });

  const [loading, setLoading] = useState(false);

  // Populate form when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        nameNepali: student.nameNepali || '',
        grade: student.grade || '',
        section: student.section || '',
        rollNumber: student.rollNumber || '',
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender || '',
        house: student.house || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        guardianEmail: student.guardianEmail || '',
        address: student.address || '',
        bloodGroup: student.bloodGroup || '',
        medicalConditions: student.medicalConditions || '',
        emergencyContact: student.emergencyContact || ''
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.grade || !formData.gender) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ ...formData, id: student.id });
      toast.success('Student updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update student');
      console.error('Update student error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  const genderStyle = student.gender?.toLowerCase() === 'male' 
    ? { bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200' }
    : { bgColor: 'bg-pink-50', textColor: 'text-pink-800', borderColor: 'border-pink-200' };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${genderStyle.bgColor}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-white border-2 ${genderStyle.borderColor}`}>
              {student.gender === 'Male' ? (
                <FaMale className="h-6 w-6 text-blue-600" />
              ) : (
                <FaFemale className="h-6 w-6 text-pink-600" />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${genderStyle.textColor}`}>
                Edit Student - {student.name}
              </h2>
              <p className={`${genderStyle.textColor} opacity-75`}>
                Update student information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Nepali Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Nepali)
                </label>
                <input
                  type="text"
                  name="nameNepali"
                  value={formData.nameNepali}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade *
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Grade</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Section</option>
                  {['A', 'B', 'C', 'D', 'E'].map(section => (
                    <option key={section} value={section}>Section {section}</option>
                  ))}
                </select>
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* House */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House
                </label>
                <select
                  name="house"
                  value={formData.house}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select House</option>
                  <option value="Red House">Red House</option>
                  <option value="Blue House">Blue House</option>
                  <option value="Green House">Green House</option>
                  <option value="Yellow House">Yellow House</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guardian Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Guardian Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Phone
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Guardian Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guardian Email
                </label>
                <input
                  type="email"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address & Medical */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full address"
                />
              </div>

              {/* Medical Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any medical conditions or allergies"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2 ${
                student.gender === 'Male' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-pink-600 hover:bg-pink-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FaEdit className="h-4 w-4" />
                  <span>Update Student</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
