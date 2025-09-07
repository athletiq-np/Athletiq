import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCheck, FaTimes,
  FaExclamationTriangle, FaDownload, FaUpload, FaGlobe, FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { organizationAPI } from '@/api/organizationApi';
import AddOrganizationButton from './AddOrganizationButton';

const OrganizationsTab = ({ refetchData }) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await organizationAPI.admin.getAllOrganizations();
      
      if (response.success) {
        // Handle different response formats
        let organizationsData = [];
        
        console.log('Raw response.data:', response.data);
        console.log('Is array?', Array.isArray(response.data));
        console.log('First element:', response.data[0]);
        console.log('Has organizations property?', response.data[0]?.organizations);
        
        if (Array.isArray(response.data)) {
          // Check if it's an array containing an object with organizations
          if (response.data.length > 0 && response.data[0]?.organizations) {
            console.log('Extracting from nested structure');
            organizationsData = response.data[0].organizations;
          } else {
            console.log('Using array directly');
            organizationsData = response.data;
          }
        } else if (response.data?.organizations) {
          // Backend returns { organizations: [...] }
          console.log('Using organizations property');
          organizationsData = response.data.organizations;
        } else if (response.data?.results) {
          organizationsData = response.data.results;
        } else if (response.data?.data) {
          // Handle nested data wrapper from formatSuccessResponse
          if (response.data.data.organizations) {
            organizationsData = response.data.data.organizations;
          } else {
            organizationsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          }
        }
        
        console.log('Final organizationsData:', organizationsData);
        setOrganizations(organizationsData);
        console.log('✅ Organizations loaded:', organizationsData);
        console.log('✅ Organizations state set to:', organizationsData.length, 'items');
        console.log('✅ First organization:', organizationsData[0]);
      } else {
        throw new Error(response.error || 'Failed to fetch organizations');
      }
    } catch (err) {
      console.error('❌ Error fetching organizations:', err);
      setError(err.message || 'Failed to load organizations');
      
      // Fallback to empty array on error
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Search organizations using API
  const handleSearch = async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (query.trim()) {
        // Use search API endpoint
        response = await organizationAPI.admin.searchOrganizations(query);
      } else {
        // Get all organizations if search is empty
        response = await organizationAPI.admin.getAllOrganizations();
      }
      
      if (response.success) {
        let organizationsData = [];
        if (Array.isArray(response.data)) {
          // Check if it's an array containing an object with organizations
          if (response.data.length > 0 && response.data[0]?.organizations) {
            organizationsData = response.data[0].organizations;
          } else {
            organizationsData = response.data;
          }
        } else if (response.data?.organizations) {
          // Backend returns { organizations: [...] }
          organizationsData = response.data.organizations;
        } else if (response.data?.results) {
          organizationsData = response.data.results;
        } else if (response.data?.data) {
          // Handle nested data wrapper from formatSuccessResponse
          if (response.data.data.organizations) {
            organizationsData = response.data.data.organizations;
          } else {
            organizationsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          }
        }
        
        setOrganizations(organizationsData);
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort organizations
  console.log('🔍 Filtering organizations - total count:', organizations.length);
  console.log('🔍 Organizations array:', organizations);
  const filteredOrganizations = organizations
    .filter(org => {
      // More defensive filtering to handle missing data
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (org.name && org.name.toLowerCase().includes(searchLower)) ||
        (org.email && org.email.toLowerCase().includes(searchLower)) ||
        (org.registration_number && org.registration_number.toLowerCase().includes(searchLower));
      
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

  // Debug logging to help identify the issue
  console.log('Organizations debug:', {
    totalOrganizations: organizations.length,
    filteredOrganizations: filteredOrganizations.length,
    searchTerm,
    filterStatus,
    filterType,
    organizationsData: organizations,
    filteredData: filteredOrganizations
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
      const response = await organizationAPI.admin.deleteOrganization(organizationId);
      
      if (response.success) {
        toast.success('Organization deleted successfully!');
        // Refresh the list
        await fetchOrganizations();
        // Also trigger parent refetch if available
        if (refetchData) refetchData();
      } else {
        throw new Error(response.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(error.message || 'Failed to delete organization');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedOrganizations.length === 0) return;

    setActionLoading(true);
    try {
      let response;
      
      switch (action) {
        case 'verify':
          response = await organizationAPI.admin.bulkUpdateStatus(selectedOrganizations, 'verified');
          if (response.success) {
            toast.success('Organizations verified successfully!');
          } else {
            throw new Error(response.error || 'Failed to verify organizations');
          }
          break;
          
        case 'suspend':
          response = await organizationAPI.admin.bulkUpdateStatus(selectedOrganizations, 'suspended');
          if (response.success) {
            toast.success('Organizations suspended successfully!');
          } else {
            throw new Error(response.error || 'Failed to suspend organizations');
          }
          break;
          
        case 'delete':
          if (!window.confirm('Are you sure you want to delete the selected organizations? This action cannot be undone.')) return;
          
          // Delete organizations one by one since we don't have a bulk delete endpoint
          const deletePromises = selectedOrganizations.map(id => 
            organizationAPI.admin.deleteOrganization(id)
          );
          
          const results = await Promise.allSettled(deletePromises);
          const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
          const failCount = results.length - successCount;
          
          if (successCount > 0) {
            toast.success(`${successCount} organization(s) deleted successfully!`);
          }
          if (failCount > 0) {
            toast.error(`Failed to delete ${failCount} organization(s)`);
          }
          break;
          
        default:
          throw new Error('Unknown action');
      }
      
      setSelectedOrganizations([]);
      // Refresh the list
      await fetchOrganizations();
      // Also trigger parent refetch if available
      if (refetchData) refetchData();
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(error.message || 'Failed to perform bulk action');
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
    <>
      <div className="space-y-8">
        {/* Enhanced Header with Search and Actions */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl"></div>

          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <FaBuilding className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations Management</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and monitor all registered organizations</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/20 dark:border-gray-700/30">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {organizations.length}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                      {organizations.length === 1 ? 'Organization' : 'Organizations'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <AddOrganizationButton onSuccess={() => {
                  fetchOrganizations();
                  if (refetchData) refetchData();
                }} />

                {selectedOrganizations.length > 0 && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBulkAction('verify')}
                      disabled={actionLoading}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:opacity-50"
                    >
                      {actionLoading ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : <FaCheck className="mr-2 h-4 w-4" />}
                      Verify ({selectedOrganizations.length})
                    </motion.button>
                    
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBulkAction('delete')}
                      disabled={actionLoading}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:opacity-50"
                    >
                      {actionLoading ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : <FaTrash className="mr-2 h-4 w-4" />}
                      Delete ({selectedOrganizations.length})
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Advanced Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search organizations by name, email, or registration number..."
                    className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="all">All Types</option>
                  <option value="sports_club">Sports Club</option>
                  <option value="academy">Academy</option>
                  <option value="federation">Federation</option>
                  <option value="association">Association</option>
                  <option value="training_center">Training Center</option>
                </select>
              </div>

              {/* Sort Controls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                  <option value="status">Status</option>
                  <option value="created_at">Date Created</option>
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Showing {filteredOrganizations.length} of {organizations.length} organizations
              </span>
              {(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterType('all');
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Organizations Table */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="w-12 px-3 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrganizations.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="w-1/4 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('name')}>
                    Organization
                  </th>
                  <th className="w-1/6 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('type')}>
                    Type
                  </th>
                  <th className="w-1/8 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('status')}>
                    Status
                  </th>
                  <th className="w-1/6 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="w-1/6 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="w-32 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16">
                      <div className="text-center">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6">
                          <FaBuilding className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {organizations.length === 0 ? 'No organizations found' : 'No organizations match your filters'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          {organizations.length === 0 
                            ? 'Add a new organization to get started.' 
                            : 'Try adjusting your search criteria or filters.'}
                        </p>
                        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                          {organizations.length > 0 ? (
                            <>
                              <p>• Check your search terms</p>
                              <p>• Clear all filters to see all organizations</p>
                              <p>• Total organizations available: {organizations.length}</p>
                            </>
                          ) : (
                            <>
                              <p>• Click "Add Organization" to create your first organization</p>
                              <p>• Import organizations from a CSV file</p>
                            </>
                          )}
                        </div>
                        {organizations.length === 0 && (
                          <div className="mt-6">
                            <AddOrganizationButton onSuccess={() => {
                              fetchOrganizations();
                              if (refetchData) refetchData();
                            }} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((organization, index) => (
                    <motion.tr
                      key={organization.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                    >
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrganizations.includes(organization.id)}
                          onChange={() => handleSelectOrganization(organization.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                              <FaBuilding className="text-white text-sm" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {organization.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              Reg: {organization.registration_number || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {getTypeBadge(organization.type)}
                      </td>
                      <td className="px-3 py-4">
                        {getStatusBadge(organization.status)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {organization.email && (
                            <div className="flex items-center gap-1 mb-1">
                              <FaEnvelope className="w-3 h-3 text-gray-400" />
                              <span className="truncate">{organization.email}</span>
                            </div>
                          )}
                          {organization.phone && (
                            <div className="flex items-center gap-1">
                              <FaPhone className="w-3 h-3 text-gray-400" />
                              <span>{organization.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {(organization.city || organization.province) && (
                            <div className="flex items-center gap-1">
                              <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                              <span className="truncate">
                                {[organization.city, organization.province].filter(Boolean).join(', ') || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center space-x-1">
                          {/* View Details Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(organization)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                            title="View Details"
                          >
                            <FaEye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>

                          {/* Edit Organization Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(organization)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 group"
                            title="Edit Organization"
                          >
                            <FaEdit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>

                          {/* Delete Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(organization.id)}
                            disabled={actionLoading}
                            className={`p-2 rounded-lg transition-all duration-200 group ${actionLoading
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                              }`}
                            title="Delete Organization"
                          >
                            {actionLoading ? (
                              <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FaTrash className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationsTab;