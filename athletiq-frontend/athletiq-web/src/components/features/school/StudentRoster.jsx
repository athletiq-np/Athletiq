// src/components/features/school/StudentRoster.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaUserGraduate, FaPlus, FaEdit, FaTrash, FaEye, FaDownload,
  FaSearch, FaFilter, FaSort, FaUpload, FaFileExcel, FaPhone,
  FaBirthdayCake, FaMale, FaFemale, FaTimes, FaUser, FaCalendarAlt,
  FaGraduationCap, FaHome, FaEnvelope, FaIdCard, FaUsers, FaHeart,
  FaCheckCircle, FaTrophy, FaAngleDoubleLeft, FaAngleDoubleRight,
  FaAngleLeft, FaAngleRight
} from 'react-icons/fa';
import { MdFilterList, MdGridView, MdViewList, MdSchool } from 'react-icons/md';
import { HiOutlinePhone, HiOutlineUser, HiOutlineCalendar } from 'react-icons/hi';
import AddAthleteModal from '../athlete/SimpleAddModal';
import EditAthleteModal from '../athlete/SimpleEditModal';
import ViewAthleteModal from '../athlete/ViewAthleteModal';
import BulkAthleteUploadModal from '../athlete/SimpleBulkModal';
import apiClient from '@/api/apiClient';

/**
 * 👥 Student Roster Component
 * Comprehensive student management with filtering, search, and bulk actions
 */
export default function StudentRoster({ 
  students, 
  houses, 
  onRefresh, 
  onAddAthlete, 
  onBulkRegistration,
  filters, 
  setFilters, 
  globalSearch 
}) {
  // Modal state management
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [houseFilter, setHouseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Enhanced mock data with photos and better structure
  const mockStudents = [
    {
      id: 1,
      name: 'Ram Bahadur Thapa',
      nameNepali: 'राम बहादुर थापा',
      grade: 10,
      section: 'A',
      house: 'Red House',
      rollNumber: '001',
      dateOfBirth: '2008-05-15',
      age: 16,
      gender: 'Male',
      guardianName: 'Shyam Bahadur Thapa',
      guardianPhone: '9841234567',
      guardianEmail: 'shyam.thapa@email.com',
      address: 'Kathmandu, Nepal',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      documents: ['Birth Certificate', 'Photo'],
      status: 'Active',
      joinDate: '2023-04-01',
      emergencyContact: '9851234567',
      bloodGroup: 'O+',
      medicalConditions: 'None',
      sportsInterests: ['Football', 'Basketball']
    },
    {
      id: 2,
      name: 'Sita Kumari Sharma',
      nameNepali: 'सीता कुमारी शर्मा',
      grade: 9,
      section: 'B',
      house: 'Blue House',
      rollNumber: '002',
      dateOfBirth: '2009-08-22',
      age: 15,
      gender: 'Female',
      guardianName: 'Hari Sharma',
      guardianPhone: '9851234568',
      guardianEmail: 'hari.sharma@email.com',
      address: 'Pokhara, Nepal',
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b5eb?w=150&h=150&fit=crop&crop=face',
      documents: ['Birth Certificate'],
      status: 'Active',
      joinDate: '2023-04-01',
      emergencyContact: '9861234568',
      bloodGroup: 'A+',
      medicalConditions: 'None',
      sportsInterests: ['Volleyball', 'Badminton']
    },
    {
      id: 3,
      name: 'Arjun Khadka',
      nameNepali: 'अर्जुन खड्का',
      grade: 10,
      section: 'A',
      house: 'Green House',
      rollNumber: '003',
      dateOfBirth: '2008-12-10',
      age: 16,
      gender: 'Male',
      guardianName: 'Binod Khadka',
      guardianPhone: '9861234569',
      guardianEmail: 'binod.khadka@email.com',
      address: 'Chitwan, Nepal',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      documents: ['Birth Certificate', 'Photo', 'Medical Certificate'],
      status: 'Active',
      joinDate: '2023-04-01',
      emergencyContact: '9871234569',
      bloodGroup: 'B+',
      medicalConditions: 'Asthma',
      sportsInterests: ['Cricket', 'Athletics']
    },
    {
      id: 4,
      name: 'Maya Gurung',
      nameNepali: 'माया गुरुङ',
      grade: 11,
      section: 'A',
      house: 'Yellow House',
      rollNumber: '004',
      dateOfBirth: '2007-03-18',
      age: 17,
      gender: 'Female',
      guardianName: 'Tanka Gurung',
      guardianPhone: '9881234570',
      guardianEmail: 'tanka.gurung@email.com',
      address: 'Pokhara, Nepal',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      documents: ['Birth Certificate', 'Photo'],
      status: 'Active',
      joinDate: '2023-04-01',
      emergencyContact: '9891234570',
      bloodGroup: 'AB+',
      medicalConditions: 'None',
      sportsInterests: ['Tennis', 'Swimming']
    },
    {
      id: 5,
      name: 'Suresh Tamang',
      nameNepali: 'सुरेश तामाङ',
      grade: 8,
      section: 'C',
      house: 'Red House',
      rollNumber: '005',
      dateOfBirth: '2010-07-25',
      age: 14,
      gender: 'Male',
      guardianName: 'Pemba Tamang',
      guardianPhone: '9801234571',
      guardianEmail: 'pemba.tamang@email.com',
      address: 'Lalitpur, Nepal',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      documents: ['Birth Certificate'],
      status: 'Active',
      joinDate: '2023-04-01',
      emergencyContact: '9811234571',
      bloodGroup: 'O-',
      medicalConditions: 'None',
      sportsInterests: ['Football', 'Table Tennis']
    },
    {
      id: 6,
      name: 'Anita Rai',
      nameNepali: 'अनिता राई',
      grade: 9,
      section: 'A',
      house: 'Blue House',
      rollNumber: '006',
      dateOfBirth: '2009-11-12',
      age: 15,
      gender: 'Female',
      guardianName: 'Kumar Rai',
      guardianPhone: '9821234572',
      guardianEmail: 'kumar.rai@email.com',
      address: 'Biratnagar, Nepal',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      documents: ['Birth Certificate', 'Photo', 'Medical Certificate'],
      status: 'Active',
      joinDate: '2023-04-01',
      emergencyContact: '9831234572',
      bloodGroup: 'A-',
      medicalConditions: 'None',
      sportsInterests: ['Basketball', 'Handball']
    }
  ];

  const displayStudents = students.length > 0 ? students : mockStudents;

  // Filtering and sorting logic
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = displayStudents.filter(student => {
      const matchesSearch = !searchTerm || 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nameNepali?.includes(searchTerm) ||
        student.rollNumber.includes(searchTerm) ||
        student.guardianPhone.includes(searchTerm);
      
      const matchesGrade = !gradeFilter || student.grade.toString() === gradeFilter;
      const matchesGender = !genderFilter || student.gender.toLowerCase() === genderFilter.toLowerCase();
      const matchesHouse = !houseFilter || student.house === houseFilter;
      
      return matchesSearch && matchesGrade && matchesGender && matchesHouse;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [displayStudents, searchTerm, gradeFilter, genderFilter, houseFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, startIndex + itemsPerPage);

  // Action handlers
  const handleAddStudent = async (studentData) => {
    try {
      setLoading(true);
      
      // For now, just simulate success since we're using mock data
      // In production, this would call: await apiClient.post('/schools/me/players', studentData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Student added successfully');
      setShowAddModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Add student error:', error);
      toast.error('Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        setLoading(true);
        await apiClient.delete(`/schools/me/players/${studentId}`);
        toast.success('Student deleted successfully');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Delete student error:', error);
        toast.error('Failed to delete student');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateStudent = async (studentData) => {
    try {
      setLoading(true);
      
      // For now, just simulate success since we're using mock data
      // In production, this would call: await apiClient.put(`/schools/me/players/${selectedStudent.id}`, studentData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Student updated successfully');
      setShowEditModal(false);
      setSelectedStudent(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Update student error:', error);
      toast.error('Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (uploadData) => {
    try {
      setLoading(true);
      
      // For now, just simulate success since we're using mock data
      // In production, this would call: await apiClient.post('/schools/me/players/bulk-import', uploadData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Students imported successfully');
      setShowBulkUploadModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to import students');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setGradeFilter('');
    setGenderFilter('');
    setHouseFilter('');
    setCurrentPage(1);
  };

  const handleStudentClick = (student) => {
    // Close all other modals first
    setShowAddModal(false);
    setShowEditModal(false);
    setShowBulkUploadModal(false);
    // Set student and open view modal
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEditClick = (student, e) => {
    e.stopPropagation(); // Prevent triggering student click
    // Close all other modals first
    setShowAddModal(false);
    setShowViewModal(false);
    setShowBulkUploadModal(false);
    // Set student and open edit modal
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Get gender-based styling
  const getGenderStyling = (gender) => {
    return gender.toLowerCase() === 'male' 
      ? {
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          hoverColor: 'hover:bg-blue-100'
        }
      : {
          borderColor: 'border-pink-200', 
          bgColor: 'bg-pink-50',
          textColor: 'text-pink-800',
          iconColor: 'text-pink-600',
          hoverColor: 'hover:bg-pink-100'
        };
  };

  const gradeOptions = [...new Set(displayStudents.map(s => s.grade))].sort();
  const houseOptions = [...new Set(displayStudents.map(s => s.house))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
            Student Roster
          </h2>
          <p className="text-gray-600 mt-1">Manage your school's student community</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>{filteredAndSortedStudents.length} Students</span>
            <span>•</span>
            <span>{filteredAndSortedStudents.filter(s => s.gender === 'Male').length} Male</span>
            <span>•</span>
            <span>{filteredAndSortedStudents.filter(s => s.gender === 'Female').length} Female</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (onAddAthlete) {
                onAddAthlete();
              } else {
                // Fallback to local modal if prop not provided
                setShowEditModal(false);
                setShowViewModal(false);
                setShowBulkUploadModal(false);
                setSelectedStudent(null);
                setShowAddModal(true);
              }
            }}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="h-4 w-4" />
            <span>Add Athlete</span>
          </button>
          <button 
            onClick={() => {
              if (onBulkRegistration) {
                onBulkRegistration();
              } else {
                // Fallback to local modal if prop not provided
                setShowAddModal(false);
                setShowEditModal(false);
                setShowViewModal(false);
                setSelectedStudent(null);
                setShowBulkUploadModal(true);
              }
            }}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <FaUpload className="h-4 w-4" />
            <span>Bulk Registration</span>
          </button>
        </div>
      </motion.div>

      {/* Enhanced Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FaFilter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
              <p className="text-sm text-gray-500">Find students quickly</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MdGridView className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MdViewList className="h-4 w-4" />
              </button>
            </div>
            <button 
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, phone, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          {/* Grade Filter */}
          <select 
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Grades</option>
            {gradeOptions.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          
          {/* Gender Filter */}
          <select 
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          
          {/* House Filter */}
          <select 
            value={houseFilter}
            onChange={(e) => setHouseFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Houses</option>
            {houseOptions.map(house => (
              <option key={house} value={house}>{house}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Students Grid/List */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {paginatedStudents.map((student, index) => {
                const genderStyle = getGenderStyling(student.gender);
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleStudentClick(student)}
                    className={`relative bg-white rounded-2xl border-2 ${genderStyle.borderColor} ${genderStyle.bgColor} p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${genderStyle.hoverColor} group`}
                  >
                    {/* Gender Indicator */}
                    <div className={`absolute top-4 right-4 w-8 h-8 rounded-full ${genderStyle.bgColor} border-2 ${genderStyle.borderColor} flex items-center justify-center`}>
                      {student.gender === 'Male' ? (
                        <FaMale className={`h-4 w-4 ${genderStyle.iconColor}`} />
                      ) : (
                        <FaFemale className={`h-4 w-4 ${genderStyle.iconColor}`} />
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => handleEditClick(student, e)}
                      className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50"
                    >
                      <FaEdit className="h-3 w-3 text-gray-600" />
                    </button>

                    {/* Student Photo */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className={`w-20 h-20 rounded-full border-4 ${genderStyle.borderColor} overflow-hidden shadow-lg`}>
                          {student.photo ? (
                            <img 
                              src={student.photo} 
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full ${genderStyle.bgColor} flex items-center justify-center`}>
                              <FaUserGraduate className={`h-8 w-8 ${genderStyle.iconColor}`} />
                            </div>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 ${genderStyle.borderColor} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${genderStyle.textColor}`}>
                            {student.grade}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="text-center space-y-3">
                      <div>
                        <h3 className={`font-bold text-lg ${genderStyle.textColor} hover:underline`}>
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-600">{student.nameNepali}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <MdSchool className={`h-4 w-4 ${genderStyle.iconColor}`} />
                          <span className="text-sm font-medium text-gray-700">
                            Grade {student.grade} - {student.section}
                          </span>
                        </div>

                        <div className="flex items-center justify-center space-x-2">
                          <HiOutlinePhone className={`h-4 w-4 ${genderStyle.iconColor}`} />
                          <span className="text-sm text-gray-600">
                            {student.guardianPhone}
                          </span>
                        </div>

                        <div className="flex items-center justify-center space-x-2">
                          <HiOutlineCalendar className={`h-4 w-4 ${genderStyle.iconColor}`} />
                          <span className="text-sm text-gray-600">
                            Age {student.age}
                          </span>
                        </div>
                      </div>

                      {/* House Badge */}
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${genderStyle.bgColor} ${genderStyle.textColor} border ${genderStyle.borderColor}`}>
                          {student.house}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-1">Photo</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-1">Grade</div>
                <div className="col-span-1">Gender</div>
                <div className="col-span-2">Guardian Phone</div>
                <div className="col-span-1">Age</div>
                <div className="col-span-2">House</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {paginatedStudents.map((student, index) => {
                const genderStyle = getGenderStyling(student.gender);
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleStudentClick(student)}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 hover:${genderStyle.bgColor} cursor-pointer transition-all duration-200 items-center`}
                  >
                    <div className="col-span-1">
                      <div className={`w-12 h-12 rounded-full border-2 ${genderStyle.borderColor} overflow-hidden`}>
                        {student.photo ? (
                          <img 
                            src={student.photo} 
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${genderStyle.bgColor} flex items-center justify-center`}>
                            <FaUserGraduate className={`h-5 w-5 ${genderStyle.iconColor}`} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className={`font-semibold ${genderStyle.textColor} hover:underline`}>
                        {student.name}
                      </div>
                      <div className="text-sm text-gray-500">{student.nameNepali}</div>
                    </div>
                    <div className="col-span-1">
                      <span className="font-medium text-gray-900">Grade {student.grade}</span>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        {student.gender === 'Male' ? (
                          <FaMale className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FaFemale className="h-4 w-4 text-pink-600" />
                        )}
                        <span className="text-sm text-gray-600">{student.gender}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <HiOutlinePhone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{student.guardianPhone}</span>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm text-gray-900">{student.age} years</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${genderStyle.bgColor} ${genderStyle.textColor}`}>
                        {student.house}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={(e) => handleEditClick(student, e)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center items-center space-x-2"
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} students
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <FaAngleDoubleLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <FaAngleLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <FaAngleRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <FaAngleDoubleRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Enhanced Student Profile Modal */}
      <AnimatePresence>
        {showViewModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className={`relative p-8 ${getGenderStyling(selectedStudent.gender).bgColor} rounded-t-3xl`}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedStudent(null);
                  }}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                >
                  <FaTimes className="h-4 w-4 text-gray-600" />
                </button>

                <div className="flex items-center space-x-6">
                  <div className={`w-24 h-24 rounded-full border-4 ${getGenderStyling(selectedStudent.gender).borderColor} overflow-hidden shadow-lg`}>
                    {selectedStudent.photo ? (
                      <img 
                        src={selectedStudent.photo} 
                        alt={selectedStudent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full bg-white flex items-center justify-center`}>
                        <FaUserGraduate className={`h-12 w-12 ${getGenderStyling(selectedStudent.gender).iconColor}`} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className={`text-3xl font-bold ${getGenderStyling(selectedStudent.gender).textColor}`}>
                      {selectedStudent.name}
                    </h2>
                    <p className="text-lg text-gray-700 mt-1">{selectedStudent.nameNepali}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white ${getGenderStyling(selectedStudent.gender).textColor}`}>
                        Roll #{selectedStudent.rollNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white ${getGenderStyling(selectedStudent.gender).textColor}`}>
                        {selectedStudent.house}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      setShowViewModal(false);
                      handleEditClick(selectedStudent, e);
                    }}
                    className="bg-white text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-md"
                  >
                    <FaEdit className="h-4 w-4 mr-2 inline" />
                    Edit
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FaBirthdayCake className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="font-medium">{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <HiOutlineCalendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Age</p>
                          <p className="font-medium">{selectedStudent.age} years old</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {selectedStudent.gender === 'Male' ? (
                          <FaMale className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FaFemale className="h-5 w-5 text-pink-600" />
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p className="font-medium">{selectedStudent.gender}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FaGraduationCap className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Class</p>
                          <p className="font-medium">Grade {selectedStudent.grade} - Section {selectedStudent.section}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FaHome className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{selectedStudent.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Guardian Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <HiOutlineUser className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Guardian Name</p>
                          <p className="font-medium">{selectedStudent.guardianName}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <HiOutlinePhone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">{selectedStudent.guardianPhone}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FaEnvelope className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedStudent.guardianEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FaPhone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Emergency Contact</p>
                          <p className="font-medium">{selectedStudent.emergencyContact}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Medical Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FaHeart className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="text-sm text-gray-500">Blood Group</p>
                          <p className="font-medium">{selectedStudent.bloodGroup}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FaIdCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Medical Conditions</p>
                          <p className="font-medium">{selectedStudent.medicalConditions || 'None'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sports & Activities */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Sports & Activities</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <FaTrophy className="h-5 w-5 text-yellow-500 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Sports Interests</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedStudent.sportsInterests?.map((sport, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                              >
                                {sport}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Documents</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedStudent.documents?.map((doc, index) => (
                      <span 
                        key={index}
                        className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center space-x-2"
                      >
                        <FaCheckCircle className="h-4 w-4" />
                        <span>{doc}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Working Modals */}
      {showAddModal && (
        <AddAthleteModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStudent}
          houses={houses}
        />
      )}

      {showEditModal && selectedStudent && (
        <EditAthleteModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStudent(null);
          }}
          onSubmit={handleUpdateStudent}
          student={selectedStudent}
          houses={houses}
        />
      )}

      {showBulkUploadModal && (
        <BulkAthleteUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onSubmit={handleBulkUpload}
          houses={houses}
        />
      )}
    </div>
  );
}
