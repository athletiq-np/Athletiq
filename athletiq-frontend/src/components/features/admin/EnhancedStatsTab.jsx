// src/components/AdminDashboard/StatsTab.js
import React from "react";
import { FaUsers, FaSchool, FaTrophy, FaChartBar, FaUserGraduate, FaCalendarAlt, FaGraduationCap, FaUserShield } from 'react-icons/fa';
import { MdVerified, MdPending, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

export default function StatsTab({ summary, players, schools, tournaments, organizations, guardians, analytics }) {
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

  // Enhanced stats using analytics data
  const getAnalyticsStats = () => {
    if (!analytics) return null;
    
    return {
      totalEntities: analytics.overview?.total_athletes + analytics.overview?.total_schools + 
                    analytics.overview?.total_organizations + analytics.overview?.total_guardians || 0,
      athleteGrowthRate: analytics.athletes?.growth_rate || 0,
      verificationRates: {
        schools: analytics.schools?.verification_rate || 0,
        organizations: analytics.organizations?.verification_rate || 0,
        guardians: analytics.guardians?.verification_rate || 0
      },
      activityRates: {
        athletes: analytics.athletes?.activity_rate || 0
      },
      recentActivity: analytics.activity || {}
    };
  };

  const analyticsStats = getAnalyticsStats();

  const enhancedStatsCards = [
    // Core metrics
    {
      title: 'Total Athletes',
      value: analytics?.overview?.total_athletes || summary.registeredPlayers || players?.length || 0,
      icon: FaUserGraduate,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      trend: analyticsStats?.athleteGrowthRate || 0,
      subtitle: `${analyticsStats?.athleteGrowthRate > 0 ? '+' : ''}${analyticsStats?.athleteGrowthRate}% this month`
    },
    {
      title: 'Active Athletes',
      value: `${analyticsStats?.activityRates?.athletes || calculateActivePlayersPercentage()}%`,
      icon: FaUsers,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      subtitle: 'Activity rate'
    },
    {
      title: 'Total Schools',
      value: analytics?.overview?.total_schools || summary.schools || schools?.length || 0,
      icon: FaSchool,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      subtitle: `${analyticsStats?.verificationRates?.schools || 0}% verified`
    },
    {
      title: 'Organizations',
      value: analytics?.overview?.total_organizations || organizations?.length || 0,
      icon: FaGraduationCap,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      subtitle: `${analyticsStats?.verificationRates?.organizations || 0}% verified`
    },
    {
      title: 'Guardians',
      value: analytics?.overview?.total_guardians || guardians?.length || 0,
      icon: FaUserShield,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
      subtitle: `${analyticsStats?.verificationRates?.guardians || 0}% verified`
    },
    {
      title: 'Tournaments',
      value: analytics?.overview?.total_tournaments || summary.tournaments || tournaments?.length || 0,
      icon: FaTrophy,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      subtitle: `${analytics?.tournaments?.active || 0} active`
    },
    {
      title: 'Recent Activity',
      value: calculateRecentRegistrations(),
      icon: FaCalendarAlt,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      subtitle: 'New registrations this month'
    },
    {
      title: 'System Health',
      value: analytics ? 'Healthy' : 'Limited',
      icon: FaChartBar,
      color: analytics ? 'bg-green-500' : 'bg-orange-500',
      textColor: analytics ? 'text-green-600' : 'text-orange-600',
      subtitle: analytics ? 'All systems operational' : 'Analytics unavailable'
    }
  ];

  const recentActivityData = analyticsStats?.recentActivity || {};

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <FaChartBar className="text-3xl text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            System Analytics & Statistics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive overview of platform performance and metrics
          </p>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {enhancedStatsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="text-2xl text-white" />
              </div>
              {stat.trend !== undefined && (
                <div className={`flex items-center text-sm ${stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                  <span className="ml-1">{Math.abs(stat.trend)}%</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {stat.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Sections */}
      {analytics && (
        <>
          {/* Weekly Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activity (This Week)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {recentActivityData.athletes_registered_this_week || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Athletes Registered</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {recentActivityData.schools_joined_this_week || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Schools Joined</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {recentActivityData.tournaments_created_this_week || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tournaments Created</div>
              </div>
            </div>
          </div>

          {/* Demographics */}
          {analytics.demographics && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Demographics & Distribution
              </h3>
              
              {/* Age Groups */}
              {analytics.demographics.age_groups && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Age Distribution
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics.demographics.age_groups).map(([ageGroup, count]) => (
                      <div key={ageGroup} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {ageGroup.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Cities */}
              {analytics.demographics.city_distribution && analytics.demographics.city_distribution.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Top Cities
                  </h4>
                  <div className="space-y-2">
                    {analytics.demographics.city_distribution.slice(0, 5).map((city, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-gray-900 dark:text-white">
                          {city.city || 'Unknown'}
                        </span>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">
                          {city.count} athletes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Legacy sections for when analytics is not available */}
      {!analytics && (
        <>
          {/* Top Schools */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Top Performing Schools
            </h3>
            <div className="space-y-3">
              {getTopSchools().map((school, index) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {school.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {school.district || 'Unknown District'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {school.playerCount}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      athletes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              System Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Registration Trends
                </h4>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {calculateRecentRegistrations()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  new athletes this month
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Active Rate
                </h4>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {calculateActivePlayersPercentage()}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  of athletes are active
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {analytics ? (
          <>Last updated: {new Date(analytics.generated_at).toLocaleString()}</>
        ) : (
          <>Statistics calculated from available data • Limited analytics mode</>
        )}
      </div>
    </div>
  );
}