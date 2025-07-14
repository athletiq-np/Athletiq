// src/components/features/school/TournamentRegistrationModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaUsers, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

export default function TournamentRegistrationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  tournament, 
  availableTeams = [], 
  availablePlayers = [] 
}) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedTeam('');
      setSelectedPlayers([]);
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!selectedTeam) {
      newErrors.team = 'Please select a team';
    }
    if (selectedPlayers.length === 0) {
      newErrors.players = 'Please select at least one player';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({
      team_id: selectedTeam,
      player_ids: selectedPlayers
    });
  };

  const togglePlayer = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
    
    // Clear error when players are selected
    if (errors.players) {
      setErrors(prev => ({ ...prev, players: '' }));
    }
  };

  const filteredPlayers = availablePlayers.filter(player => {
    const selectedTeamData = availableTeams.find(team => team.id === parseInt(selectedTeam));
    if (!selectedTeamData) return false;
    
    // Filter players based on sport participation
    return player.sports_participation?.some(sport => 
      sport.sport.toLowerCase() === selectedTeamData.sport?.toLowerCase()
    );
  });

  if (!isOpen || !tournament) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            Register for {tournament.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tournament Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Tournament Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Format:</span>
                <span className="ml-2 font-medium">{tournament.format}</span>
              </div>
              <div>
                <span className="text-blue-700">Max Teams:</span>
                <span className="ml-2 font-medium">{tournament.max_teams}</span>
              </div>
              <div>
                <span className="text-blue-700">Start Date:</span>
                <span className="ml-2 font-medium">{tournament.start_date}</span>
              </div>
              <div>
                <span className="text-blue-700">Location:</span>
                <span className="ml-2 font-medium">{tournament.location || 'TBD'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUsers className="inline mr-1" />
                Select Team *
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedPlayers([]); // Reset player selection
                  if (errors.team) {
                    setErrors(prev => ({ ...prev, team: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-athletiq-blue ${
                  errors.team ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a team</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.sport}) - {team.player_count} players
                  </option>
                ))}
              </select>
              {errors.team && <p className="text-red-500 text-sm mt-1">{errors.team}</p>}
            </div>

            {/* Player Selection */}
            {selectedTeam && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Players *
                </label>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  {filteredPlayers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredPlayers.map(player => (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedPlayers.includes(player.id)
                              ? 'bg-blue-100 border-blue-300'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => togglePlayer(player.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPlayers.includes(player.id)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedPlayers.includes(player.id) && (
                                <FaCheck className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{player.full_name}</p>
                              <p className="text-sm text-gray-500">
                                {player.player_code} | Class: {player.class}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {player.sports_participation?.find(sport => 
                              sport.sport.toLowerCase() === availableTeams.find(team => 
                                team.id === parseInt(selectedTeam)
                              )?.sport?.toLowerCase()
                            )?.position || 'Player'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FaExclamationTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No eligible players found for this team</p>
                    </div>
                  )}
                </div>
                {errors.players && <p className="text-red-500 text-sm mt-1">{errors.players}</p>}
                {selectedPlayers.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            {/* Registration Warning */}
            {selectedTeam && tournament.entry_fee > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    <strong>Entry Fee:</strong> ${tournament.entry_fee} will be charged for this registration.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTeam || selectedPlayers.length === 0}
                className="px-6 py-2 bg-athletiq-blue text-white rounded-md hover:bg-athletiq-navy transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Register Team
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
