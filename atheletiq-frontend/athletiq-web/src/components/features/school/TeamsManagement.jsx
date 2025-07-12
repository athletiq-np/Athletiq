// src/components/features/school/TeamsManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaSearch, FaFilter, FaUsers, FaUserPlus, FaEdit, FaTrash,
  FaFootballBall, FaBasketballBall, FaTableTennis, FaVolleyballBall,
  FaBaseballBall, FaMale, FaFemale, FaTrophy, FaStar, FaEye,
  FaSort, FaDownload, FaUpload, FaCog, FaGraduationCap, FaChartLine
} from 'react-icons/fa';
import { MdSports, MdGroup, MdPerson, MdDragIndicator } from 'react-icons/md';
import { HiX } from 'react-icons/hi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import apiClient from '../../../api/apiClient';

/**
 * 🏆 ATHLETIQ - Teams Management Component
 * Comprehensive team management system with:
 * - Multi-sport team creation and management
 * - Drag & drop student assignment
 * - Gender-based team organization
 * - Tournament-specific team configurations
 * - Player position management
 * - Team analytics and insights
 */
export default function TeamsManagement({ students = [], school, onRefresh }) {
  // State Management
  const [teams, setTeams] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragMode, setDragMode] = useState(false);

  // Sports configuration
  const sportsConfig = {
    football: {
      name: 'Football',
      icon: FaFootballBall,
      color: 'green',
      maxPlayers: 11,
      substitutes: 7,
      positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
    },
    basketball: {
      name: 'Basketball',
      icon: FaBasketballBall,
      color: 'orange',
      maxPlayers: 5,
      substitutes: 7,
      positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center']
    },
    volleyball: {
      name: 'Volleyball',
      icon: FaVolleyballBall,
      color: 'blue',
      maxPlayers: 6,
      substitutes: 6,
      positions: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Libero', 'Opposite']
    },
    tennis: {
      name: 'Tennis',
      icon: FaTableTennis,
      color: 'yellow',
      maxPlayers: 1,
      substitutes: 2,
      positions: ['Singles Player']
    },
    cricket: {
      name: 'Cricket',
      icon: FaBaseballBall,
      color: 'red',
      maxPlayers: 11,
      substitutes: 4,
      positions: ['Batsman', 'Bowler', 'Wicket Keeper', 'All Rounder']
    }
  };

  const ageGroups = [
    { value: 'u14', label: 'Under 14', min: 10, max: 14 },
    { value: 'u16', label: 'Under 16', min: 14, max: 16 },
    { value: 'u18', label: 'Under 18', min: 16, max: 18 },
    { value: 'senior', label: 'Senior', min: 18, max: 25 }
  ];

  // Fetch teams data
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/schools/me/teams');
      setTeams(response.data.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Filter teams based on selected criteria
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const sportMatch = selectedSport === 'all' || team.sport === selectedSport;
      const genderMatch = selectedGender === 'all' || team.gender === selectedGender;
      const ageMatch = selectedAgeGroup === 'all' || team.age_group === selectedAgeGroup;
      const searchMatch = searchTerm === '' || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.coach?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return sportMatch && genderMatch && ageMatch && searchMatch;
    });
  }, [teams, selectedSport, selectedGender, selectedAgeGroup, searchTerm]);

  // Filter available students for team assignment
  const availableStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedTeam) {
        const genderMatch = selectedTeam.gender === 'mixed' || student.gender === selectedTeam.gender;
        const ageMatch = true; // Add age validation based on student's birth date if needed
        const notInTeam = !selectedTeam.players?.some(p => p.id === student.id);
        
        return genderMatch && ageMatch && notInTeam;
      }
      return true;
    });
  }, [students, selectedTeam]);

  // Handle drag and drop
  const handleDragEnd = async (result) => {
    if (!result.destination || !selectedTeam) return;

    const { source, destination } = result;

    // Moving student from available pool to team
    if (source.droppableId === 'available-students' && destination.droppableId === 'team-players') {
      const student = availableStudents[source.index];
      if (!student) return;

      try {
        await apiClient.post(`/schools/me/teams/${selectedTeam.id}/players`, {
          student_id: student.id,
          position: null // Can be set later
        });

        // Update local state
        const updatedTeam = {
          ...selectedTeam,
          players: [...(selectedTeam.players || []), student]
        };
        setSelectedTeam(updatedTeam);
        setTeams(teams.map(t => t.id === selectedTeam.id ? updatedTeam : t));
        
        toast.success(`${student.full_name} added to ${selectedTeam.name}`);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Error adding player to team:', error);
        toast.error('Failed to add player to team');
      }
    }

    // Moving student from team back to available pool
    if (source.droppableId === 'team-players' && destination.droppableId === 'available-students') {
      const player = selectedTeam.players[source.index];
      if (!player) return;

      try {
        await apiClient.delete(`/schools/me/teams/${selectedTeam.id}/players/${player.id}`);

        // Update local state
        const updatedTeam = {
          ...selectedTeam,
          players: selectedTeam.players.filter(p => p.id !== player.id)
        };
        setSelectedTeam(updatedTeam);
        setTeams(teams.map(t => t.id === selectedTeam.id ? updatedTeam : t));
        
        toast.success(`${player.full_name} removed from ${selectedTeam.name}`);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Error removing player from team:', error);
        toast.error('Failed to remove player from team');
      }
    }
  };

  // Create new team
  const handleCreateTeam = async (teamData) => {
    try {
      const response = await apiClient.post('/schools/me/teams', teamData);
      const newTeam = response.data.data;
      setTeams([...teams, newTeam]);
      setShowCreateModal(false);
      toast.success('Team created successfully!');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;

    try {
      await apiClient.delete(`/schools/me/teams/${teamId}`);
      setTeams(teams.filter(t => t.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setShowTeamDetails(false);
      }
      toast.success('Team deleted successfully!');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-athletiq-blue dark:border-athletiq-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-athletiq-blue to-athletiq-navy text-white rounded-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Teams Management</h2>
            <p className="text-blue-100">Create and manage school teams for various sports and tournaments</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDragMode(!dragMode)}
              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                dragMode 
                  ? 'bg-white text-athletiq-blue border-white shadow-lg' 
                  : 'bg-transparent text-white border-white/50 hover:border-white hover:bg-white/10'
              }`}
            >
              <MdDragIndicator className="inline mr-2" />
              {dragMode ? 'Exit Drag Mode' : 'Enable Drag Mode'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-athletiq-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center shadow-lg"
            >
              <FaPlus className="mr-2" />
              Create Team
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="text-blue-100">
            <span className="font-semibold text-white">{teams.length}</span> Teams
          </div>
          <div className="text-blue-100">
            <span className="font-semibold text-white">
              {teams.reduce((sum, team) => sum + (team.players?.length || 0), 0)}
            </span> Players
          </div>
          <div className="text-blue-100">
            <span className="font-semibold text-white">
              {new Set(teams.map(t => t.sport)).size}
            </span> Sports
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FaFilter className="h-5 w-5 mr-2 text-athletiq-blue dark:text-athletiq-blue" />
            Search & Filters
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTeams.length} of {teams.length} teams shown
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search teams or coaches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-colors placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Sport Filter */}
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-colors"
          >
            <option value="all">All Sports</option>
            {Object.entries(sportsConfig).map(([key, sport]) => (
              <option key={key} value={key}>{sport.name}</option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-colors"
          >
            <option value="all">All Genders</option>
            <option value="male">Boys</option>
            <option value="female">Girls</option>
            <option value="mixed">Mixed</option>
          </select>

          {/* Age Group Filter */}
          <select
            value={selectedAgeGroup}
            onChange={(e) => setSelectedAgeGroup(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-colors"
          >
            <option value="all">All Age Groups</option>
            {ageGroups.map(group => (
              <option key={group.value} value={group.value}>{group.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaUsers className="h-5 w-5 mr-2 text-athletiq-blue dark:text-athletiq-blue" />
                  School Teams ({filteredTeams.length})
                </h3>
                {filteredTeams.length > 0 && (
                  <button className="text-sm text-athletiq-blue hover:text-athletiq-navy dark:text-athletiq-blue dark:hover:text-athletiq-green transition-colors">
                    Export List
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {filteredTeams.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FaUsers className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Teams Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    {teams.length === 0 
                      ? "Get started by creating your first team for your school's sports activities" 
                      : "Try adjusting your filters to see more teams"
                    }
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-athletiq-blue text-white px-6 py-3 rounded-lg hover:bg-athletiq-navy transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FaPlus className="mr-2 inline" />
                    Create First Team
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTeams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <TeamCard
                        team={team}
                        sportsConfig={sportsConfig}
                        onSelect={setSelectedTeam}
                        onEdit={(team) => {
                          setSelectedTeam(team);
                          setShowCreateModal(true);
                        }}
                        onDelete={handleDeleteTeam}
                        onViewDetails={(team) => {
                          setSelectedTeam(team);
                          setShowTeamDetails(true);
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Sidebar Panels */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaChartLine className="h-5 w-5 mr-2 text-athletiq-blue dark:text-athletiq-blue" />
              Team Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Teams:</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">{teams.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Active Players:</span>
                <span className="font-semibold text-lg text-athletiq-blue dark:text-athletiq-blue">
                  {teams.reduce((sum, team) => sum + (team.players?.length || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Sports Covered:</span>
                <span className="font-semibold text-lg text-athletiq-green dark:text-athletiq-green">
                  {new Set(teams.map(t => t.sport)).size}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Team Panel */}
          {selectedTeam && dragMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <DragDropContext onDragEnd={handleDragEnd}>
                <TeamManagementPanel
                  team={selectedTeam}
                  availableStudents={availableStudents}
                  sportsConfig={sportsConfig}
                  onClose={() => setSelectedTeam(null)}
                />
              </DragDropContext>
            </motion.div>
          )}

          {/* Help Card */}
          {!selectedTeam && (
            <div className="bg-gradient-to-br from-athletiq-cream to-white dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Quick Tips</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Enable drag mode to manage team players</li>
                <li>• Click team cards to view details</li>
                <li>• Use filters to find specific teams</li>
                <li>• Export team lists for reports</li>
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTeamModal
            team={selectedTeam}
            sportsConfig={sportsConfig}
            ageGroups={ageGroups}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedTeam(null);
            }}
            onSubmit={handleCreateTeam}
          />
        )}
      </AnimatePresence>

      {/* Team Details Modal */}
      <AnimatePresence>
        {showTeamDetails && selectedTeam && (
          <TeamDetailsModal
            team={selectedTeam}
            sportsConfig={sportsConfig}
            onClose={() => {
              setShowTeamDetails(false);
              setSelectedTeam(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Team Card Component
const TeamCard = ({ team, sportsConfig, onSelect, onEdit, onDelete, onViewDetails }) => {
  const sport = sportsConfig[team.sport];
  const Icon = sport?.icon || MdSports;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2, shadow: "0 8px 25px rgba(0,0,0,0.1)" }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-athletiq-blue/50 dark:hover:border-athletiq-blue/50 transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect(team)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg bg-gradient-to-br from-${sport?.color || 'gray'}-100 to-${sport?.color || 'gray'}-50 group-hover:scale-105 transition-transform`}>
            <Icon className={`h-6 w-6 text-${sport?.color || 'gray'}-600`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-athletiq-blue dark:group-hover:text-athletiq-blue transition-colors">
              {team.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{sport?.name || team.sport}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(team);
            }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-athletiq-blue dark:hover:text-athletiq-blue hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="View Details"
          >
            <FaEye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(team);
            }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-athletiq-blue dark:hover:text-athletiq-blue hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit Team"
          >
            <FaEdit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(team.id);
            }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Team"
          >
            <FaTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Team Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Players:</span>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {team.players?.length || 0}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{sport?.maxPlayers || 'N/A'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Gender:</span>
          <div className="flex items-center space-x-1">
            {team.gender === 'male' && <FaMale className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
            {team.gender === 'female' && <FaFemale className="h-4 w-4 text-pink-500 dark:text-pink-400" />}
            {team.gender === 'mixed' && <MdGroup className="h-4 w-4 text-purple-500 dark:text-purple-400" />}
            <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">{team.gender}</span>
          </div>
        </div>
        
        {team.coach && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Coach:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{team.coach}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          team.status === 'active' 
            ? 'bg-athletiq-green/10 text-athletiq-green border border-athletiq-green/20 dark:bg-athletiq-green/20 dark:text-athletiq-green dark:border-athletiq-green/30' 
            : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
        }`}>
          {team.status === 'active' && <div className="w-1.5 h-1.5 bg-athletiq-green rounded-full mr-1.5" />}
          {team.status || 'Active'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Created {new Date(team.created_at).toLocaleDateString()}
        </span>
      </div>
      
      {/* Progress Bar */}
      {sport?.maxPlayers && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-athletiq-blue dark:bg-athletiq-blue h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(((team.players?.length || 0) / sport.maxPlayers) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Team Management Panel for Drag & Drop
const TeamManagementPanel = ({ team, availableStudents, sportsConfig, onClose }) => {
  const sport = sportsConfig[team.sport];
  const Icon = sport?.icon || MdSports;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-athletiq-blue/5 to-athletiq-navy/5 dark:from-athletiq-blue/10 dark:to-athletiq-navy/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${sport?.color || 'gray'}-100 dark:bg-${sport?.color || 'gray'}-800`}>
              <Icon className={`h-5 w-5 text-${sport?.color || 'gray'}-600 dark:text-${sport?.color || 'gray'}-400`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Manage {team.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drag students to assign or remove from team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Team Players */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            <span className="flex items-center">
              <FaUsers className="h-4 w-4 mr-2 text-athletiq-blue dark:text-athletiq-blue" />
              Team Players ({team.players?.length || 0}/{sport?.maxPlayers})
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              (team.players?.length || 0) >= (sport?.maxPlayers || 0) 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {(team.players?.length || 0) >= (sport?.maxPlayers || 0) ? 'Full' : 'Open'}
            </span>
          </h4>
          <Droppable droppableId="team-players">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-32 p-3 border-2 border-dashed rounded-lg transition-all duration-200 ${
                  snapshot.isDraggingOver 
                    ? 'border-athletiq-blue bg-athletiq-blue/5 shadow-inner dark:border-athletiq-blue dark:bg-athletiq-blue/10' 
                    : 'border-gray-300 bg-gray-50/50 dark:border-gray-600 dark:bg-gray-700/50'
                }`}
              >
                {team.players?.map((player, index) => (
                  <Draggable key={player.id} draggableId={`player-${player.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'shadow-lg scale-105 border-athletiq-blue bg-athletiq-blue/5 dark:border-athletiq-blue dark:bg-athletiq-blue/10' 
                            : 'hover:shadow-md border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <MdDragIndicator className="text-gray-400 dark:text-gray-500" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{player.full_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {player.position || 'No position'} • Grade {player.grade || 'N/A'}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">#{index + 1}</div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                )) || []}
                {provided.placeholder}
                {(!team.players || team.players.length === 0) && (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <FaUserPlus className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Drag students here to add to team
                    </p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>

        {/* Available Students */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <FaGraduationCap className="h-4 w-4 mr-2 text-athletiq-green dark:text-athletiq-green" />
            Available Students ({availableStudents.length})
          </h4>
          <Droppable droppableId="available-students">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`max-h-48 overflow-y-auto p-3 border-2 border-dashed rounded-lg transition-all duration-200 ${
                  snapshot.isDraggingOver 
                    ? 'border-athletiq-green bg-athletiq-green/5 shadow-inner dark:border-athletiq-green dark:bg-athletiq-green/10' 
                    : 'border-gray-300 bg-gray-50/50 dark:border-gray-600 dark:bg-gray-700/50'
                }`}
              >
                {availableStudents.map((student, index) => (
                  <Draggable key={student.id} draggableId={`student-${student.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'shadow-lg scale-105 border-athletiq-green bg-athletiq-green/5 dark:border-athletiq-green dark:bg-athletiq-green/10' 
                            : 'hover:shadow-md border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <MdDragIndicator className="text-gray-400 dark:text-gray-500" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{student.full_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {student.gender === 'male' ? '♂' : '♀'} Grade {student.grade || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {availableStudents.length === 0 && (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <FaGraduationCap className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No available students for this team
                    </p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
};

// Create Team Modal Component
const CreateTeamModal = ({ team, sportsConfig, ageGroups, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    sport: team?.sport || 'football',
    gender: team?.gender || 'male',
    age_group: team?.age_group || 'u16',
    coach: team?.coach || '',
    description: team?.description || '',
    status: team?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-athletiq-blue/5 to-athletiq-navy/5 dark:from-athletiq-blue/10 dark:to-athletiq-navy/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {team ? 'Edit Team' : 'Create New Team'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {team ? 'Update team information and settings' : 'Set up a new team for your school'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="e.g., School Eagles Football Team"
              />
            </div>

            {/* Sport */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sport *
              </label>
              <select
                required
                value={formData.sport}
                onChange={(e) => setFormData({...formData, sport: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-all"
              >
                {Object.entries(sportsConfig).map(([key, sport]) => (
                  <option key={key} value={key}>{sport.name}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Gender *
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-all"
              >
                <option value="male">Boys Team</option>
                <option value="female">Girls Team</option>
                <option value="mixed">Mixed Team</option>
              </select>
            </div>

            {/* Age Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Age Group *
              </label>
              <select
                required
                value={formData.age_group}
                onChange={(e) => setFormData({...formData, age_group: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-all"
              >
                {ageGroups.map(group => (
                  <option key={group.value} value={group.value}>{group.label}</option>
                ))}
              </select>
            </div>

            {/* Coach */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Coach/Teacher
              </label>
              <input
                type="text"
                value={formData.coach}
                onChange={(e) => setFormData({...formData, coach: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Coach or teacher name"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Team Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Team Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent transition-all resize-none placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Optional team description or notes..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-athletiq-blue text-white rounded-lg hover:bg-athletiq-navy transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              {team ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Team Details Modal Component
const TeamDetailsModal = ({ team, sportsConfig, onClose }) => {
  const sport = sportsConfig[team.sport];
  const Icon = sport?.icon || MdSports;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-athletiq-blue/5 to-athletiq-navy/5 dark:from-athletiq-blue/10 dark:to-athletiq-navy/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded-xl bg-gradient-to-br from-${sport?.color || 'gray'}-100 to-${sport?.color || 'gray'}-50 dark:from-${sport?.color || 'gray'}-800 dark:to-${sport?.color || 'gray'}-700 shadow-sm`}>
                <Icon className={`h-8 w-8 text-${sport?.color || 'gray'}-600 dark:text-${sport?.color || 'gray'}-300`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{team.name}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{sport?.name}</span>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{team.gender} Team</span>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{team.age_group}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Info */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaCog className="h-5 w-5 mr-2 text-athletiq-blue" />
                  Team Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sport</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      <Icon className={`h-5 w-5 mr-2 text-${sport?.color || 'gray'}-600 dark:text-${sport?.color || 'gray'}-300`} />
                      {sport?.name}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mt-1">
                      {team.gender === 'male' && <FaMale className="h-5 w-5 mr-2 text-blue-500" />}
                      {team.gender === 'female' && <FaFemale className="h-5 w-5 mr-2 text-pink-500" />}
                      {team.gender === 'mixed' && <MdGroup className="h-5 w-5 mr-2 text-purple-500" />}
                      <span className="capitalize">{team.gender}</span>
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Age Group</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{team.age_group}</p>
                  </div>
                  
                  {team.coach && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Coach</span>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{team.coach}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                      team.status === 'active' 
                        ? 'bg-athletiq-green/10 text-athletiq-green border border-athletiq-green/20 dark:bg-athletiq-green/20 dark:border-athletiq-green/30' 
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500'
                    }`}>
                      {team.status === 'active' && <div className="w-2 h-2 bg-athletiq-green rounded-full mr-2" />}
                      <span className="capitalize">{team.status}</span>
                    </span>
                  </div>
                  
                  {team.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{team.description}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Created on {new Date(team.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FaUsers className="h-5 w-5 mr-2 text-athletiq-blue" />
                      Team Players ({team.players?.length || 0}/{sport?.maxPlayers})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-athletiq-blue h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(((team.players?.length || 0) / sport?.maxPlayers) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 min-w-max">
                        {team.players?.length || 0} of {sport?.maxPlayers}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {team.players && team.players.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {team.players.map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-athletiq-blue/10 dark:bg-athletiq-blue/20 text-athletiq-blue rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{player.full_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {player.position || 'No position assigned'} • Grade {player.grade || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {player.gender === 'male' ? '♂' : '♀'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <FaUsers className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Players Assigned</h4>
                      <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                        This team doesn't have any players yet. Enable drag mode to start adding students to the team.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
