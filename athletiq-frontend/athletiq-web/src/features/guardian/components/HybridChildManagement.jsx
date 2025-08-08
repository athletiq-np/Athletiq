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

const HybridChildManagement = () => {
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
  
  const [formData, setFormData] = useState({
    childFullName: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    school: '',
    address: ''
  });

  // Load children on component mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reset form data
  const resetForm = () => {
    setFormData({
      childFullName: '',
      dateOfBirth: '',
      gender: '',
      grade: '',
      school: '',
      address: ''
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChild) {
        await updateChild(editingChild.id, formData);
        toast.success('Child information updated successfully!');
      } else {
        await addChild(formData);
        toast.success('Child added successfully!');
      }
      setShowAddForm(false);
      setEditingChild(null);
      resetForm();
    } catch (error) {
      console.error('Error saving child:', error);
      toast.error('Failed to save child information. Please try again.');
    }
  };

  // Handle edit child
  const handleEditChild = (child) => {
    setFormData({
      childFullName: child.childFullName || child.child_full_name || '',
      dateOfBirth: child.dateOfBirth || child.date_of_birth || '',
      gender: child.gender || '',
      grade: child.grade || '',
      school: child.school || '',
      address: child.address || ''
    });
    setEditingChild(child);
    setFormMode('basic'); // Default to basic mode for editing
    setShowAddForm(true);
  };

  // Filter and sort children
  const filteredAndSortedChildren = children
    .filter(child => {
      const name = (child.childFullName || child.child_full_name || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const matchesGender = !filterGender || child.gender === filterGender;
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      const aValue = (a.childFullName || a.child_full_name || '').toLowerCase();
      const bValue = (b.childFullName || b.child_full_name || '').toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaChild className="mr-3 text-blue-600" />
            Children Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your children's information and activities
          </p>
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
            <FaBolt className="mr-2" />
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Children</h3>
          <p className="text-2xl font-bold text-blue-900">{children.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Active</h3>
          <p className="text-2xl font-bold text-green-900">{children.filter(c => c.status !== 'inactive').length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Male</h3>
          <p className="text-2xl font-bold text-purple-900">{children.filter(c => c.gender === 'Male').length}</p>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-pink-600">Female</h3>
          <p className="text-2xl font-bold text-pink-900">{children.filter(c => c.gender === 'Female').length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search children..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
            <span className="ml-2">Sort</span>
          </button>
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
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaChild className="text-blue-600 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {child.childFullName || child.child_full_name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FaBirthdayCake className="mr-1" />
                            Age {calculateAge(child.dateOfBirth || child.date_of_birth)}
                          </span>
                          <span className="flex items-center">
                            <FaVenusMars className="mr-1" />
                            {child.gender || 'Not specified'}
                          </span>
                          <span className="flex items-center">
                            <FaGraduationCap className="mr-1" />
                            {child.grade || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewingChild(child)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEditChild(child)}
                      className="p-2 text-gray-400 hover:text-indigo-600"
                      title="Edit"
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
            <FaChild className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No children found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {children.length === 0 
                ? 'Get started by adding your first child.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {children.length === 0 && (
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => {
                    resetForm();
                    setFormMode('basic');
                    setShowAddForm(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Quick Add Your First Child
                </button>
                <button
                  onClick={() => {
                    setFormMode('advanced');
                    setShowAddForm(true);
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Advanced Registration
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal - Hybrid Mode */}
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
              className={`bg-white rounded-lg shadow-xl ${
                formMode === 'advanced' ? 'max-w-6xl w-full max-h-[95vh]' : 'max-w-2xl w-full max-h-[90vh]'
              } overflow-y-auto`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingChild ? 'Edit Child Information' : 
                        formMode === 'advanced' ? 'Advanced Child Registration' : 'Quick Add Child'
                      }
                    </h2>
                    {!editingChild && (
                      <div className="flex items-center mt-2 space-x-4">
                        <button
                          type="button"
                          onClick={() => setFormMode('basic')}
                          className={`px-3 py-1 text-sm rounded-md flex items-center ${
                            formMode === 'basic' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <FaBolt className="mr-1 w-3 h-3" />
                          Quick Mode
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormMode('advanced')}
                          className={`px-3 py-1 text-sm rounded-md flex items-center ${
                            formMode === 'advanced' 
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <FaRocket className="mr-1 w-3 h-3" />
                          Advanced Mode
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingChild(null);
                      resetForm();
                      setFormMode('basic');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Render appropriate form based on mode */}
                {formMode === 'advanced' ? (
                  <AthleteForm
                    onSubmit={async (athleteData) => {
                      try {
                        // Transform AthleteForm data to match our child structure
                        const childData = {
                          childFullName: `${athleteData.firstName} ${athleteData.lastName}`,
                          dateOfBirth: athleteData.dateOfBirth,
                          gender: athleteData.gender,
                          grade: athleteData.grade,
                          school: athleteData.schoolName,
                          // Map additional fields as needed
                          emergencyContact: athleteData.emergencyContactName,
                          emergencyPhone: athleteData.emergencyContactPhone,
                          address: athleteData.address,
                          city: athleteData.city,
                          medicalConditions: athleteData.medicalConditions,
                          // Add other mappings...
                        };

                        if (editingChild) {
                          await updateChild(editingChild.id, childData);
                          toast.success('Child information updated successfully!');
                        } else {
                          await addChild(childData);
                          toast.success('Child registered successfully with advanced details!');
                        }
                        
                        setShowAddForm(false);
                        setEditingChild(null);
                        resetForm();
                        setFormMode('basic');
                      } catch (error) {
                        console.error('Registration error:', error);
                        toast.error('Failed to register child. Please try again.');
                      }
                    }}
                    onCancel={() => {
                      setShowAddForm(false);
                      setEditingChild(null);
                      resetForm();
                      setFormMode('basic');
                    }}
                    initialData={editingChild ? {
                      firstName: editingChild.childFullName?.split(' ')[0] || '',
                      lastName: editingChild.childFullName?.split(' ').slice(1).join(' ') || '',
                      dateOfBirth: editingChild.dateOfBirth,
                      gender: editingChild.gender,
                      grade: editingChild.grade,
                      schoolName: editingChild.school,
                      // Map other fields back
                    } : null}
                  />
                ) : (
                  // Basic form (existing form)
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaUser className="inline mr-2" />
                          Child Full Name *
                        </label>
                        <input
                          type="text"
                          name="childFullName"
                          value={formData.childFullName}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter child's full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaBirthdayCake className="inline mr-2" />
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaVenusMars className="inline mr-2" />
                          Gender *
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaGraduationCap className="inline mr-2" />
                          Grade/Class
                        </label>
                        <select
                          name="grade"
                          value={formData.grade}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Grade</option>
                          <option value="Nursery">Nursery</option>
                          <option value="LKG">LKG</option>
                          <option value="UKG">UKG</option>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                            <option key={grade} value={`Grade ${grade}`}>Grade {grade}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaSchool className="inline mr-2" />
                          School Name
                        </label>
                        <input
                          type="text"
                          name="school"
                          value={formData.school}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter school name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaMapMarkerAlt className="inline mr-2" />
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingChild(null);
                          resetForm();
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
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
                )}
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

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900">{viewingChild.dateOfBirth || viewingChild.date_of_birth || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Age</label>
                      <p className="text-gray-900">{calculateAge(viewingChild.dateOfBirth || viewingChild.date_of_birth)} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-gray-900">{viewingChild.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Grade</label>
                      <p className="text-gray-900">{viewingChild.grade || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500">School</label>
                      <p className="text-gray-900">{viewingChild.school || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{viewingChild.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HybridChildManagement;
