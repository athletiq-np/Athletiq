// src/components/features/guardian/GuardianDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBriefcase,
  FaGraduationCap, FaUserFriends, FaTrophy, FaCalendarAlt,
  FaFileAlt, FaCamera, FaEdit, FaSave, FaTimes, FaCheckCircle,
  FaEye, FaDownload, FaPrint, FaBell, FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';

export default function GuardianDashboard() {
  const [profile, setProfile] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get guardian profile (from localStorage or API)
      const guardianId = localStorage.getItem('guardianId');
      if (!guardianId) {
        toast.error('Guardian session not found');
        return;
      }

      // Fetch guardian profile
      const profileResponse = await apiClient.get(`/guardian/profile/${guardianId}`);
      setProfile(profileResponse.data.profile);
      setAthlete(profileResponse.data.athlete);
      
      // Fetch athlete's tournaments
      const tournamentsResponse = await apiClient.get(`/athletes/${profileResponse.data.athlete.id}/tournaments`);
      setTournaments(tournamentsResponse.data.tournaments || []);
      
      // Fetch notifications
      const notificationsResponse = await apiClient.get(`/guardian/notifications/${guardianId}`);
      setNotifications(notificationsResponse.data.notifications || []);
      
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setFormData({ ...profile });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      await apiClient.put(`/guardian/profile/${profile.id}`, formData);
      setProfile({ ...profile, ...formData });
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Guardian Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Guardian Dashboard</h1>
              <p className="text-gray-600">Manage your child's sports activities</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaBell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaCog className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Athlete Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Guardian Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Guardian Profile</h2>
                <button
                  onClick={editing ? handleSaveProfile : handleEditProfile}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    editing 
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {editing ? <><FaSave className="inline mr-2" />Save</> : <><FaEdit className="inline mr-2" />Edit</>}
                </button>
              </div>

              {profile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.full_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 flex items-center">
                        <FaPhone className="mr-2 text-blue-600" />{profile.phone}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    {editing ? (
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 flex items-center">
                        <FaEnvelope className="mr-2 text-blue-600" />{profile.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Relationship</label>
                    <p className="mt-1 text-gray-900 flex items-center">
                      <FaUserFriends className="mr-2 text-blue-600" />{profile.relationship}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    {editing ? (
                      <textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 flex items-start">
                        <FaMapMarkerAlt className="mr-2 mt-1 text-blue-600" />{profile.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Athlete Information */}
            {athlete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">My Child - {athlete.full_name}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FaGraduationCap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="text-lg font-semibold text-gray-900">{athlete.grade}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <FaUser className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="text-lg font-semibold text-gray-900">{athlete.gender}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <FaTrophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Tournaments</p>
                    <p className="text-lg font-semibold text-gray-900">{tournaments.length}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tournaments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tournament Participation</h2>
              
              {tournaments.length > 0 ? (
                <div className="space-y-4">
                  {tournaments.map((tournament, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <FaCalendarAlt className="mr-2" />
                            {tournament.start_date} - {tournament.end_date}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{tournament.sport}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                            tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tournament.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaTrophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tournament participation yet</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Quick Actions & Notifications */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <FaFileAlt className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium">View Documents</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <FaCamera className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium">Upload Photos</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <FaDownload className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium">Download Reports</span>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
              
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.created_at}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaBell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No new notifications</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
