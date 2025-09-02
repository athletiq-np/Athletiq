import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaChartLine,
  FaUsers,
  FaSchool,
  FaTrophy,
  FaCalendarAlt,
  FaDownload,
  FaFilter,
  FaRefresh,
  FaExpand,
  FaArrowUp,
  FaArrowDown,
  FaEye
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';

/**
 * 📊 Advanced Analytics Dashboard
 * Comprehensive analytics and reporting system
 * 
 * Features:
 * - Real-time metrics and KPIs
 * - Interactive charts and visualizations
 * - Custom date range filtering
 * - Export functionality (PDF, Excel, CSV)
 * - Drill-down analytics
 * - Performance comparisons
 * - Trend analysis
 * - User engagement metrics
 * - Tournament participation stats
 * - School performance analytics
 */
export default function AdvancedAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customDateRange, setCustomDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [analytics, setAnalytics] = useState({
    overview: {},
    userGrowth: [],
    registrationTrends: [],
    tournamentStats: [],
    schoolPerformance: [],
    engagementMetrics: {},
    geographicData: []
  });
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [compareMode, setCompareMode] = useState(false);

  // Color schemes for charts
  const colors = {
    primary: '#2563eb',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  const chartColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.danger,
    colors.purple,
    colors.pink
  ];

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, customDateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        range: dateRange,
        ...(dateRange === 'custom' && {
          start_date: customDateRange.start,
          end_date: customDateRange.end
        })
      };

      const response = await apiClient.get('/analytics/dashboard', { params });
      setAnalytics(response.data);
      
      logger.info('Analytics loaded', { range: dateRange, dataPoints: Object.keys(response.data).length });

    } catch (error) {
      logger.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      logger.info('Exporting analytics', { format, range: dateRange });
      
      const response = await apiClient.post('/analytics/export', {
        format,
        range: dateRange,
        ...(dateRange === 'custom' && {
          start_date: customDateRange.start,
          end_date: customDateRange.end
        }),
        metrics: [selectedMetric]
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `athletiq-analytics-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      logger.error('Export failed', error);
    }
  };

  const renderKPICard = (title, value, change, icon, color) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? <FaArrowUp className="w-3 h-3 mr-1" /> : <FaArrowDown className="w-3 h-3 mr-1" />}
              <span>{Math.abs(change)}% from last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}>
          {React.createElement(icon, { className: `w-6 h-6 text-${color}-600` })}
        </div>
      </div>
    </motion.div>
  );

  const renderChart = (type, data, title, height = 300) => {
    const chartProps = {
      data,
      height,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2} dot={{ fill: colors.primary }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="value" stroke={colors.secondary} fill={colors.secondary} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-athletiq-blue border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={loadAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaRefresh className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center space-x-2 px-4 py-2 bg-athletiq-blue text-white rounded-lg hover:bg-athletiq-blue/90 transition-colors"
          >
            <FaDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderKPICard(
          'Total Users',
          analytics.overview.totalUsers?.toLocaleString() || '0',
          analytics.overview.userGrowth,
          FaUsers,
          'blue'
        )}
        {renderKPICard(
          'Active Schools',
          analytics.overview.totalSchools?.toLocaleString() || '0',
          analytics.overview.schoolGrowth,
          FaSchool,
          'green'
        )}
        {renderKPICard(
          'Tournaments',
          analytics.overview.totalTournaments?.toLocaleString() || '0',
          analytics.overview.tournamentGrowth,
          FaTrophy,
          'yellow'
        )}
        {renderKPICard(
          'Events',
          analytics.overview.totalEvents?.toLocaleString() || '0',
          analytics.overview.eventGrowth,
          FaCalendarAlt,
          'purple'
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Growth Trend</h3>
            <button className="p-1 rounded hover:bg-gray-100">
              <FaExpand className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {renderChart('line', analytics.userGrowth, 'User Growth', 250)}
        </div>

        {/* Registration Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Registration Distribution</h3>
            <button className="p-1 rounded hover:bg-gray-100">
              <FaExpand className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {renderChart('pie', analytics.registrationTrends, 'Registrations', 250)}
        </div>

        {/* Tournament Participation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tournament Participation</h3>
            <button className="p-1 rounded hover:bg-gray-100">
              <FaExpand className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {renderChart('bar', analytics.tournamentStats, 'Tournaments', 250)}
        </div>

        {/* School Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">School Performance</h3>
            <button className="p-1 rounded hover:bg-gray-100">
              <FaExpand className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {renderChart('area', analytics.schoolPerformance, 'Schools', 250)}
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { metric: 'Page Views', current: '125,430', previous: '98,234', change: 27.6 },
                { metric: 'User Sessions', current: '45,672', previous: '38,901', change: 17.4 },
                { metric: 'Bounce Rate', current: '23.4%', previous: '28.7%', change: -18.5 },
                { metric: 'Avg. Session Duration', current: '4m 32s', previous: '3m 47s', change: 19.9 },
                { metric: 'New Registrations', current: '1,234', previous: '987', change: 25.0 }
              ].map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.metric}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.current}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.previous}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`flex items-center ${
                      row.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {row.change >= 0 ? <FaArrowUp className="w-3 h-3 mr-1" /> : <FaArrowDown className="w-3 h-3 mr-1" />}
                      {Math.abs(row.change)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-athletiq-blue hover:text-athletiq-blue/80 transition-colors">
                      <FaEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
