// src/components/AdminDashboard/StatsTab.js
import React from "react";
import { FaUsers, FaSchool, FaTrophy, FaChartBar, FaUserGraduate, FaCalendarAlt } from 'react-icons/fa';

export default function StatsTab({ summary, players, schools, tournaments }) {
  const calculateActivePlayersPercentage = () => {
    if (!players || players.length === 0) return 0;
    const activePlayers = players.filter(p => p.is_active || p.status === 'active').length;
    return Math.round((activePlayers / players.length) * 100);
  };

  const calculateRecentRegistrations = () => {
    if (!players || players.length === 0) return 0;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return players.filter(p => {
      const createdDate = new Date(p.created_at || p.date_registered);
      return createdDate >= oneMonthAgo;
    }).length;
  };

  const getTopSchools = () => {
    if (!schools || schools.length === 0) return [];
    
    const schoolPlayerCounts = schools.map(school => {
      const playerCount = players.filter(p => p.school_id === school.id).length;
      return {
        ...school,
        playerCount
      };
    });

    return schoolPlayerCounts
      .sort((a, b) => b.playerCount - a.playerCount)
      .slice(0, 5);
  };

  const statsCards = [
    {
      title: 'Total Players',
      value: summary.registeredPlayers,
      icon: FaUserGraduate,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Players',
      value: `${calculateActivePlayersPercentage()}%`,
      icon: FaUsers,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Schools',
      value: summary.schools,
      icon: FaSchool,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Tournaments',
      value: summary.tournaments,
      icon: FaTrophy,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Recent Registrations',
      value: calculateRecentRegistrations(),
      icon: FaCalendarAlt,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-athletiq-navy">Statistics & Analytics</h2>
        <span className="text-sm text-gray-500">Overview of system metrics</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Schools */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-athletiq-navy mb-4">Top Schools by Player Count</h3>
        <div className="space-y-3">
          {getTopSchools().map((school, index) => (
            <div key={school.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-athletiq-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{school.name}</p>
                  <p className="text-sm text-gray-500">{school.school_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-athletiq-navy">{school.playerCount}</p>
                <p className="text-sm text-gray-500">players</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-athletiq-navy mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-athletiq-green text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
              Generate Player Report
            </button>
            <button className="w-full bg-athletiq-navy text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
              Export School Data
            </button>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition">
              Tournament Analytics
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-athletiq-navy mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Data Completeness</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">85%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Users</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">System Performance</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">98%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
