// src/components/tournament/management/TournamentDetails.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaEdit, FaCog, FaUsers, FaTrophy, FaCalendarAlt, 
  FaMapMarkerAlt, FaChartLine, FaFileAlt, FaShare, FaDownload,
  FaEye, FaTrash, FaCopy, FaFlag, FaLock, FaUnlock, FaPlay, FaPause
} from 'react-icons/fa';
import BracketManager from '../bracket/BracketManager';
import ParticipantManagement from '../ParticipantManagement';
import TournamentScheduler from '../TournamentScheduler';
import TournamentSettings from '../TournamentSettings';
import AnalyticsDashboard from '../AnalyticsDashboard';
import LiveScoring from '../LiveScoring';
import VenueManagement from '../VenueManagement';
import TournamentDocuments from '../TournamentDocuments';

const TournamentDetails = ({ tournament, onBack, onUpdate, currentUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [tournamentData, setTournamentData] = useState(tournament);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaEye },
    { id: 'bracket', label: 'Bracket', icon: FaTrophy },
    { id: 'participants', label: 'Participants', icon: FaUsers },
    { id: 'schedule', label: 'Schedule', icon: FaCalendarAlt },
    { id: 'venues', label: 'Venues', icon: FaMapMarkerAlt },
    { id: 'scoring', label: 'Live Scoring', icon: FaPlay },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine },
    { id: 'documents', label: 'Documents', icon: FaFileAlt },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  const handleTournamentUpdate = (updates) => {
    const updatedTournament = { ...tournamentData, ...updates };
    setTournamentData(updatedTournament);
    if (onUpdate) {
      onUpdate(updatedTournament);
    }
  };

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
      case 'ongoing': return <FaPlay className="w-4 h-4" />;
      case 'completed': return <FaTrophy className="w-4 h-4" />;
      case 'cancelled': return <FaFlag className="w-4 h-4" />;
      default: return <FaEye className="w-4 h-4" />;
    }
  };

  const TournamentOverviewTab = () => (
    <div className="space-y-6">
      {/* Tournament Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FaTrophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tournamentData.name}</h1>
              <p className="text-gray-600 mt-1">{tournamentData.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournamentData.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(tournamentData.status)}
                    {tournamentData.status}
                  </div>
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(tournamentData.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FaShare className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FaDownload className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FaCopy className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaEdit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tournament Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                  <span>{new Date(tournamentData.start_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                  <span>{new Date(tournamentData.end_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                  <span>{tournamentData.location}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {tournamentData.level}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hosted By</label>
                <span>{tournamentData.hosted_by}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Code</label>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {tournamentData.code}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Teams</span>
                <span className="font-semibold">{tournamentData.teams?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Participants</span>
                <span className="font-semibold">{tournamentData.participants || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sports</span>
                <span className="font-semibold">{tournamentData.sports?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matches</span>
                <span className="font-semibold">{tournamentData.matches || 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FaUsers className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Team registered</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaEdit className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tournament updated</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaTrophy className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bracket generated</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sports Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournamentData.sports_config?.map((sport, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{sport.name}</h4>
                <span className="text-sm text-gray-500">{sport.format}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Teams</span>
                  <span>{sport.teams || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category</span>
                  <span>{sport.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender</span>
                  <span>{sport.gender}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TournamentOverviewTab />;
      case 'bracket':
        return <BracketManager tournament={tournamentData} onUpdate={handleTournamentUpdate} />;
      case 'participants':
        return <ParticipantManagement tournament={tournamentData} onUpdate={handleTournamentUpdate} />;
      case 'schedule':
        return <TournamentScheduler tournament={tournamentData} onUpdate={handleTournamentUpdate} />;
      case 'venues':
        return <VenueManagement tournament={tournamentData} onUpdate={handleTournamentUpdate} />;
      case 'scoring':
        return <LiveScoring tournament={tournamentData} onUpdate={handleTournamentUpdate} />;
      case 'analytics':
        return <AnalyticsDashboard tournament={tournamentData} />;
      case 'documents':
        return <TournamentDocuments tournament={tournamentData} onUpdate={handleTournamentUpdate} />;
      case 'settings':
        return <TournamentSettings tournament={tournamentData} onUpdate={handleTournamentUpdate} />;
      default:
        return <TournamentOverviewTab />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tournament-details"
    >
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{tournamentData.name}</h1>
              <p className="text-gray-600">{tournamentData.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournamentData.status)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(tournamentData.status)}
                {tournamentData.status}
              </div>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </motion.div>
  );
};

export default TournamentDetails;
