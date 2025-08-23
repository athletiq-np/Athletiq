import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import apiClient from '../../api/apiClient';

// Sortable Athlete Card Component
const SortableAthleteCard = ({ athlete, teamId, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: athlete.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium text-gray-900">{athlete.name}</div>
          <div className="text-sm text-gray-500">
            Grade: {athlete.grade} | Position: {athlete.position || 'Not set'}
          </div>
        </div>
        <button
          onClick={() => onRemove(athlete.id)}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team, onEdit, onDelete, onAddAthlete, onRemoveAthlete, onUpdatePositions }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {      const oldIndex = team.athletes.findIndex(p => p.id === active.id);
      const newIndex = team.athletes.findIndex(p => p.id === over.id);

      const newAthletes = arrayMove(team.athletes, oldIndex, newIndex);
      onUpdatePositions(team.id, newAthletes);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">{team.name}</h3>
            <p className="text-blue-100">{team.sport} | {team.athletes?.length || 0} athletes</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(team)}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(team.id)}
              className="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => onAddAthlete(team.id)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            + Add Athlete
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 mb-3">Team Roster:</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={team.athletes?.map(p => p.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {team.athletes?.map((athlete) => (
                <SortableAthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  teamId={team.id}
                  onRemove={onRemoveAthlete}
                />
              ))}
            </SortableContext>
          </DndContext>

          {(!team.athletes || team.athletes.length === 0) && (
            <p className="text-gray-500 text-center py-8 italic">
              No athletes added yet. Click "Add Athlete" to start building your team.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main Teams Management Component
const TeamsManagement = () => {
  const [teams, setTeams] = useState([]);
  const [sports, setSports] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: '',
    sport: '',
    maxAthletes: 11,
    minAthletes: 7
  });

  const [athleteForm, setAthleteForm] = useState({
    name: '',
    grade: '',
    position: '',
    athleteId: ''
  });

  useEffect(() => {
    loadTeams();
    loadSports();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await apiClient.get('/schools/me/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSports = async () => {
    try {
      const response = await apiClient.get('/schools/me/teams/sports');
      setSports(response.data);
    } catch (error) {
      console.error('Error loading sports:', error);
      // Fallback sports list
      setSports([
        { id: 'football', name: 'Football', maxAthletes: 11, minAthletes: 7 },
        { id: 'basketball', name: 'Basketball', maxAthletes: 5, minAthletes: 5 },
        { id: 'volleyball', name: 'Volleyball', maxAthletes: 6, minAthletes: 6 },
        { id: 'track', name: 'Track & Field', maxAthletes: 20, minAthletes: 1 },
        { id: 'swimming', name: 'Swimming', maxAthletes: 15, minAthletes: 1 }
      ]);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/schools/me/teams', teamForm);
      setTeams([...teams, response.data]);
      setShowCreateModal(false);
      resetTeamForm();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/schools/me/teams/${editingTeam.id}`, teamForm);
      setTeams(teams.map(t => t.id === editingTeam.id ? response.data : t));
      setShowCreateModal(false);
      setEditingTeam(null);
      resetTeamForm();
    } catch (error) {
      console.error('Error editing team:', error);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await apiClient.delete(`/schools/me/teams/${teamId}`);
        setTeams(teams.filter(t => t.id !== teamId));
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(`/schools/me/teams/${selectedTeamId}/athletes`, athleteForm);
      setTeams(teams.map(team => 
        team.id === selectedTeamId 
          ? { ...team, athletes: [...(team.athletes || []), response.data] }
          : team
      ));
      setShowAthleteModal(false);
      resetAthleteForm();
    } catch (error) {
      console.error('Error adding athlete:', error);
    }
  };

  const handleRemoveAthlete = async (athleteId) => {
    try {
      await apiClient.delete(`/schools/me/teams/${selectedTeamId}/athletes/${athleteId}`);
      setTeams(teams.map(team => 
        team.id === selectedTeamId 
          ? { ...team, athletes: team.athletes.filter(p => p.id !== athleteId) }
          : team
      ));
    } catch (error) {
      console.error('Error removing athlete:', error);
    }
  };

  const handleUpdatePositions = async (teamId, newPlayers) => {
    try {
      const updates = newPlayers.map((player, index) => ({
        id: player.id,
        position: index + 1
      }));
      
      await apiClient.put(`/schools/me/teams/${teamId}/players/positions`, { updates });
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, players: newPlayers } : team
      ));
    } catch (error) {
      console.error('Error updating positions:', error);
    }
  };

  const openCreateModal = () => {
    setEditingTeam(null);
    resetTeamForm();
    setShowCreateModal(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      sport: team.sport,
      maxPlayers: team.maxPlayers || 11,
      minPlayers: team.minPlayers || 7
    });
    setShowCreateModal(true);
  };

  const openPlayerModal = (teamId) => {
    setSelectedTeamId(teamId);
    resetPlayerForm();
    setShowPlayerModal(true);
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      sport: '',
      maxPlayers: 11,
      minPlayers: 7
    });
  };

  const resetPlayerForm = () => {
    setPlayerForm({
      name: '',
      grade: '',
      position: '',
      studentId: ''
    });
  };

  const handleSportChange = (sportId) => {
    const sport = sports.find(s => s.id === sportId);
    if (sport) {
      setTeamForm({
        ...teamForm,
        sport: sportId,
        maxPlayers: sport.maxPlayers,
        minPlayers: sport.minPlayers
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Teams Management</h1>
        <p className="text-gray-600 mb-6">
          Manage your school's sports teams and assign students to participate in tournaments.
        </p>
        
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          + Create New Team
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={openEditModal}
              onDelete={handleDeleteTeam}
              onAddPlayer={openPlayerModal}
              onRemovePlayer={handleRemovePlayer}
              onUpdatePositions={handleUpdatePositions}
            />
          ))}
        </AnimatePresence>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No teams created yet.</p>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Your First Team
          </button>
        </div>
      )}

      {/* Create/Edit Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold mb-4">
                {editingTeam ? 'Edit Team' : 'Create New Team'}
              </h2>
              
              <form onSubmit={editingTeam ? handleEditTeam : handleCreateTeam}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport
                    </label>
                    <select
                      value={teamForm.sport}
                      onChange={(e) => handleSportChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a sport</option>
                      {sports.map(sport => (
                        <option key={sport.id} value={sport.id}>
                          {sport.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Players
                      </label>
                      <input
                        type="number"
                        value={teamForm.minPlayers}
                        onChange={(e) => setTeamForm({...teamForm, minPlayers: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Players
                      </label>
                      <input
                        type="number"
                        value={teamForm.maxPlayers}
                        onChange={(e) => setTeamForm({...teamForm, maxPlayers: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTeam(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {editingTeam ? 'Update Team' : 'Create Team'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Player Modal */}
      <AnimatePresence>
        {showPlayerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold mb-4">Add Player</h2>
              
              <form onSubmit={handleAddPlayer}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={playerForm.studentId}
                      onChange={(e) => setPlayerForm({...playerForm, studentId: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={playerForm.name}
                      onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <select
                      value={playerForm.grade}
                      onChange={(e) => setPlayerForm({...playerForm, grade: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select grade</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position (Optional)
                    </label>
                    <input
                      type="text"
                      value={playerForm.position}
                      onChange={(e) => setPlayerForm({...playerForm, position: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Forward, Goalkeeper, etc."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPlayerModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Add Player
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamsManagement;
