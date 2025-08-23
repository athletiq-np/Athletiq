import React, { useEffect, useState } from "react";
import apiClient from "@/utils/apiClient";
import { useNavigate, useParams } from "react-router-dom";

const AthleteProfile = () => {
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        // If no ID, try to get current athlete's profile
        const endpoint = id ? `/athletes/${id}` : "/athletes/me";
        const res = await apiClient.get(endpoint);
        setAthlete(res.data.athlete);
      } catch (err) {
        setError("Failed to load profile: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchAthlete();
  }, [id]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Loading athlete profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error Loading Profile</h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => navigate('/athletes')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Athletes List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-200">Athlete not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Athlete Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Complete athlete information and records</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/athletes')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Back to List
            </button>
            {!id && (
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200" 
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-center">
                <img
                  src={athlete.profile_photo_url ? `/uploads/athletes/${athlete.profile_photo_url}` : "/default-avatar.png"}
                  alt={athlete.full_name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gray-200 dark:border-gray-600"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{athlete.full_name}</h2>
                {athlete.full_name_nep && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{athlete.full_name_nep}</p>
                )}
                
                {/* Athlete Code Highlight */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Athlete Code</div>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 font-mono">
                    {athlete.athlete_id || athlete.player_code || 'Not Assigned'}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    athlete.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {athlete.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {athlete.eligibility_status && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      {athlete.eligibility_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date of Birth</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.date_of_birth ? new Date(athlete.date_of_birth).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Gender</label>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {athlete.gender || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nationality</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.nationality || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">District</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.district || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Physical Information */}
            {(athlete.height_cm || athlete.weight_kg) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Physical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {athlete.height_cm && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Height</label>
                      <p className="text-gray-900 dark:text-white">{athlete.height_cm} cm</p>
                    </div>
                  )}
                  {athlete.weight_kg && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Weight</label>
                      <p className="text-gray-900 dark:text-white">{athlete.weight_kg} kg</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sports Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sports Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Main Sport</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.main_sport || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">School</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.school_name || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Guardian Name</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.guardian_name || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Guardian Phone</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.guardian_phone || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Registration Date</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.created_at ? new Date(athlete.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Updated</label>
                  <p className="text-gray-900 dark:text-white">
                    {athlete.updated_at ? new Date(athlete.updated_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfile;
