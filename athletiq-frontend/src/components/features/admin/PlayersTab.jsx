import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaUpload, FaDownload, FaSearch, FaEye, FaEdit, FaTrash, FaUserGraduate,
  FaSpinner, FaExclamationCircle, FaUserSlash } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';

// Simple Modal Component
const SimpleModal = ({ isOpen, onClose, children }) => {
  console.log('SimpleModal called with props:', { isOpen, hasChildren: !!children });
  
  if (!isOpen) {
    console.log('SimpleModal not rendering because isOpen is false');
    return null;
  }

  console.log('SimpleModal rendering with isOpen:', isOpen);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        position: 'relative',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <button
          onClick={(e) => {
            console.log('Close button clicked');
            onClose(e);
          }}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280',
            '&:hover': {
              color: '#374151'
            }
          }}
        >
          ×
        </button>
        {children || <div>No children provided to SimpleModal</div>}
      </div>
    </div>
  );
};

// Minimal AddPlayerModal for debugging
const AddPlayerModal = ({ isOpen, onClose }) => {
  console.log('AddPlayerModal render - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('Modal not rendering because isOpen is false');
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '4px',
        minWidth: '300px'
      }}>
        <h2>Add New Player</h2>
        <div>This is a test modal</div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

import EditPlayerModal from "@features/player/EditPlayerModal";
import { registerPlayer } from '@/api/playerApi';
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
  
  // Use useRef to maintain form data between renders
  const formDataRef = useRef({
    name: '',
    email: '',
    phone: '',
    school_id: schools[0]?.id || ''
  });
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkPlayerOpen, setBulkPlayerOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);
  
  const handleAddPlayerClick = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    console.log('Opening modal');
    setIsModalOpen(true);
  }, []);
  
  // Debug effect to track modal state changes
  useEffect(() => {
    console.log('Modal state changed:', isModalOpen);
  }, [isModalOpen]);
  
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

  const handleDeletePlayer = (playerId) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      // TODO: Implement delete API call
      console.log('Delete player:', playerId);
      refetchData();
    }
  };

  const handleBulkDeletePlayers = () => {
    if (selectedPlayerIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedPlayerIds.length} players?`)) {
      // TODO: Implement bulk delete API call
      console.log('Bulk delete players:', selectedPlayerIds);
      setSelectedPlayerIds([]);
      refetchData();
    }
  };

  const handleAddPlayer = async (playerData) => {
    try {
      const formData = new FormData();
      
      // Append all player data to formData
      Object.entries(playerData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      
      // Add created_by field
      if (user?.id) {
        formData.append('created_by', user.id);
      }
      
      // Add school_id if user is school admin
      if (user?.role === 'school_admin' && user?.school_id) {
        formData.append('school_id', user.school_id);
      }
      
      console.log('Submitting player data:', Object.fromEntries(formData));
      const response = await registerPlayer(formData);
      
      if (response && response.success) {
        toast.success('Player created successfully!');
        setIsModalOpen(false);
        refetchData();
        return true;
      } else {
        const errorMsg = response?.message || 'Failed to create player';
        console.error('Error response:', response);
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      console.error('Error creating player:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create player';
      toast.error(errorMsg);
      return false;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-athletiq-blue mb-4" />
        <p className="text-gray-600">Loading players...</p>
      </div>
    );
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
          <button
            type="button"
            onClick={handleAddPlayerClick}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-athletiq-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="-ml-1 mr-2 h-5 w-5" />
            Add Player
          </button>
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

  // Test element to verify component rendering
  console.log('Rendering PlayersTab with isModalOpen:', isModalOpen);
  
  return (
    <div className="space-y-6">
      {/* Add Player Modal */}
      <AddPlayerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* Test element */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'red',
        color: 'white',
        padding: '10px',
        zIndex: 10000,
        borderRadius: '4px',
        border: '2px solid white'
      }}>
        PlayersTab Rendered
      </div>
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
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search players..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
            />
          </div>

          {/* School Filter (for super admin) */}
          {user?.role === "super_admin" && (
            <div className="sm:w-64">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
              >
                <option value="">All Schools</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.school_code})
                  </option>
                ))}
              </select>
            </div>
          )}
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
                  Date of Birth
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FaUserGraduate className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No players found</p>
                    <p className="text-sm">Try adjusting your search or add a new player</p>
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
                            Player ID: {player.id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{player.school_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{player.school_code || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {player.dob || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {player.is_active || player.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewPlayer(player)}
                          className="text-athletiq-green hover:text-green-700 p-1 rounded"
                          title="View Player"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => setEditPlayer(player)}
                          className="text-athletiq-navy hover:text-blue-700 p-1 rounded"
                          title="Edit Player"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
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

      {/* Add Player Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={handleAddPlayerClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 
                   text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <FaPlus className="w-5 h-5" />
          <span>Add Player</span>
        </motion.button>
      </div>

      {/* Test Modal */}
      <SimpleModal 
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Closing modal');
          setIsModalOpen(false);
        }}
      >
        <h2>Test Modal</h2>
        <p>If you can see this, the modal is working!</p>
        <button 
          onClick={() => console.log('Test button clicked')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </SimpleModal>
      
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
        open={!!viewPlayer}
        player={viewPlayer}
        onClose={() => setViewPlayer(null)}
      />
    </div>
  );
}

export default PlayersTabComponent;
