// src/components/tournament/management/TournamentOverview.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlus, FaSearch, FaFilter, FaSort, FaTh, FaList, 
  FaEye, FaEdit, FaTrophy, FaCalendarAlt, FaUsers, 
  FaMapMarkerAlt, FaFlag, FaChartLine, FaRegClock
} from 'react-icons/fa';
import TournamentCard from '../TournamentCard';

const TournamentOverview = ({ 
  tournaments, 
  onCreateTournament, 
  onSelectTournament,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  viewType,
  setViewType,
  stats 
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Tournaments', count: tournaments.length },
    { value: 'draft', label: 'Draft', count: tournaments.filter(t => t.status === 'draft').length },
    { value: 'upcoming', label: 'Upcoming', count: tournaments.filter(t => t.status === 'upcoming').length },
    { value: 'ongoing', label: 'Ongoing', count: tournaments.filter(t => t.status === 'ongoing').length },
    { value: 'completed', label: 'Completed', count: tournaments.filter(t => t.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', count: tournaments.filter(t => t.status === 'cancelled').length }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' },
    { value: 'participants', label: 'Participants' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <FaEdit className="w-4 h-4" />;
      case 'upcoming': return <FaCalendarAlt className="w-4 h-4" />;
      case 'ongoing': return <FaRegClock className="w-4 h-4" />;
      case 'completed': return <FaTrophy className="w-4 h-4" />;
      case 'cancelled': return <FaFlag className="w-4 h-4" />;
      default: return <FaEye className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tournament-overview"
    >
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tournament Management</h1>
            <p className="text-gray-600">Create, manage, and monitor your tournaments</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateTournament}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Create Tournament
          </motion.button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tournaments</p>
                <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaTrophy className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tournaments</p>
                <p className="text-2xl font-bold text-green-600">
                  {tournaments.filter(t => t.status === 'ongoing').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaRegClock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalParticipants || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaUsers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-orange-600">{stats.successRate || '0%'}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters and Controls */}
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>

            {/* View Type */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewType('grid')}
                className={`p-2 ${viewType === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FaTh className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`p-2 ${viewType === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FaList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tournaments Grid/List */}
      <div className="tournaments-container">
        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrophy className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tournaments Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'No tournaments match your search criteria.' 
                : 'You haven\'t created any tournaments yet.'
              }
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreateTournament}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Create Your First Tournament
            </motion.button>
          </div>
        ) : (
          <>
            {viewType === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TournamentCard
                      tournament={tournament}
                      onView={() => onSelectTournament(tournament)}
                      onEdit={() => onSelectTournament(tournament)}
                      viewType="grid"
                      isManaged={true}
                      className="h-full"
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {tournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TournamentCard
                      tournament={tournament}
                      onView={() => onSelectTournament(tournament)}
                      onEdit={() => onSelectTournament(tournament)}
                      viewType="list"
                      isManaged={true}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TournamentOverview;
