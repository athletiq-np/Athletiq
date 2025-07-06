// src/components/features/school/TournamentManagement.jsx
import React from 'react';
import { FaTrophy, FaPlus, FaCalendarAlt, FaEye, FaEdit, FaUsers } from 'react-icons/fa';

export default function TournamentManagement({ tournaments, school, onRefresh }) {
  const mockTournaments = [
    { id: 1, name: 'Inter-House Football', type: 'Intra-school', status: 'Active', participants: 64, startDate: '2024-01-15', endDate: '2024-01-20' },
    { id: 2, name: 'District Basketball Championship', type: 'Inter-school', status: 'Registered', participants: 12, startDate: '2024-02-01', endDate: '2024-02-05' },
    { id: 3, name: 'Annual Sports Day', type: 'Intra-school', status: 'Completed', participants: 200, startDate: '2023-12-10', endDate: '2023-12-12' },
  ];

  const displayTournaments = tournaments.length > 0 ? tournaments : mockTournaments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tournament Management</h2>
          <p className="text-gray-600">Organize and participate in tournaments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
            <FaPlus className="h-4 w-4" />
            <span>Join Tournament</span>
          </button>
          <button className="bg-athletiq-blue text-white px-4 py-2 rounded-lg hover:bg-athletiq-navy transition-colors flex items-center space-x-2">
            <FaCalendarAlt className="h-4 w-4" />
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTournaments.map((tournament) => (
          <div key={tournament.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <FaTrophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                    <p className="text-sm text-gray-500">{tournament.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tournament.status === 'Active' ? 'bg-green-100 text-green-800' :
                  tournament.status === 'Registered' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tournament.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium">{tournament.participants}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{tournament.startDate} - {tournament.endDate}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="flex-1 bg-athletiq-blue text-white px-3 py-2 rounded text-sm hover:bg-athletiq-navy">
                  <FaEye className="h-4 w-4 inline mr-1" />
                  View Details
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  <FaEdit className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
