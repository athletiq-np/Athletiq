// src/components/features/school/StudentRoster.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaUserGraduate, FaPlus, FaEdit, FaTrash, FaEye, FaDownload,
  FaSearch, FaFilter, FaSort, FaUpload, FaFileExcel
} from 'react-icons/fa';
import { MdFilterList } from 'react-icons/md';

/**
 * 👥 Student Roster Component
 * Comprehensive student management with filtering, search, and bulk actions
 */
export default function StudentRoster({ students, houses, onRefresh, filters, setFilters, globalSearch }) {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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
      gender: 'Male',
      guardianName: 'Shyam Bahadur Thapa',
      guardianPhone: '9841234567',
      photo: null,
      documents: ['Birth Certificate', 'Photo'],
      status: 'Active',
      joinDate: '2023-04-01'
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
      gender: 'Female',
      guardianName: 'Hari Sharma',
      guardianPhone: '9851234568',
      photo: null,
      documents: ['Birth Certificate'],
      status: 'Active',
      joinDate: '2023-04-01'
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
      gender: 'Male',
      guardianName: 'Binod Khadka',
      guardianPhone: '9861234569',
      photo: null,
      documents: ['Birth Certificate', 'Photo', 'Medical Certificate'],
      status: 'Active',
      joinDate: '2023-04-01'
    }
  ];

  const displayStudents = students.length > 0 ? students : mockStudents;

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === displayStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(displayStudents.map(student => student.id));
    }
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} for students:`, selectedStudents);
    // Implement bulk actions
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const gradeOptions = [...new Set(displayStudents.map(s => s.grade))].sort();
  const sectionOptions = [...new Set(displayStudents.map(s => s.section))].sort();
  const houseOptions = [...new Set(displayStudents.map(s => s.house))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Roster</h2>
          <p className="text-gray-600">Manage student registrations and information</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-athletiq-blue text-white px-4 py-2 rounded-lg hover:bg-athletiq-navy transition-colors flex items-center space-x-2"
          >
            <FaPlus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
            <FaUpload className="h-4 w-4" />
            <span>Bulk Import</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          <button className="text-sm text-athletiq-blue hover:text-athletiq-navy">
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
            />
          </div>
          
          {/* Grade Filter */}
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent">
            <option value="">All Grades</option>
            {gradeOptions.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          
          {/* Section Filter */}
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent">
            <option value="">All Sections</option>
            {sectionOptions.map(section => (
              <option key={section} value={section}>Section {section}</option>
            ))}
          </select>
          
          {/* House Filter */}
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent">
            <option value="">All Houses</option>
            {houseOptions.map(house => (
              <option key={house} value={house}>{house}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedStudents.length} students selected
              </span>
              <button
                onClick={() => setSelectedStudents([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('assign-house')}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Assign House
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Export
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === displayStudents.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-athletiq-blue focus:ring-athletiq-blue"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Student</span>
                    <FaSort className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade/Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  House
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guardian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="rounded border-gray-300 text-athletiq-blue focus:ring-athletiq-blue"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {student.photo ? (
                          <img className="h-10 w-10 rounded-full" src={student.photo} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FaUserGraduate className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.nameNepali}</div>
                        <div className="text-xs text-gray-400">Roll: {student.rollNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Grade {student.grade}</div>
                    <div className="text-sm text-gray-500">Section {student.section}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {student.house}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.guardianName}</div>
                    <div className="text-sm text-gray-500">{student.guardianPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-900">{student.documents.length}</span>
                      <span className="text-xs text-gray-500">docs</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{displayStudents.length}</span> of{' '}
          <span className="font-medium">{displayStudents.length}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-2 bg-athletiq-blue text-white rounded-lg text-sm hover:bg-athletiq-navy">
            1
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
