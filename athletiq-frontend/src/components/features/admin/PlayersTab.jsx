import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUpload, FaDownload, FaSearch, FaEye, FaEdit, FaTrash, FaUserGraduate,
  FaSpinner, FaExclamationCircle, FaUserSlash, FaPlus, FaFilter, FaSort,
  FaCopy, FaUserCheck, FaUserTimes, FaFileAlt, FaHistory
} from 'react-icons/fa';

// Enhanced Components
import { TableLoading, StatsCardsLoading } from './LoadingStates';
import { InlineError, EmptyState } from './ErrorStates';
import { DataExportModal } from './DataExportUtility';

// Remove the test AddPlayerModal - we'll use AddPlayerButton instead

import EditPlayerModal from "@features/player/EditPlayerModal";
import ViewPlayerModal from "@features/player/ViewPlayerModal";
import { adminApi } from '@/api/adminApi';
import { toast } from 'react-toastify';
import BulkPlayerUploadModal from '@features/player/BulkPlayerUploadModal';
import AddPlayerButton from '@/components/AddPlayerButton';

function PlayersTabComponent({
  players = [],
  schools = [],
  user,
  refetchData,
  loading = false,
  error = null
}) {


  // Handle successful player addition
  const handlePlayerAdded = useCallback((playerData) => {
    toast.success('Player added successfully!');
    if (refetchData) {
      refetchData();
    }
  }, [refetchData]);

  // Memoize modal callbacks to prevent re-renders
  const handleCloseEditModal = useCallback(() => setEditPlayer(null), []);
  const handleCloseViewModal = useCallback(() => setViewPlayer(null), []);
  const handlePlayerUpdated = useCallback(() => {
    if (refetchData) refetchData();
  }, [refetchData]);


  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deletingPlayerId, setDeletingPlayerId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Modal state (removed test modal states)
  const [bulkPlayerOpen, setBulkPlayerOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);





  // Filter and sort players
  useEffect(() => {
    let filtered = [...players];

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(player =>
        (player.full_name || player.name || '').toLowerCase().includes(searchLower) ||
        (player.school_name || '').toLowerCase().includes(searchLower) ||
        (player.school_code || '').toLowerCase().includes(searchLower) ||
        (player.athlete_id || player.id || '').toString().toLowerCase().includes(searchLower)
      );
    }

    // Filter by school (for super admin)
    if (selectedSchoolId) {
      filtered = filtered.filter(player =>
        player.school_id === selectedSchoolId ||
        player.school?.id === selectedSchoolId
      );
    }

    // Filter by status
    if (statusFilter) {
      if (statusFilter === 'active') {
        filtered = filtered.filter(player => player.is_active === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(player => player.is_active === false);
      } else if (statusFilter === 'verified') {
        filtered = filtered.filter(player => player.verification_status === 'verified');
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(player => player.verification_status !== 'verified');
      }
    }

    // Sort players
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = (a.full_name || a.name || '').toLowerCase();
          bValue = (b.full_name || b.name || '').toLowerCase();
          break;
        case 'school':
          aValue = (a.school_name || a.school?.name || '').toLowerCase();
          bValue = (b.school_name || b.school?.name || '').toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'grade':
          aValue = a.grade || '';
          bValue = b.grade || '';
          break;
        default:
          aValue = (a.full_name || a.name || '').toLowerCase();
          bValue = (b.full_name || b.name || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPlayers(filtered);
  }, [players, searchText, selectedSchoolId, statusFilter, sortBy, sortOrder]);

  const handleSelectAllPlayers = () => {
    if (selectedPlayerIds.length === filteredPlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(filteredPlayers.map(p => p.id));
    }
  };

  const togglePlayerSelection = (playerId) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
  };

  const handleDeletePlayer = async (playerId, playerName) => {
    setShowDeleteConfirm({ id: playerId, name: playerName });
  };

  const confirmDeletePlayer = async () => {
    if (!showDeleteConfirm) return;

    const { id: playerId } = showDeleteConfirm;
    setDeletingPlayerId(playerId);
    setShowDeleteConfirm(null);

    try {
      console.log('Before delete - Players count:', players.length);
      console.log('Deleting player ID:', playerId);
      
      await adminApi.deleteAthlete(playerId);
      console.log('Player deleted successfully:', playerId);
      toast.success('Player deleted successfully!');
      
      console.log('Calling refetchData...');
      if (refetchData) {
        await refetchData();
        console.log('RefetchData completed');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player. Please try again.');
    } finally {
      setDeletingPlayerId(null);
    }
  };

  const cancelDeletePlayer = () => {
    setShowDeleteConfirm(null);
  };

  const handleCopyPlayerId = (playerId) => {
    navigator.clipboard.writeText(playerId);
    toast.success('Player ID copied to clipboard!');
  };

  const handleTogglePlayerStatus = async (playerId, currentStatus) => {
    try {
      console.log('Toggling player status:', { playerId, currentStatus });

      // Determine current status more accurately
      const player = players.find(p => p.id === playerId);
      const isCurrentlyActive = player?.is_active === true;
      const newStatus = isCurrentlyActive ? 'inactive' : 'active';

      console.log('Status change:', { isCurrentlyActive, newStatus });

      await adminApi.updateAthleteStatus(playerId, newStatus);
      toast.success(`Player ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      if (refetchData) refetchData();
    } catch (error) {
      console.error('Error updating player status:', error);
      toast.error(`Failed to ${currentStatus === 'active' ? 'deactivate' : 'activate'} player: ${error.message}`);
    }
  };

  const handleViewPlayerHistory = (player) => {
    // This would open a modal or navigate to player history
    console.log('View player history:', player);
    toast.info('Player history feature coming soon!');
  };

  const handleGenerateReport = (player) => {
    // This would generate a player report
    console.log('Generate report for player:', player);
    toast.info('Player report generation coming soon!');
  };

  // Export file download function
  const downloadExportFile = async (data, config) => {
    const { format, fileName, includeHeader } = config;

    try {
      if (format === 'csv') {
        // Generate CSV
        const headers = config.selectedColumns;
        const csvRows = [];

        if (includeHeader) {
          csvRows.push(headers.join(','));
        }

        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          });
          csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } else if (format === 'json') {
        // Generate JSON
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } else {
        // For Excel and PDF, we'd need additional libraries
        toast.info(`${format.toUpperCase()} export coming soon! Please use CSV for now.`);
      }
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleBulkDeletePlayers = async () => {
    if (selectedPlayerIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedPlayerIds.length} players?`)) {
      try {
        const result = await adminApi.bulkDeleteAthletes(selectedPlayerIds);
        console.log('Bulk delete result:', result);
        setSelectedPlayerIds([]);
        if (refetchData) refetchData();
        toast.success(`Successfully deleted ${result.data?.deleted_count || selectedPlayerIds.length} players`);
      } catch (error) {
        console.error('Error bulk deleting players:', error);
        toast.error('Failed to delete players. Please try again.');
      }
    }
  };

  // Show loading state
  if (loading) {
    return <TableLoading message="Loading players..." rows={10} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Failed to load players. {error.message || 'Please try again later.'}
              <button
                onClick={refetchData}
                className="ml-2 text-sm font-medium text-red-700 underline hover:text-red-600"
              >
                Retry
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <FaUserSlash className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No players found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new player or importing in bulk.
        </p>
        <div className="mt-6 space-x-3">
          <AddPlayerButton
            onPlayerAdded={handlePlayerAdded}
            schools={schools}
            user={user}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-athletiq-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="-ml-1 mr-2 h-5 w-5" />
            Add Player
          </AddPlayerButton>
          <button
            type="button"
            onClick={() => setBulkPlayerOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-athletiq-blue"
          >
            <FaUpload className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Bulk Import
          </button>
        </div>
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
                    <FaUserGraduate className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Players Management</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and monitor all registered players</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/20 dark:border-gray-700/30">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {players.length}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                      {players.length === 1 ? 'Player' : 'Players'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <AddPlayerButton
                  onPlayerAdded={handlePlayerAdded}
                  schools={schools}
                  user={user}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20"
                >
                  <FaPlus className="mr-2 h-4 w-4" />
                  Add Player
                </AddPlayerButton>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setBulkPlayerOpen(true)}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                >
                  <FaUpload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:from-indigo-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                >
                  <FaDownload className="mr-2 h-4 w-4" />
                  Export Data
                </motion.button>

                {selectedPlayerIds.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBulkDeletePlayers}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-red-500/20"
                  >
                    <FaTrash className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedPlayerIds.length})
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show error state */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 w-full mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Failed to load players. {error.message || 'Please try again later.'}
                </p>
              </div>
            </div>
          </div>
        )}

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
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search players by name, school, or ID..."
                    className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* School Filter */}
              {user?.role === "super_admin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    School
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Schools</option>
                    {schools.map(school => (
                      <option key={school.school_id || school.id} value={school.school_id || school.id}>
                        {school.name} ({school.school_code || school.school_id || school.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              {/* Sort By */}
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
                  <option value="school">School</option>
                  <option value="grade">Grade</option>
                  <option value="created">Date Added</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order
                </label>
                <div className="flex">
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-xl border transition-all duration-200 ${sortOrder === 'asc'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                  >
                    <FaSort className="inline w-3 h-3 mr-1" />
                    Asc
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-xl border-l-0 border transition-all duration-200 ${sortOrder === 'desc'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                  >
                    <FaSort className="inline w-3 h-3 mr-1 rotate-180" />
                    Desc
                  </button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Showing {filteredPlayers.length} of {players.length} players
              </span>
              {(searchText || selectedSchoolId || statusFilter) && (
                <button
                  onClick={() => {
                    setSearchText('');
                    setSelectedSchoolId('');
                    setStatusFilter('');
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Players Table */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-hidden">
            <table className="w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="w-12 px-3 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPlayerIds.length === filteredPlayers.length && filteredPlayers.length > 0}
                      onChange={handleSelectAllPlayers}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="w-1/4 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="w-1/6 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    School
                  </th>
                  <th className="w-1/8 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Age/DOB
                  </th>
                  <th className="w-1/8 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="w-1/6 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Guardian
                  </th>
                  <th className="w-1/8 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-32 px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16">
                      <div className="text-center">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6">
                          <FaUserGraduate className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No players found</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search criteria or add a new player to get started.</p>
                        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                          <p>• Check your search terms</p>
                          <p>• Try selecting a different school</p>
                          <p>• Clear all filters to see all players</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player, index) => (
                    <motion.tr
                      key={player.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                    >
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPlayerIds.includes(player.id)}
                          onChange={() => togglePlayerSelection(player.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            {player.profile_photo_url ? (
                              <img
                                src={`/uploads/${player.profile_photo_url}`}
                                alt="Profile"
                                className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg group-hover:scale-110 transition-transform duration-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                                <FaUserGraduate className="text-white text-sm" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {player.full_name || player.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              ID: {player.athlete_id || player.id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {player.school?.name || player.school_name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          ID: {player.school?.id || player.school?.school_id || player.school_id || 'N/A'} • {player.school?.school_code || player.school_code || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {calculateAge(player.date_of_birth) ? `${calculateAge(player.date_of_birth)}y` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {player.grade ? `G${player.grade}` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {player.section || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {player.guardian_name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {player.guardian_phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {player.is_active === true ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Active
                              </span>
                            ) : player.is_active === false ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                Inactive
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                Pending
                              </span>
                            )}
                          </div>
                          {player.verification_status && (
                            <div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${player.verification_status === 'verified' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                                player.verification_status === 'rejected' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' :
                                  'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                }`}>
                                {player.verification_status === 'verified' ? '✓ Verified' :
                                  player.verification_status === 'rejected' ? '✗ Rejected' :
                                    player.verification_status === 'requires_review' ? '⏳ Review' : '⏳ Pending'}
                              </span>
                            </div>
                          )}
                          {player.profile_completion && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${player.profile_completion}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium">{player.profile_completion}%</span>
                              </div>
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
                            onClick={() => setViewPlayer(player)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                            title="View Details"
                          >
                            <FaEye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>

                          {/* Edit Player Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditPlayer(player)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 group"
                            title="Edit Player"
                          >
                            <FaEdit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>

                          {/* Copy ID Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCopyPlayerId(player.athlete_id || player.id)}
                            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-all duration-200 group"
                            title="Copy ID"
                          >
                            <FaCopy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                          </motion.button>

                          {/* Toggle Status Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleTogglePlayerStatus(player.id, player.is_active || player.registration_status === 'active' ? 'active' : 'inactive')}
                            className={`p-2 rounded-lg transition-all duration-200 group ${player.is_active || player.status === 'active'
                              ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                            title={player.is_active || player.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {player.is_active || player.status === 'active' ? (
                              <FaUserTimes className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                            ) : (
                              <FaUserCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </motion.button>

                          {/* Delete Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeletePlayer(player.id, player.full_name || player.name)}
                            disabled={deletingPlayerId === player.id}
                            className={`p-2 rounded-lg transition-all duration-200 group ${deletingPlayerId === player.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                              }`}
                            title="Delete Player"
                          >
                            {deletingPlayerId === player.id ? (
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

      <BulkPlayerUploadModal
        isOpen={bulkPlayerOpen}
        onClose={() => setBulkPlayerOpen(false)}
        onSubmit={async (athletesData) => {
          try {
            const result = await adminApi.bulkUploadAthletes(athletesData);
            console.log('Bulk create result:', result);

            const successCount = result.data?.success_count || 0;
            const errorCount = result.data?.error_count || 0;

            if (successCount > 0) {
              toast.success(`Successfully created ${successCount} athletes`);
            }
            if (errorCount > 0) {
              toast.warning(`${errorCount} athletes had errors`);
            }

            return result.data || result;
          } catch (error) {
            console.error('Bulk create error:', error);
            throw error;
          }
        }}
        onUploaded={refetchData}
        schools={schools}
      />

      {editPlayer && (
        <EditPlayerModal
          key={editPlayer.id}
          isOpen={true}
          player={editPlayer}
          onClose={handleCloseEditModal}
          onUpdated={handlePlayerUpdated}
          schools={schools}
        />
      )}

      {viewPlayer && (
        <ViewPlayerModal
          key={viewPlayer.id}
          isOpen={true}
          player={viewPlayer}
          onClose={handleCloseViewModal}
          schools={schools}
        />
      )}

      {/* Data Export Modal */}
      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={filteredPlayers}
        dataType="players"
        onExport={async (exportConfig) => {
          try {
            // Prepare export data based on selected columns
            const exportData = filteredPlayers.map(player => {
              const row = {};
              exportConfig.selectedColumns.forEach(column => {
                switch (column) {
                  case 'name':
                    row[column] = player.full_name || player.name || '';
                    break;
                  case 'school':
                    row[column] = player.school_name || player.school?.name || '';
                    break;
                  case 'school_code':
                    row[column] = player.school_code || player.school?.school_code || '';
                    break;
                  case 'athlete_id':
                    row[column] = player.athlete_id || player.id || '';
                    break;
                  case 'gender':
                    row[column] = player.gender || '';
                    break;
                  case 'date_of_birth':
                    row[column] = player.date_of_birth || '';
                    break;
                  case 'grade':
                    row[column] = player.grade || '';
                    break;
                  case 'guardian_name':
                    row[column] = player.guardian_name || '';
                    break;
                  case 'guardian_phone':
                    row[column] = player.guardian_phone || '';
                    break;
                  case 'primary_sport':
                    row[column] = player.primary_sport || '';
                    break;
                  case 'verification_status':
                    row[column] = player.verification_status || '';
                    break;
                  case 'created_at':
                    row[column] = player.created_at || '';
                    break;
                  case 'profile_completion':
                    row[column] = player.profile_completion || '';
                    break;
                  default:
                    row[column] = player[column] || '';
                }
              });
              return row;
            });

            // Generate and download the file
            await downloadExportFile(exportData, exportConfig);

            return { success: true, count: exportData.length };
          } catch (error) {
            console.error('Export error:', error);
            throw error;
          }
        }}
        availableColumns={[
          { key: 'name', label: 'Player Name' },
          { key: 'athlete_id', label: 'Athlete ID' },
          { key: 'school', label: 'School Name' },
          { key: 'school_code', label: 'School Code' },
          { key: 'gender', label: 'Gender' },
          { key: 'date_of_birth', label: 'Date of Birth' },
          { key: 'grade', label: 'Grade' },
          { key: 'guardian_name', label: 'Guardian Name' },
          { key: 'guardian_phone', label: 'Guardian Phone' },
          { key: 'primary_sport', label: 'Primary Sport' },
          { key: 'verification_status', label: 'Verification Status' },
          { key: 'created_at', label: 'Registration Date' },
          { key: 'profile_completion', label: 'Profile Completion %' }
        ]}
      />

      {/* Enhanced Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelDeletePlayer}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mr-4">
                  <FaTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Player
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">
                    {showDeleteConfirm.name}
                  </span>? This will permanently remove all player data including:
                </p>
                <ul className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Personal information</li>
                  <li>• Sports registration data</li>
                  <li>• Tournament history</li>
                  <li>• All associated documents</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={cancelDeletePlayer}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlayer}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  {deletingPlayerId === showDeleteConfirm.id ? (
                    <>
                      <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="w-4 h-4 mr-2" />
                      Delete Player
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PlayersTabComponent;
