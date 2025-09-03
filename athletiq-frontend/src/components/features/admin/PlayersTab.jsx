import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUpload, FaDownload, FaSearch, FaEye, FaEdit, FaTrash, FaUserGraduate,
  FaSpinner, FaExclamationCircle, FaUserSlash } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';

// Enhanced Components
import { TableLoading, StatsCardsLoading } from './LoadingStates';
import { InlineError, EmptyState } from './ErrorStates';
import { AdvancedSearch, FilterOptions, DataViewControls } from './InteractiveFeatures';
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
  console.log('Rendering PlayersTab component');
  
  // Handle successful player addition
  const handlePlayerAdded = (playerData) => {
    toast.success('Player added successfully!');
    if (refetchData) {
      refetchData();
    }
  };
  
  console.log('PlayersTab - Rendering with props:', { 
    playersCount: players.length, 
    schoolsCount: schools.length,
    user: user ? 'User exists' : 'No user',
    loading,
    error
  });
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Modal state (removed test modal states)
  const [bulkPlayerOpen, setBulkPlayerOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);
  
  // Debug effect to log component re-renders
  useEffect(() => {
    console.log('PlayersTab re-rendered');
  });

  // Filter players based on search and school
  useEffect(() => {
    let filtered = [...players];

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(player => 
        (player.full_name || player.name || '').toLowerCase().includes(searchLower) ||
        (player.school_name || '').toLowerCase().includes(searchLower) ||
        (player.school_code || '').toLowerCase().includes(searchLower)
      );
    }

    // Filter by school (for super admin)
    if (selectedSchoolId) {
      filtered = filtered.filter(player => player.school_id === selectedSchoolId);
    }

    setFilteredPlayers(filtered);
  }, [players, searchText, selectedSchoolId]);

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

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await adminApi.deleteAthlete(playerId);
        console.log('Player deleted successfully:', playerId);
        if (refetchData) refetchData();
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Failed to delete player. Please try again.');
      }
    }
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
      <div className="space-y-6">
        {/* Header with Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-athletiq-navy">Players Management</h2>
            <span className="bg-athletiq-green text-white px-3 py-1 rounded-full text-sm font-medium">
              {players.length} {players.length === 1 ? 'player' : 'players'}
            </span>
          </div>
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <AddPlayerButton 
            onPlayerAdded={handlePlayerAdded}
            schools={schools}
            user={user}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-athletiq-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
          >
            <FaPlus className="-ml-1 mr-2 h-4 w-4" />
            Add Player
          </AddPlayerButton>
          <button 
            onClick={() => setBulkPlayerOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-athletiq-blue w-full sm:w-auto"
          >
            <FaUpload className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
            Bulk Upload
          </button>
          {selectedPlayerIds.length > 0 && (
            <button 
              onClick={handleBulkDeletePlayers}
              className="inline-flex items-center bg-red-600 text-white font-bold rounded-lg px-4 py-2 text-sm shadow hover:bg-red-700 transition"
            >
              <FaTrash className="mr-2" /> Delete Selected ({selectedPlayerIds.length})
            </button>
          )}
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
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Advanced Search */}
            <div className="flex-1">
              <AdvancedSearch
                onSearch={(query, filters) => {
                  setSearchText(query);
                  // Handle advanced filters if needed
                }}
                placeholder="Search players by name, school, or ID..."
                initialValue={searchText}
              />
            </div>

            {/* Data Export */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>

          {/* Filter Options */}
          <FilterOptions
            filters={[
              {
                key: 'school',
                label: 'School',
                type: 'select',
                options: [
                  { value: '', label: 'All Schools' },
                  ...schools.map(school => ({
                    value: school.id,
                    label: `${school.name} (${school.school_code})`
                  }))
                ],
                value: selectedSchoolId,
                onChange: setSelectedSchoolId,
                visible: user?.role === "super_admin"
              },
              {
                key: 'status',
                label: 'Profile Status',
                type: 'select',
                options: [
                  { value: '', label: 'All Statuses' },
                  { value: 'complete', label: 'Complete Profiles' },
                  { value: 'incomplete', label: 'Incomplete Profiles' }
                ],
                value: '',
                onChange: (value) => {
                  // Handle profile status filter
                }
              }
            ]}
            onFiltersChange={(filters) => {
              console.log('Filters changed:', filters);
            }}
          />

          {/* Data View Controls */}
          <DataViewControls
            viewMode="table"
            onViewModeChange={(mode) => console.log('View mode:', mode)}
            sortOptions={[
              { value: 'name', label: 'Name' },
              { value: 'school', label: 'School' },
              { value: 'created', label: 'Date Added' }
            ]}
            onSortChange={(sort) => console.log('Sort:', sort)}
            totalItems={filteredPlayers.length}
            showViewModeToggle={false}
          />
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.length === filteredPlayers.length && filteredPlayers.length > 0}
                    onChange={handleSelectAllPlayers}
                    className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age/DOB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade/Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guardian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12">
                    <EmptyState
                      title="No players found"
                      description="Try adjusting your search criteria or add a new player to get started."
                      icon={FaUserGraduate}
                      actionLabel="Add New Player"
                      onAction={() => {
                        // This will be handled by AddPlayerButton component
                      }}
                      suggestions={[
                        "Check your search terms",
                        "Try selecting a different school",
                        "Clear all filters to see all players"
                      ]}
                    />
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player, index) => (
                  <tr key={player.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.includes(player.id)}
                        onChange={() => togglePlayerSelection(player.id)}
                        className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {player.profile_photo_url ? (
                            <img
                              src={`/uploads/${player.profile_photo_url}`}
                              alt="Profile"
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <FaUserGraduate className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {player.full_name || player.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {player.full_name_nepali && `${player.full_name_nepali} • `}
                            ID: {player.athlete_id || player.id || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {player.gender || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{player.school?.name || player.school_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{player.school?.school_code || player.school_code || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {player.age ? `${player.age} years` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {player.date_of_birth || player.dob || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {player.grade ? `Grade ${player.grade}` : 'N/A'}
                        {player.section && ` - ${player.section}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {player.nationality || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {player.guardian_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {player.guardian_phone || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {player.relationship_to_player || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {player.primary_sport || 'N/A'}
                      </div>
                      {player.registered_sports && Array.isArray(player.registered_sports) && player.registered_sports.length > 0 && (
                        <div className="text-xs text-gray-500">
                          +{player.registered_sports.length} sports
                        </div>
                      )}
                      {player.height_cm && player.weight_kg && (
                        <div className="text-xs text-gray-400">
                          {player.height_cm}cm, {player.weight_kg}kg
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {player.is_active || player.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {player.verification_status && (
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              player.verification_status === 'verified' ? 'bg-blue-100 text-blue-800' :
                              player.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {player.verification_status === 'verified' ? 'Verified' :
                               player.verification_status === 'rejected' ? 'Rejected' :
                               player.verification_status === 'requires_review' ? 'Review' : 'Pending'}
                            </span>
                          </div>
                        )}
                        {player.profile_completion && (
                          <div className="text-xs text-gray-500">
                            {player.profile_completion}% complete
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewPlayer(player)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => setEditPlayer(player)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Edit Player"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Player"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <BulkPlayerUploadModal 
        open={bulkPlayerOpen}
        onClose={() => setBulkPlayerOpen(false)}
        onUploaded={refetchData}
      />
      
      <EditPlayerModal 
        open={!!editPlayer}
        player={editPlayer}
        onClose={() => setEditPlayer(null)}
        onUpdated={refetchData}
        schools={schools}
      />
      
      <ViewPlayerModal 
        isOpen={!!viewPlayer}
        player={viewPlayer}
        onClose={() => setViewPlayer(null)}
        schools={schools}
      />

      {/* Data Export Modal */}
      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        dataType="players"
        onExport={async (format, options) => {
          return filteredPlayers.map(player => ({
            name: player.full_name || player.name,
            school: player.school_name,
            school_code: player.school_code,
            id: player.id,
            created_at: player.created_at,
            profile_complete: player.profile_complete
          }));
        }}
        availableColumns={[
          { key: 'name', label: 'Name' },
          { key: 'school', label: 'School' },
          { key: 'school_code', label: 'School Code' },
          { key: 'id', label: 'ID' },
          { key: 'created_at', label: 'Created Date' },
          { key: 'profile_complete', label: 'Profile Complete' }
        ]}
      />
    </>
  );
}

export default PlayersTabComponent;
