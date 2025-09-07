import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaSearch, FaEye, FaEdit, FaTrash, FaUserShield, FaDownload, FaSpinner, FaPlus, FaSort,
  FaCheck, FaPhone, FaEnvelope, FaBaby
} from 'react-icons/fa';

import { toast } from 'react-toastify';
// Import DataExportModal from the DataExportUtility module
import DataExportModal from '@/components/features/admin/DataExportUtility';

function GuardiansTabComponent({
  guardians = [],
  schools = [],
  user,
  refetchData,
  loading = false,
  error = null
}) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [sortBy, setSortBy] = useState("full_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedGuardians, setSelectedGuardians] = useState([]);
  const [viewGuardian, setViewGuardian] = useState(null);
  const [editingGuardianId, setEditingGuardianId] = useState(null);
  const [documentReviewGuardian, setDocumentReviewGuardian] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [filteredGuardians, setFilteredGuardians] = useState([]);

  // Filter and sort guardians
  useEffect(() => {
    let filtered = [...guardians];

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(guardian =>
        guardian.full_name?.toLowerCase().includes(searchLower) ||
        guardian.email?.toLowerCase().includes(searchLower) ||
        guardian.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(guardian => {
        if (statusFilter === 'active') return guardian.is_active;
        if (statusFilter === 'inactive') return !guardian.is_active;
        return true;
      });
    }

    // Apply verification filter
    if (verificationFilter) {
      filtered = filtered.filter(guardian => 
        guardian.verification_status === verificationFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredGuardians(filtered);
  }, [guardians, searchText, statusFilter, verificationFilter, sortBy, sortOrder]);

  // Handle guardian selection
  const handleGuardianSelect = useCallback((guardianId, checked) => {
    setSelectedGuardians(prev =>
      checked
        ? [...prev, guardianId]
        : prev.filter(id => id !== guardianId)
    );
  }, []);

  const handleSelectAll = useCallback((checked) => {
    setSelectedGuardians(checked ? filteredGuardians.map(g => g.id) : []);
  }, [filteredGuardians]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin h-8 w-8 text-purple-500" />
        <span className="ml-3 text-gray-600">Loading guardians...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading guardians</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Search and Actions */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl"></div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                  <FaUserShield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Guardian Management</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and monitor all registered guardians</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/20 dark:border-gray-700/30">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {guardians.length}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                    {guardians.length === 1 ? 'Guardian' : 'Guardians'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg"
              >
                <FaDownload className="w-4 h-4" />
                Export
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaPlus className="w-4 h-4" />
                Add Guardian
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search guardians..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 dark:text-white"
          >
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Sort Options */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 dark:text-white text-sm"
            >
              <option value="full_name">Name</option>
              <option value="email">Email</option>
              <option value="created_at">Date</option>
              <option value="verification_status">Status</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <FaSort className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-center px-4 py-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {filteredGuardians.length} of {guardians.length}
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedGuardians.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                {selectedGuardians.length} guardians selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
              >
                Verify Selected
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
              >
                Export Selected
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
              >
                Delete Selected
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30">
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedGuardians.length === filteredGuardians.length && filteredGuardians.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Guardian</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Children</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Verification</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {filteredGuardians.length > 0 ? (
                filteredGuardians.map((guardian, index) => (
                  <motion.tr
                    key={guardian.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedGuardians.includes(guardian.id)}
                        onChange={(e) => handleGuardianSelect(guardian.id, e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                            <FaUserShield className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {guardian.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {guardian.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FaEnvelope className="w-3 h-3 text-gray-400" />
                          {guardian.email}
                        </div>
                        {guardian.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <FaPhone className="w-3 h-3 text-gray-400" />
                            {guardian.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <FaBaby className="w-3 h-3 text-gray-400" />
                        {guardian.children?.length || 0} children
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        guardian.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {guardian.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        guardian.verification_status === 'verified'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : guardian.verification_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {guardian.verification_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setViewGuardian(guardian)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 group"
                          title="View Guardian"
                        >
                          <FaEye className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingGuardianId(guardian.id)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200 group"
                          title="Edit Guardian"
                        >
                          <FaEdit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 group"
                          title="Delete Guardian"
                        >
                          <FaTrash className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16">
                    <div className="text-center">
                      <FaUserShield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No guardians found</h3>
                      <p className="mt-1 text-sm text-gray-500">No guardians match your current search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isExportModalOpen && (
        <DataExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={selectedGuardians.length > 0 ? 
            filteredGuardians.filter(g => selectedGuardians.includes(g.id)) : 
            filteredGuardians
          }
          filename="guardians"
          title="Export Guardians"
        />
      )}
    </div>
  );
}

// Export the memoized component directly
// Export component directly
export default GuardiansTabComponent;