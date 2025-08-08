import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaPlus, FaUser, FaSchool, FaIdCard, FaCertificate,
  FaCheck, FaExclamationTriangle, FaClock, FaEye,
  FaEdit, FaTrash, FaDownload, FaSearch, FaFilter,
  FaTrophy, FaCalendarAlt, FaMedal, FaCamera,
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaSpinner
} from 'react-icons/fa';
import apiClient from '../../../api/apiClient';
import EnhancedAthleteForm from './EnhancedAthleteForm';
import AthleteDetailModal from './AthleteDetailModal';
import VerificationStatusBadge from '../common/VerificationStatusBadge';
import ProfileCompletionCircle from '../common/ProfileCompletionCircle';

const EnhancedGuardianDashboard = () => {
  // State management
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompletion, setFilterCompletion] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Statistics state
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    incomplete: 0,
    averageCompletion: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadAthletes();
    loadDashboardStats();
  }, []);

  // Filter athletes based on search and filters
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.athlete_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.school_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || athlete.verification_status === filterStatus;
    
    const matchesCompletion = filterCompletion === 'all' ||
                             (filterCompletion === 'complete' && athlete.profile_completion >= 80) ||
                             (filterCompletion === 'incomplete' && athlete.profile_completion < 80);

    return matchesSearch && matchesStatus && matchesCompletion;
  }).sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/guardian/athletes');
      
      if (response.data.success) {
        setAthletes(response.data.athletes || []);
      } else {
        toast.error('Failed to load athletes');
      }
    } catch (error) {
      console.error('Error loading athletes:', error);
      toast.error('Failed to load athletes');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await apiClient.get('/api/guardian/dashboard/stats');
      
      if (response.data.success) {
        setDashboardStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleAddAthlete = async (formData) => {
    try {
      const response = await apiClient.post('/api/guardian/athletes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Athlete registered successfully!');
        setShowAddForm(false);
        await loadAthletes();
        await loadDashboardStats();
        
        // Show completion status
        const { profile_completion, requires_manual_review } = response.data.data;
        if (requires_manual_review) {
          toast.info('Registration complete! Some documents require manual review.');
        } else if (profile_completion >= 80) {
          toast.success(`Profile ${profile_completion}% complete! All set for verification.`);
        }
      } else {
        toast.error(response.data.message || 'Failed to register athlete');
      }
    } catch (error) {
      console.error('Error adding athlete:', error);
      toast.error('Failed to register athlete');
    }
  };

  const handleEditAthlete = async (formData) => {
    try {
      const response = await apiClient.put(`/api/guardian/athletes/${editingAthlete.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Athlete updated successfully!');
        setEditingAthlete(null);
        await loadAthletes();
        await loadDashboardStats();
      } else {
        toast.error(response.data.message || 'Failed to update athlete');
      }
    } catch (error) {
      console.error('Error updating athlete:', error);
      toast.error('Failed to update athlete');
    }
  };

  const handleDeleteAthlete = async (athleteId) => {
    if (!window.confirm('Are you sure you want to delete this athlete? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/guardian/athletes/${athleteId}`);
      
      if (response.data.success) {
        toast.success('Athlete deleted successfully');
        await loadAthletes();
        await loadDashboardStats();
      } else {
        toast.error(response.data.message || 'Failed to delete athlete');
      }
    } catch (error) {
      console.error('Error deleting athlete:', error);
      toast.error('Failed to delete athlete');
    }
  };

  const handleViewDetails = (athlete) => {
    setSelectedAthlete(athlete);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCompletionColor = (completion) => {
    if (completion >= 80) return 'text-green-600';
    if (completion >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-lg">Loading athletes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Athletes Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your athletes with comprehensive data collection and verification
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <FaPlus />
          <span>Add New Athlete</span>
        </button>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Athletes</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.total}</p>
            </div>
            <FaUser className="text-3xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">{dashboardStats.verified}</p>
            </div>
            <FaCheck className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{dashboardStats.pending}</p>
            </div>
            <FaClock className="text-3xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Incomplete</p>
              <p className="text-2xl font-bold text-red-600">{dashboardStats.incomplete}</p>
            </div>
            <FaExclamationTriangle className="text-3xl text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Completion</p>
              <p className="text-2xl font-bold text-blue-600">{dashboardStats.averageCompletion}%</p>
            </div>
            <ProfileCompletionCircle percentage={dashboardStats.averageCompletion} size="sm" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search athletes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Completion Filter */}
          <select
            value={filterCompletion}
            onChange={(e) => setFilterCompletion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Completion</option>
            <option value="complete">Complete (80%+)</option>
            <option value="incomplete">Incomplete (&lt;80%)</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="full_name-asc">Name A-Z</option>
            <option value="full_name-desc">Name Z-A</option>
            <option value="profile_completion-desc">Completion High-Low</option>
            <option value="profile_completion-asc">Completion Low-High</option>
          </select>
        </div>
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAthletes.map((athlete) => (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Athlete Card Header */}
              <div className="relative">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="absolute -bottom-8 left-6">
                  <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-gray-100 flex items-center justify-center">
                    {athlete.profile_photo_url ? (
                      <img
                        src={athlete.profile_photo_url}
                        alt={athlete.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUser className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <ProfileCompletionCircle 
                    percentage={athlete.profile_completion} 
                    size="sm"
                  />
                </div>
              </div>

              {/* Athlete Card Body */}
              <div className="pt-10 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {athlete.full_name}
                  </h3>
                  <VerificationStatusBadge status={athlete.verification_status} />
                </div>

                <p className="text-sm text-gray-600 mb-1">ID: {athlete.athlete_id}</p>
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <FaSchool className="mr-2" />
                  <span className="truncate">{athlete.school_name || 'School not set'}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <FaIdCard className="mr-2" />
                  <span>Grade {athlete.grade}{athlete.section ? ` - ${athlete.section}` : ''}</span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600">Age</div>
                    <div className="font-medium">
                      {athlete.date_of_birth ? 
                        Math.floor((new Date() - new Date(athlete.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600">Sports</div>
                    <div className="font-medium">
                      {athlete.registered_sports ? JSON.parse(athlete.registered_sports).length : 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600">Docs</div>
                    <div className="font-medium flex items-center justify-center">
                      {athlete.birth_certificate_url && (
                        <FaCertificate className="text-green-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(athlete)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <FaEye />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => setEditingAthlete(athlete)}
                    className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <FaEdit />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAthlete(athlete.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAthletes.length === 0 && !loading && (
        <div className="text-center py-12">
          <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No athletes found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' || filterCompletion !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first athlete'
            }
          </p>
          {athletes.length === 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <FaPlus />
              <span>Add First Athlete</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Athlete Modal */}
      <AnimatePresence>
        {(showAddForm || editingAthlete) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <EnhancedAthleteForm
                onSubmit={editingAthlete ? handleEditAthlete : handleAddAthlete}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingAthlete(null);
                }}
                initialData={editingAthlete}
                isEdit={!!editingAthlete}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Athlete Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedAthlete && (
          <AthleteDetailModal
            athlete={selectedAthlete}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAthlete(null);
            }}
            onEdit={(athlete) => {
              setShowDetailModal(false);
              setEditingAthlete(athlete);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedGuardianDashboard;
