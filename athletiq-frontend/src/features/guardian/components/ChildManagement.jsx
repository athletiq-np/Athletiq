import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChild, FaPlus, FaEdit, FaEye, FaCalendarAlt, FaGraduationCap,
  FaVenusMars, FaSchool, FaSave, FaTimes, FaTrash, FaUser,
  FaBirthdayCake, FaMapMarkerAlt, FaClipboardList, FaSearch,
  FaFilter, FaSortAlphaDown, FaSortAlphaUp, FaRocket, FaBolt,
  FaFileUpload, FaCertificate
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGuardianChildren } from '../hooks/useGuardianChildren';
import AthleteForm from './AthleteForm';

export default function ChildManagement() {
  const { 
    children, 
    loading, 
    error, 
    addChild, 
    updateChild, 
    getChildrenStats,
    refresh 
  } = useGuardianChildren();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [viewingChild, setViewingChild] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Form mode state - determines which form to show
  const [formMode, setFormMode] = useState('basic'); // 'basic' or 'advanced'
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    childFullName: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    schoolName: '',
    schoolId: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    emergencyContact: '',
    medicalConditions: '',
    additionalInfo: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    refresh();
  }, []);

  const stats = getChildrenStats();

  const resetForm = () => {
    setFormData({
      childFullName: '',
      dateOfBirth: '',
      gender: '',
      grade: '',
      schoolName: '',
      schoolId: '',
      address: '',
      bloodGroup: '',
      allergies: '',
      emergencyContact: '',
      medicalConditions: '',
      additionalInfo: ''
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.childFullName.trim()) errors.childFullName = 'Child name is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.schoolName.trim()) errors.schoolName = 'School name is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingChild) {
        const result = await updateChild(editingChild.id, formData);
        if (result.success) {
          setEditingChild(null);
          resetForm();
        }
      } else {
        const result = await addChild(formData);
        if (result.success) {
          setShowAddForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (child) => {
    setEditingChild(child);
    setFormData({
      childFullName: child.childFullName || child.child_full_name || '',
      dateOfBirth: child.dateOfBirth || child.date_of_birth || '',
      gender: child.gender || '',
      grade: child.grade || '',
      schoolName: child.schoolName || child.school_name || '',
      schoolId: child.schoolId || child.school_id || '',
      address: child.address || '',
      bloodGroup: child.bloodGroup || child.blood_group || '',
      allergies: child.allergies || '',
      emergencyContact: child.emergencyContact || child.emergency_contact || '',
      medicalConditions: child.medicalConditions || child.medical_conditions || '',
      additionalInfo: child.additionalInfo || child.additional_info || ''
    });
    setShowAddForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const filteredAndSortedChildren = children
    .filter(child => {
      const matchesSearch = (child.childFullName || child.child_full_name || '')
        .toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = !filterGender || child.gender === filterGender;
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = (a.childFullName || a.child_full_name || '').toLowerCase();
          bVal = (b.childFullName || b.child_full_name || '').toLowerCase();
          break;
        case 'age':
          aVal = new Date(a.dateOfBirth || a.date_of_birth);
          bVal = new Date(b.dateOfBirth || b.date_of_birth);
          break;
        case 'grade':
          aVal = a.grade || '';
          bVal = b.grade || '';
          break;
        case 'school':
          aVal = (a.schoolName || a.school_name || '').toLowerCase();
          bVal = (b.schoolName || b.school_name || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const inputClasses = (fieldName) => `
    w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    transition-colors ${formErrors[fieldName] ? 'border-red-500' : 'border-gray-300'}
  `;

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full">
              <FaChild className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Children</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-full">
              <FaVenusMars className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Boys / Girls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.byGender.male} / {stats.byGender.female}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-full">
              <FaSchool className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Schools</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.schools.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-full">
              <FaGraduationCap className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search children..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="age">Sort by Age</option>
              <option value="grade">Sort by Grade</option>
              <option value="school">Sort by School</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                resetForm();
                setEditingChild(null);
                setFormMode('basic');
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaPlus className="mr-2" />
              Quick Add
            </button>
            
            <button
              onClick={() => {
                setFormMode('advanced');
                setEditingChild(null);
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <FaRocket className="mr-2" />
              Advanced Add
            </button>
          </div>
        </div>
      </div>

      {/* Children List */}
      <div className="bg-white rounded-lg shadow">
        {filteredAndSortedChildren.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedChildren.map((child, index) => (
              <motion.div
                key={child.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaChild className="text-blue-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {child.childFullName || child.child_full_name || 'Unknown'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <FaBirthdayCake className="mr-1" />
                          {child.dateOfBirth || child.date_of_birth ? 
                            new Date(child.dateOfBirth || child.date_of_birth).toLocaleDateString() 
                            : 'Not provided'
                          }
                        </span>
                        <span className="flex items-center">
                          <FaVenusMars className="mr-1" />
                          {child.gender ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1) : 'Not specified'}
                        </span>
                        <span className="flex items-center">
                          <FaGraduationCap className="mr-1" />
                          {child.grade || 'Not specified'}
                        </span>
                        <span className="flex items-center">
                          <FaSchool className="mr-1" />
                          {child.schoolName || child.school_name || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingChild(child)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEdit(child)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                    >
                      <FaEdit />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FaChild className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {children.length === 0 ? 'No Children Added Yet' : 'No Children Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {children.length === 0 
                ? 'Start by adding your first child to manage their activities.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {children.length === 0 && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(true);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Child
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingChild ? 'Edit Child Information' : 'Add New Child'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingChild(null);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaUser className="inline mr-2" />Full Name *
                      </label>
                      <input
                        type="text"
                        name="childFullName"
                        value={formData.childFullName}
                        onChange={handleInputChange}
                        className={inputClasses('childFullName')}
                        placeholder="Enter child's full name"
                      />
                      {formErrors.childFullName && 
                        <p className="text-red-500 text-sm mt-1">{formErrors.childFullName}</p>
                      }
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaBirthdayCake className="inline mr-2" />Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className={inputClasses('dateOfBirth')}
                      />
                      {formErrors.dateOfBirth && 
                        <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>
                      }
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaVenusMars className="inline mr-2" />Gender *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className={inputClasses('gender')}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {formErrors.gender && 
                        <p className="text-red-500 text-sm mt-1">{formErrors.gender}</p>
                      }
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaGraduationCap className="inline mr-2" />Grade/Class
                      </label>
                      <input
                        type="text"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className={inputClasses('grade')}
                        placeholder="e.g., Grade 5, Class 10"
                      />
                    </div>

                    {/* School Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">School Information</h3>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaSchool className="inline mr-2" />School Name *
                      </label>
                      <input
                        type="text"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleInputChange}
                        className={inputClasses('schoolName')}
                        placeholder="Enter school name"
                      />
                      {formErrors.schoolName && 
                        <p className="text-red-500 text-sm mt-1">{formErrors.schoolName}</p>
                      }
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaMapMarkerAlt className="inline mr-2" />Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={inputClasses('address')}
                        placeholder="Enter address"
                        rows={3}
                      />
                    </div>

                    {/* Additional Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Group
                      </label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        className={inputClasses('bloodGroup')}
                      >
                        <option value="">Select blood group</option>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        className={inputClasses('emergencyContact')}
                        placeholder="Emergency contact number"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergies
                      </label>
                      <textarea
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleInputChange}
                        className={inputClasses('allergies')}
                        placeholder="List any known allergies"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical Conditions
                      </label>
                      <textarea
                        name="medicalConditions"
                        value={formData.medicalConditions}
                        onChange={handleInputChange}
                        className={inputClasses('medicalConditions')}
                        placeholder="List any medical conditions"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClipboardList className="inline mr-2" />Additional Notes
                      </label>
                      <textarea
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        className={inputClasses('additionalInfo')}
                        placeholder="Any additional information about your child"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingChild(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      <FaTimes className="mr-2 inline" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FaSave className="mr-2 inline" />
                      {editingChild ? 'Update Child' : 'Add Child'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Child Modal */}
      <AnimatePresence>
        {viewingChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {viewingChild.childFullName || viewingChild.child_full_name}
                  </h2>
                  <button
                    onClick={() => setViewingChild(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900">
                        {viewingChild.dateOfBirth || viewingChild.date_of_birth ? 
                          new Date(viewingChild.dateOfBirth || viewingChild.date_of_birth).toLocaleDateString() 
                          : 'Not provided'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-gray-900 capitalize">{viewingChild.gender || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Grade</label>
                      <p className="text-gray-900">{viewingChild.grade || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">School</label>
                      <p className="text-gray-900">{viewingChild.schoolName || viewingChild.school_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Blood Group</label>
                      <p className="text-gray-900">{viewingChild.bloodGroup || viewingChild.blood_group || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                      <p className="text-gray-900">{viewingChild.emergencyContact || viewingChild.emergency_contact || 'Not specified'}</p>
                    </div>
                  </div>

                  {(viewingChild.address || viewingChild.allergies || viewingChild.medicalConditions || viewingChild.additionalInfo) && (
                    <>
                      <hr />
                      <div className="space-y-4">
                        {viewingChild.address && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Address</label>
                            <p className="text-gray-900">{viewingChild.address}</p>
                          </div>
                        )}
                        {viewingChild.allergies && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Allergies</label>
                            <p className="text-gray-900">{viewingChild.allergies}</p>
                          </div>
                        )}
                        {viewingChild.medicalConditions && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Medical Conditions</label>
                            <p className="text-gray-900">{viewingChild.medicalConditions}</p>
                          </div>
                        )}
                        {viewingChild.additionalInfo && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Additional Information</label>
                            <p className="text-gray-900">{viewingChild.additionalInfo}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      setViewingChild(null);
                      handleEdit(viewingChild);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-4"
                  >
                    <FaEdit className="mr-2 inline" />
                    Edit
                  </button>
                  <button
                    onClick={() => setViewingChild(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
