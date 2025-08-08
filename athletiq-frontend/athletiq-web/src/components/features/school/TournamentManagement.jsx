// src/components/features/school/TournamentManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiClient from '@api/apiClient';
import TournamentOverview from '../../tournament/management/TournamentOverview';
import TournamentDetails from '../../tournament/management/TournamentDetails';
import TournamentCreation from '../../tournament/management/TournamentCreation';

export default function TournamentManagement({ tournaments, school, onRefresh }) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'details'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'list'
  const [tournamentData, setTournamentData] = useState({
    managed: [], // Only show tournaments created by this school
    stats: {},
    teams: [],
    players: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success) {
        setCurrentUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      
      // Fetch only tournaments managed by this school
      const [tournamentsRes, statsRes, teamsRes, playersRes] = await Promise.all([
        apiClient.get('/schools/me/tournaments').catch(() => ({ data: { success: false, data: { registered_tournaments: [] } } })),
        apiClient.get('/schools/me/tournament-stats').catch(() => ({ data: { success: false, data: {} } })),
        apiClient.get('/schools/me/teams').catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get('/schools/me/athletes').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      setTournamentData({
        managed: tournamentsRes.data?.data?.registered_tournaments?.filter(t => t.relationship_type === 'organized') || [],
        stats: statsRes.data?.data || {},
        teams: teamsRes.data?.data || [],
        players: playersRes.data?.data || []
      });
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      toast.error('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = () => {
    setShowCreateModal(true);
  };

  const handleTournamentCreated = (newTournament) => {
    setTournamentData(prev => ({
      ...prev,
      managed: [newTournament, ...prev.managed]
    }));
    toast.success('Tournament created successfully!');
    fetchTournamentData(); // Refresh data
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
    setViewMode('details');
  };

  const handleBackToOverview = () => {
    setSelectedTournament(null);
    setViewMode('overview');
  };

  const handleTournamentUpdate = (updatedTournament) => {
    setTournamentData(prev => ({
      ...prev,
      managed: prev.managed.map(t => 
        t.id === updatedTournament.id ? updatedTournament : t
      )
    }));
    setSelectedTournament(updatedTournament);
    fetchTournamentData(); // Refresh data
  };

  // Filter and sort tournaments
  const filteredTournaments = tournamentData.managed
    .filter(tournament => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.start_date || b.created_at) - new Date(a.start_date || a.created_at);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {viewMode === 'overview' ? (
          <TournamentOverview
            key="overview"
            tournaments={filteredTournaments}
            onCreateTournament={handleCreateTournament}
            onSelectTournament={handleTournamentSelect}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewType={viewType}
            setViewType={setViewType}
            stats={tournamentData.stats}
          />
        ) : (
          <TournamentDetails
            key="details"
            tournament={selectedTournament}
            onBack={handleBackToOverview}
            onUpdate={handleTournamentUpdate}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <TournamentCreation
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleTournamentCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}