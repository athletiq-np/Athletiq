import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserShield, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheck, FaTimes,
  FaExclamationTriangle, FaDownload, FaUpload, FaUsers, FaBaby
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/utils/apiClient';
import AddGuardianButton from './AddGuardianButton';

const GuardiansTab = ({ guardians = [], refetchData, loading = false, error = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');
  const [sortBy, setSortBy] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedGuardians, setSelectedGuardians] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter and sort guardians
  const filteredGuardians = guardians
    .filter(guardian => {
      const matchesSearch = guardian.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guardian.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guardian.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || guardian.is_active === (filterStatus === 'active');
      const matchesVerification = filterVerification === 'all' || 
                                 guardian.verification_status === filterVerification;
      return matchesSearch && matchesStatus && matchesVerification;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectGuardian = (guardianId) => {
    setSelectedGuardians(prev => 
      prev.includes(guardianId) 
        ? prev.filter(id => id !== guardianId)
        : [...prev, guardianId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGuardians.length === filteredGuardians.length) {
      setSelectedGuardians([]);
    } else {
      setSelectedGuardians(filteredGuardians.map(guardian => guardian.guardian_id || guardian.id));
    }
  };

  const handleEdit = (guardian) => {
    setSelectedGuardian(guardian);
    setShowEditModal(true);
  };

  const handleDelete = async (guardianId) => {
    if (!window.confirm('Are you sure you want to delete this guardian? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      await apiClient.delete(`/guardians/${guardianId}/`);
      toast.success('Guardian deleted successfully!');
      refetchData();
    } catch (error) {
      console.error('Error deleting guardian:', error);
      toast.error('Failed to delete guardian');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedGuardians.length === 0) return;

    setActionLoading(true);
    try {
      switch (action) {
        case 'verify':
          await Promise.all(
            selectedGuardians.map(id => 
              apiClient.patch(`/guardians/${id}/`, { verification_status: 'verified' })
            )
          );
          toast.success('Guardians verified successfully!');
          break;
        case 'suspend':
          await Promise.all(
            selectedGuardians.map(id => 
              apiClient.patch(`/guardians/${id}/`, { is_active: false })
            )
          );
          toast.success('Guardians suspended successfully!');
          break;
        case 'activate':
          await Promise.all(
            selectedGuardians.map(id => 
              apiClient.patch(`/guardians/${id}/`, { is_active: true })
            )
          );
          toast.success('Guardians activated successfully!');
          break;
        case 'delete':
          if (!window.confirm('Are you sure you want to delete the selected guardians? This action cannot be undone.')) return;
          await Promise.all(
            selectedGuardians.map(id => 
              apiClient.delete(`/guardians/${id}/`)
            )
          );
          toast.success('Guardians deleted successfully!');
          break;
      }
      setSelectedGuardians([]);
      refetchData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setActionLoading(false);
    }
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      verified: { color: 'green', icon: FaCheck, text: 'Verified' },
      pending: { color: 'yellow', icon: FaExclamationTriangle, text: 'Pending' },
      rejected: { color: 'red', icon: FaTimes, text: 'Rejected' },
      incomplete: { color: 'gray', icon: FaExclamationTriangle, text: 'Incomplete' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900 dark:text-${config.color}-200`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getActiveBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {isActive ? (
          <>
            <FaCheck className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <FaTimes className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-athletiq-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <FaExclamationTriangle className="mx-auto text-red-500 text-4xl mb-4" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Error Loading Guardians
        </h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Guardians Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredGuardians.length} guardians found
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search guardians..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
            >
              <option value="all">All Verifications</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <AddGuardianButton onSuccess={refetchData} />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedGuardians.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedGuardians.length} guardians selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('verify')}
                  disabled={actionLoading}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={actionLoading}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  disabled={actionLoading}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  Suspend
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={actionLoading}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guardians Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedGuardians.length === filteredGuardians.length && filteredGuardians.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('full_name')}
                >
                  Guardian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('verification_status')}
                >
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Athletes
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('created_at')}
                >
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGuardians.map((guardian) => (
                <tr key={guardian.guardian_id || guardian.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedGuardians.includes(guardian.guardian_id || guardian.id)}
                      onChange={() => handleSelectGuardian(guardian.guardian_id || guardian.id)}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {guardian.profile_picture ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={guardian.profile_picture}
                            alt={guardian.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-athletiq-green to-green-500 flex items-center justify-center">
                            <FaUserShield className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {guardian.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {guardian.occupation || 'No occupation listed'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1 mb-1">
                        <FaEnvelope className="w-3 h-3" />
                        {guardian.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaPhone className="w-3 h-3" />
                        {guardian.phone || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getVerificationBadge(guardian.verification_status)}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email: {guardian.email_verified ? '✓' : '✗'}
                      {guardian.phone && ` | Phone: ${guardian.phone_verified ? '✓' : '✗'}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getActiveBadge(guardian.is_active !== false)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <FaBaby className="w-4 h-4 mr-1" />
                      {guardian.athletes_count || 0} athletes
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(guardian.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(guardian)}
                        className="text-athletiq-green hover:text-athletiq-green-dark transition-colors"
                        title="Edit Guardian"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(guardian.guardian_id || guardian.id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Delete Guardian"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGuardians.length === 0 && (
          <div className="text-center py-12">
            <FaUserShield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Guardians Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Get started by adding your first guardian.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardiansTab;