import React, { useState, useEffect } from "react";
import { FaPlus, FaUpload, FaDownload, FaSearch, FaEye, FaEdit, FaTrash, FaUserGraduate } from "react-icons/fa";
import AddPlayerModal from "@features/player/AddPlayerModal";
import EditPlayerModal from "@features/player/EditPlayerModal";
import ViewPlayerModal from "@features/player/ViewPlayerModal";
import BulkPlayerUploadModal from '@features/player/BulkPlayerUploadModal';

export default function PlayersTab({ players, schools, user, refetchData }) {
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  
  // Modal states
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [bulkPlayerOpen, setBulkPlayerOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);

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

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-athletiq-navy">Players Management</h2>
          <span className="bg-athletiq-green text-white px-3 py-1 rounded-full text-sm font-medium">
            {filteredPlayers.length} players
          </span>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setAddPlayerOpen(true)}
            className="inline-flex items-center bg-athletiq-green text-white font-bold rounded-lg px-4 py-2 text-sm shadow hover:bg-green-700 transition"
          >
            <FaPlus className="mr-2" /> Add Player
          </button>
          <button 
            onClick={() => setBulkPlayerOpen(true)}
            className="inline-flex items-center bg-athletiq-navy text-white font-bold rounded-lg px-4 py-2 text-sm shadow hover:bg-navy-700 transition"
          >
            <FaUpload className="mr-2" /> Bulk Upload
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search players by name, school..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
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

      {/* Modals */}
      <AddPlayerModal 
        open={addPlayerOpen}
        onClose={() => setAddPlayerOpen(false)}
        onAdded={refetchData}
        schools={schools}
      />
      
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
