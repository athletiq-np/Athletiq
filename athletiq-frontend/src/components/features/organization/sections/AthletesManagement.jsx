// src/components/features/organization/sections/AthletesManagement.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaPlus, FaSearch, FaFilter, FaDownload, FaEdit, FaTrash,
  FaEye, FaSchool, FaUserGraduate, FaCheckCircle, FaExclamationTriangle,
  FaSort, FaSortUp, FaSortDown, FaFileExcel, FaFilePdf
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import organizationAPI from '@/api/organizationApi';
import { toast } from 'react-toastify';

/**
 * Athletes Management Section
 * Manage organization athletes with school requirement enforcement
 */
export default function AthletesManagement({ data, loading, error, onRefresh, onDataUpdate }) {
  const { t } = useTranslation();
  
  // State management
  const [athletes, setAthletes] = useState(data?.athletes || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAthlete, setCurrentAthlete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding/editing athletes
  const [athleteForm, setAthleteForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    school_id: '',
    sport: '',
    grade_level: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: '',
    notes: ''
  });

  // Filter and sort athletes
  const filteredAthletes = React.useMemo(() => {
    let filtered = [...athletes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(athlete =>
        athlete.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(athlete => athlete.status === filterStatus);
    }

    // School filter
    if (filterSchool !== 'all') {
      filtered = filtered.filter(athlete => athlete.school_id === filterSchool);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [athletes, searchTerm, filterStatus, filterSchool, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle athlete selection
  const handleSelectAthlete = (athleteId) => {
    setSelectedAthletes(prev => 
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAthletes.length === filteredAthletes.length) {
      setSelectedAthletes([]);
    } else {
      setSelectedAthletes(filteredAthletes.map(athlete => athlete.id));
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAthleteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add athlete
  const handleAddAthlete = async (e) => {
    e.preventDefault();
    
    // Validate school selection
    if (!athleteForm.school_id) {
      toast.error(t('organization.athletes.error.schoolRequired', 'School selection is required for all athletes'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await organizationAPI.registerAthlete(athleteForm);
      
      if (response.success) {
        toast.success(t('organization.athletes.success.athleteAdded', 'Athlete registered successfully'));
        setAthletes(prev => [response.data, ...prev]);
        setShowAddModal(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(response.message || t('organization.athletes.error.addFailed', 'Failed to register athlete'));
      }
    } catch (error) {
      console.error('Error adding athlete:', error);
      toast.error(t('organization.athletes.error.addFailed', 'Failed to register athlete'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit athlete
  const handleEditAthlete = async (e) => {
    e.preventDefault();
    
    if (!currentAthlete) return;

    setIsSubmitting(true);
    try {
      const response = await organizationAPI.updateAthlete(currentAthlete.id, athleteForm);
      
      if (response.success) {
        toast.success(t('organization.athletes.success.athleteUpdated', 'Athlete updated successfully'));
        setAthletes(prev => prev.map(athlete => 
          athlete.id === currentAthlete.id ? response.data : athlete
        ));
        setShowEditModal(false);
        setCurrentAthlete(null);
        resetForm();
        onRefresh();
      } else {
        toast.error(response.message || t('organization.athletes.error.updateFailed', 'Failed to update athlete'));
      }
    } catch (error) {
      console.error('Error updating athlete:', error);
      toast.error(t('organization.athletes.error.updateFailed', 'Failed to update athlete'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete athlete
  const handleDeleteAthlete = async (athleteId) => {
    if (!window.confirm(t('organization.athletes.confirm.delete', 'Are you sure you want to remove this athlete?'))) {
      return;
    }

    try {
      const response = await organizationAPI.removeAthlete(athleteId);
      
      if (response.success) {
        toast.success(t('organization.athletes.success.athleteDeleted', 'Athlete removed successfully'));
        setAthletes(prev => prev.filter(athlete => athlete.id !== athleteId));
        setSelectedAthletes(prev => prev.filter(id => id !== athleteId));
        onRefresh();
      } else {
        toast.error(response.message || t('organization.athletes.error.deleteFailed', 'Failed to remove athlete'));
      }
    } catch (error) {
      console.error('Error deleting athlete:', error);
      toast.error(t('organization.athletes.error.deleteFailed', 'Failed to remove athlete'));
    }
  };

  // Reset form
  const resetForm = () => {
    setAthleteForm({
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      school_id: '',
      sport: '',
      grade_level: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_conditions: '',
      notes: ''
    });
  };

  // Open edit modal
  const openEditModal = (athlete) => {
    setCurrentAthlete(athlete);
    setAthleteForm({
      full_name: athlete.full_name || '',
      email: athlete.email || '',
      phone: athlete.phone || '',
      date_of_birth: athlete.date_of_birth || '',
      gender: athlete.gender || '',
      school_id: athlete.school_id || '',
      sport: athlete.sport || '',
      grade_level: athlete.grade_level || '',
      emergency_contact_name: athlete.emergency_contact_name || '',
      emergency_contact_phone: athlete.emergency_contact_phone || '',
      medical_conditions: athlete.medical_conditions || '',
      notes: athlete.notes || ''
    });
    setShowEditModal(true);
  };

  // Export athletes
  const handleExport = async (format) => {
    try {
      const response = await organizationAPI.exportAthletes(format);
      
      if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `athletes.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        toast.success(t('organization.athletes.success.exported', 'Athletes exported successfully'));
      }
    } catch (error) {
      console.error('Error exporting athletes:', error);
      toast.error(t('organization.athletes.error.exportFailed', 'Failed to export athletes'));
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="h-3 w-3" />;
    return sortDirection === 'asc' ? <FaSortUp className="h-3 w-3" /> : <FaSortDown className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('organization.athletes.title', 'Athletes Management')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('organization.athletes.subtitle', 'Manage your organization\'s registered athletes')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-athletiq-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <FaPlus className="h-4 w-4" />
            <span>{t('organization.athletes.addAthlete', 'Add Athlete')}</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('organization.athletes.searchPlaceholder', 'Search athletes...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{t('organization.athletes.filters.allStatuses', 'All Statuses')}</option>
            <option value="active">{t('organization.athletes.filters.active', 'Active')}</option>
            <option value="inactive">{t('organization.athletes.filters.inactive', 'Inactive')}</option>
            <option value="pending">{t('organization.athletes.filters.pending', 'Pending')}</option>
          </select>

          {/* School Filter */}
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{t('organization.athletes.filters.allSchools', 'All Schools')}</option>
            {data?.schools?.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>

          {/* Export Options */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title={t('organization.athletes.exportExcel', 'Export to Excel')}
            >
              <FaFileExcel className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title={t('organization.athletes.exportPdf', 'Export to PDF')}
            >
              <FaFilePdf className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedAthletes.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {t('organization.athletes.selectedCount', '{{count}} athletes selected', { count: selectedAthletes.length })}
              </span>
              <div className="flex items-center space-x-2">
                <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  {t('organization.athletes.bulkEdit', 'Bulk Edit')}
                </button>
                <button className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                  {t('organization.athletes.bulkDelete', 'Bulk Delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Athletes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedAthletes.length === filteredAthletes.length && filteredAthletes.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-athletiq-orange focus:ring-athletiq-orange"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('full_name')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>{t('organization.athletes.table.name', 'Name')}</span>
                    {getSortIcon('full_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('school_name')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>{t('organization.athletes.table.school', 'School')}</span>
                    {getSortIcon('school_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('sport')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <span>{t('organization.athletes.table.sport', 'Sport')}</span>
                    {getSortIcon('sport')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('organization.athletes.table.status', 'Status')}
                  </span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('organization.athletes.table.registered', 'Registered')}
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('organization.athletes.table.actions', 'Actions')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAthletes.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAthletes.includes(athlete.id)}
                      onChange={() => handleSelectAthlete(athlete.id)}
                      className="rounded border-gray-300 text-athletiq-orange focus:ring-athletiq-orange"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {athlete.full_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {athlete.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {athlete.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <FaSchool className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {athlete.school_name || t('organization.athletes.noSchool', 'No School')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {athlete.sport || 'Not specified'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      athlete.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : athlete.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {athlete.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {athlete.registration_date 
                        ? new Date(athlete.registration_date).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => console.log('View athlete', athlete.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title={t('common.view', 'View')}
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(athlete)}
                        className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                        title={t('common.edit', 'Edit')}
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAthlete(athlete.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title={t('common.delete', 'Delete')}
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAthletes.length === 0 && (
          <div className="text-center py-12">
            <FaUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('organization.athletes.noAthletes', 'No athletes found')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filterStatus !== 'all' || filterSchool !== 'all'
                ? t('organization.athletes.noAthletesFiltered', 'No athletes match your current filters')
                : t('organization.athletes.noAthletesYet', 'You haven\'t registered any athletes yet')
              }
            </p>
            {!searchTerm && filterStatus === 'all' && filterSchool === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 bg-athletiq-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FaPlus className="h-4 w-4" />
                <span>{t('organization.athletes.addFirstAthlete', 'Add Your First Athlete')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Athlete Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
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
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {showAddModal 
                      ? t('organization.athletes.modal.addTitle', 'Add New Athlete')
                      : t('organization.athletes.modal.editTitle', 'Edit Athlete')
                    }
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setCurrentAthlete(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={showAddModal ? handleAddAthlete : handleEditAthlete} className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.fullName', 'Full Name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={athleteForm.full_name}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.email', 'Email')}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={athleteForm.email}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.dateOfBirth', 'Date of Birth')}
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={athleteForm.date_of_birth}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.gender', 'Gender')}
                      </label>
                      <select
                        name="gender"
                        value={athleteForm.gender}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">{t('common.select', 'Select')}</option>
                        <option value="male">{t('common.male', 'Male')}</option>
                        <option value="female">{t('common.female', 'Female')}</option>
                        <option value="other">{t('common.other', 'Other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.phone', 'Phone')}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={athleteForm.phone}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* School and Sport Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.school', 'School')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="school_id"
                        value={athleteForm.school_id}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">{t('organization.athletes.form.selectSchool', 'Select School')}</option>
                        {data?.schools?.map(school => (
                          <option key={school.id} value={school.id}>{school.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('organization.athletes.form.schoolRequired', 'All athletes must be associated with a school')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.sport', 'Primary Sport')}
                      </label>
                      <input
                        type="text"
                        name="sport"
                        value={athleteForm.sport}
                        onChange={handleFormChange}
                        placeholder={t('organization.athletes.form.sportPlaceholder', 'e.g., Football, Basketball')}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.athletes.form.gradeLevel', 'Grade Level')}
                    </label>
                    <input
                      type="text"
                      name="grade_level"
                      value={athleteForm.grade_level}
                      onChange={handleFormChange}
                      placeholder={t('organization.athletes.form.gradePlaceholder', 'e.g., Grade 10, Year 11')}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.emergencyContactName', 'Emergency Contact Name')}
                      </label>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={athleteForm.emergency_contact_name}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('organization.athletes.form.emergencyContactPhone', 'Emergency Contact Phone')}
                      </label>
                      <input
                        type="tel"
                        name="emergency_contact_phone"
                        value={athleteForm.emergency_contact_phone}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.athletes.form.medicalConditions', 'Medical Conditions')}
                    </label>
                    <textarea
                      name="medical_conditions"
                      value={athleteForm.medical_conditions}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder={t('organization.athletes.form.medicalPlaceholder', 'Any medical conditions or allergies...')}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.athletes.form.notes', 'Additional Notes')}
                    </label>
                    <textarea
                      name="notes"
                      value={athleteForm.notes}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder={t('organization.athletes.form.notesPlaceholder', 'Any additional information...')}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-athletiq-orange focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setCurrentAthlete(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-athletiq-orange text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{t('common.saving', 'Saving...')}</span>
                        </span>
                      ) : (
                        showAddModal ? t('organization.athletes.form.addAthlete', 'Add Athlete') : t('organization.athletes.form.updateAthlete', 'Update Athlete')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}