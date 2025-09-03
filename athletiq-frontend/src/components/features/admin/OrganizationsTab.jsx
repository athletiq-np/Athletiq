import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheck, FaTimes,
  FaExclamationTriangle, FaDownload, FaUpload, FaGlobe
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/utils/apiClient';
import AddOrganizationButton from './AddOrganizationButton';

const OrganizationsTab = ({ organizations = [], refetchData, loading = false, error = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter and sort organizations
  const filteredOrganizations = organizations
    .filter(org => {
      const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || org.status === filterStatus;
      const matchesType = filterType === 'all' || org.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
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

  const handleSelectOrganization = (orgId) => {
    setSelectedOrganizations(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrganizations.length === filteredOrganizations.length) {
      setSelectedOrganizations([]);
    } else {
      setSelectedOrganizations(filteredOrganizations.map(org => org.id));
    }
  };

  const handleEdit = (organization) => {
    setSelectedOrganization(organization);
    setShowEditModal(true);
  };

  const handleDelete = async (organizationId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      await apiClient.delete(`/organizations/${organizationId}/`);
      toast.success('Organization deleted successfully!');
      refetchData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedOrganizations.length === 0) return;

    setActionLoading(true);
    try {
      switch (action) {
        case 'verify':
          await Promise.all(
            selectedOrganizations.map(id => 
              apiClient.patch(`/organizations/${id}/`, { status: 'verified' })
            )
          );
          toast.success('Organizations verified successfully!');
          break;
        case 'suspend':
          await Promise.all(
            selectedOrganizations.map(id => 
              apiClient.patch(`/organizations/${id}/`, { status: 'suspended' })
            )
          );
          toast.success('Organizations suspended successfully!');
          break;
        case 'delete':
          if (!window.confirm('Are you sure you want to delete the selected organizations? This action cannot be undone.')) return;
          await Promise.all(
            selectedOrganizations.map(id => 
              apiClient.delete(`/organizations/${id}/`)
            )
          );
          toast.success('Organizations deleted successfully!');
          break;
      }
      setSelectedOrganizations([]);
      refetchData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: 'green', icon: FaCheck, text: 'Verified' },
      pending: { color: 'yellow', icon: FaExclamationTriangle, text: 'Pending' },
      suspended: { color: 'red', icon: FaTimes, text: 'Suspended' },
      inactive: { color: 'gray', icon: FaTimes, text: 'Inactive' }
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

  const getTypeBadge = (type) => {
    const typeConfig = {
      sports_club: { color: 'blue', text: 'Sports Club' },
      academy: { color: 'purple', text: 'Academy' },
      federation: { color: 'indigo', text: 'Federation' },
      association: { color: 'pink', text: 'Association' },
      training_center: { color: 'green', text: 'Training Center' }
    };

    const config = typeConfig[type] || { color: 'gray', text: type };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900 dark:text-${config.color}-200`}>
        {config.text}
      </span>
    );
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
          Error Loading Organizations
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
              Organizations Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredOrganizations.length} organizations found
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations..."
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
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="sports_club">Sports Club</option>
              <option value="academy">Academy</option>
              <option value="federation">Federation</option>
              <option value="association">Association</option>
              <option value="training_center">Training Center</option>
            </select>

            <AddOrganizationButton onSuccess={refetchData} />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrganizations.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {selectedOrganizations.length} organizations selected
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

      {/* Organizations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrganizations.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('name')}
                >
                  Organization
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('type')}
                >
                  Type
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrganizations.map((organization) => (
                <tr key={organization.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrganizations.includes(organization.id)}
                      onChange={() => handleSelectOrganization(organization.id)}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-athletiq-green to-green-500 flex items-center justify-center">
                          <FaBuilding className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {organization.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {organization.registration_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getTypeBadge(organization.type)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(organization.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1 mb-1">
                        <FaEnvelope className="w-3 h-3" />
                        {organization.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaPhone className="w-3 h-3" />
                        {organization.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        {organization.city}, {organization.province}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(organization)}
                        className="text-athletiq-green hover:text-athletiq-green-dark transition-colors"
                        title="Edit Organization"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(organization.id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Delete Organization"
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

        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <FaBuilding className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Organizations Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Get started by adding your first organization.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationsTab;