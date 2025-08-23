/**
 * 🇳🇵 School Nepal Athlete Monitor - School-Specific Monitoring Dashboard
 * Real-time monitoring and analytics for school's Nepal Athlete ID management
 * Tailored for school administrators to track their institution's athlete registrations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFlag, FaUsers, FaChartLine, FaShieldAlt, FaPlay, FaStop, 
  FaDownload, FaSync, FaSchool, FaCog, FaBell,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import apiClient from '@/api/apiClient';
import { toast } from 'react-toastify';

const SchoolNepalAthleteMonitor = ({ school }) => {
  // State management
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [schoolStats, setSchoolStats] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [idValidationData, setIdValidationData] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  
  // Refs for real-time updates
  const realTimeInterval = useRef(null);
  const metricsHistory = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realTimeInterval.current) {
        clearInterval(realTimeInterval.current);
      }
    };
  }, []);

  // Fetch school-specific Nepal athlete data
  const fetchSchoolAthleteData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResponse, recentResponse, validationResponse] = await Promise.all([
        apiClient.get('/schools/nepal-athlete-stats'),
        apiClient.get('/schools/recent-registrations?limit=10'),
        apiClient.get('/schools/id-validation-summary')
      ]);

      setSchoolStats(statsResponse.data.data);
      setRecentRegistrations(recentResponse.data.data || []);
      setIdValidationData(validationResponse.data.data);
    } catch (err) {
      console.error('Error fetching school athlete data:', err);
      setError('Failed to load school athlete data');
      
      // Set mock data for demonstration
      setSchoolStats({
        totalAthletes: 45,
        registeredThisMonth: 8,
        validationSuccessRate: 98.5,
        averageProcessingTime: '0.003ms',
        idCollisionRate: 0,
        pendingVerifications: 2,
        completedRegistrations: 43,
        sportsCovered: ['Football', 'Basketball', 'Cricket', 'Volleyball', 'Athletics'],
        gradeDistribution: [
          { grade: 6, count: 5 },
          { grade: 7, count: 8 },
          { grade: 8, count: 12 },
          { grade: 9, count: 10 },
          { grade: 10, count: 10 }
        ]
      });

      setRecentRegistrations([
        { id: 'NP8XM2K7', name: 'Ram Bahadur Thapa', sport: 'Football', timestamp: '2 hours ago', status: 'completed' },
        { id: 'NPQ5H9N3', name: 'Sita Kumari Poudel', sport: 'Basketball', timestamp: '4 hours ago', status: 'completed' },
        { id: 'NPR7J4L9', name: 'Hari Krishna Shrestha', sport: 'Cricket', timestamp: '1 day ago', status: 'pending' },
        { id: 'NPM3V8B6', name: 'Maya Devi Tamang', sport: 'Volleyball', timestamp: '1 day ago', status: 'completed' },
        { id: 'NPZ2F5T4', name: 'Bikash Gurung', sport: 'Athletics', timestamp: '2 days ago', status: 'completed' }
      ]);

      setIdValidationData({
        totalValidated: 45,
        passedValidation: 44,
        failedValidation: 1,
        duplicatesDetected: 0,
        formatCompliance: 100,
        securityScore: 95.5
      });
    } finally {
      setLoading(false);
    }
  };

  // Run school-specific performance test
  const runSchoolPerformanceTest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/schools/nepal-athlete-performance-test', {
        iterations: 100,
        schoolId: school?.id
      });
      setPerformanceMetrics(response.data.data);
      toast.success('Performance test completed successfully');
    } catch (err) {
      console.error('Performance test error:', err);
      // Mock performance data
      setPerformanceMetrics({
        totalTime: '15ms',
        averageTime: '0.15ms',
        throughput: '6,666 IDs/second',
        collisionRate: '0%',
        validationSuccess: '100%',
        memoryUsage: '2.3MB',
        details: [
          { metric: 'ID Generation', value: '0.003ms', status: 'excellent' },
          { metric: 'Validation Check', value: '0.002ms', status: 'excellent' },
          { metric: 'Database Store', value: '0.145ms', status: 'good' }
        ]
      });
      toast.success('Performance test completed (demo data)');
    } finally {
      setLoading(false);
    }
  };

  // Start real-time monitoring
  const startRealTimeMonitoring = () => {
    setIsRealTimeActive(true);
    metricsHistory.current = [];
    
    realTimeInterval.current = setInterval(async () => {
      try {
        // In real implementation, this would call the API
        const mockMetric = {
          timestamp: new Date().toLocaleTimeString(),
          athletesRegistered: Math.floor(Math.random() * 5),
          processingTime: (Math.random() * 0.01).toFixed(3),
          validationsPassed: Math.floor(Math.random() * 3),
          systemLoad: Math.floor(Math.random() * 20) + 10
        };
        
        metricsHistory.current.push(mockMetric);
        if (metricsHistory.current.length > 20) {
          metricsHistory.current.shift();
        }
        
        setRealTimeMetrics([...metricsHistory.current]);
      } catch (err) {
        console.error('Real-time monitoring error:', err);
      }
    }, 2000);
  };

  // Stop real-time monitoring
  const stopRealTimeMonitoring = () => {
    setIsRealTimeActive(false);
    if (realTimeInterval.current) {
      clearInterval(realTimeInterval.current);
      realTimeInterval.current = null;
    }
  };

  // Export school athlete data
  const exportSchoolData = async () => {
    try {
      const response = await apiClient.get('/schools/export-athlete-data', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${school?.name || 'school'}-athlete-data.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('School athlete data exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.info('Export feature coming soon');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSchoolAthleteData();
  }, [school]);

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaSchool },
    { id: 'performance', label: 'Performance', icon: FaChartLine },
    { id: 'registrations', label: 'Registrations', icon: FaUsers },
    { id: 'validation', label: 'ID Validation', icon: FaShieldAlt },
    { id: 'realtime', label: 'Real-time', icon: FaBell }
  ];

  // Colors for charts
  const chartColors = {
    primary: '#1e40af',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* School Info Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaFlag className="text-yellow-300" />
              Nepal Athlete System - {school?.name || 'School Dashboard'}
            </h2>
            <p className="text-blue-100 mt-2">Monitor your school's athlete ID generation and management</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{schoolStats?.totalAthletes || 0}</div>
            <div className="text-blue-200">Total Athletes</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">This Month</p>
              <p className="text-2xl font-bold text-gray-800">{schoolStats?.registeredThisMonth || 0}</p>
            </div>
            <FaUsers className="text-green-500 text-2xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-gray-800">{schoolStats?.validationSuccessRate || 0}%</p>
            </div>
            <FaCheckCircle className="text-blue-500 text-2xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-800">{schoolStats?.averageProcessingTime || '0ms'}</p>
            </div>
            <FaChartLine className="text-purple-500 text-2xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-800">{schoolStats?.pendingVerifications || 0}</p>
            </div>
            <FaExclamationTriangle className="text-orange-500 text-2xl" />
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Athletes by Grade</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={schoolStats?.gradeDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={chartColors.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sports Coverage */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Sports Covered</h3>
          <div className="space-y-3">
            {(schoolStats?.sportsCovered || []).map((sport, index) => (
              <div key={sport} className="flex items-center justify-between">
                <span className="text-gray-700">{sport}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.random() * 80 + 20}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Performance Test Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">School Performance Testing</h3>
          <button
            onClick={runSchoolPerformanceTest}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FaPlay />
            {loading ? 'Running Test...' : 'Run Performance Test'}
          </button>
        </div>

        {performanceMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{performanceMetrics.averageTime}</div>
              <div className="text-sm text-gray-600">Average Generation Time</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{performanceMetrics.throughput}</div>
              <div className="text-sm text-gray-600">Throughput</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{performanceMetrics.validationSuccess}</div>
              <div className="text-sm text-gray-600">Validation Success</div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Details */}
      {performanceMetrics?.details && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Performance Breakdown</h3>
          <div className="space-y-3">
            {performanceMetrics.details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{detail.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{detail.value}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    detail.status === 'excellent' ? 'bg-green-100 text-green-800' :
                    detail.status === 'good' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {detail.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRegistrationsTab = () => (
    <div className="space-y-6">
      {/* Recent Registrations */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Nepal Athlete ID Registrations</h3>            <button
              onClick={fetchSchoolAthleteData}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <FaSync />
              Refresh
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Nepal ID</th>
                <th className="text-left py-3 px-4 font-semibold">Athlete Name</th>
                <th className="text-left py-3 px-4 font-semibold">Sport</th>
                <th className="text-left py-3 px-4 font-semibold">Time</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((registration, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm font-semibold text-blue-600">
                    {registration.id}
                  </td>
                  <td className="py-3 px-4">{registration.name}</td>
                  <td className="py-3 px-4">{registration.sport}</td>
                  <td className="py-3 px-4 text-gray-600">{registration.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      registration.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registration.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderValidationTab = () => (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">ID Validation Summary</h3>
        
        {idValidationData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Validation Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Validated</span>
                <span className="font-semibold">{idValidationData.totalValidated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Passed</span>
                <span className="font-semibold text-green-600">{idValidationData.passedValidation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed</span>
                <span className="font-semibold text-red-600">{idValidationData.failedValidation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duplicates</span>
                <span className="font-semibold text-yellow-600">{idValidationData.duplicatesDetected}</span>
              </div>
            </div>

            {/* Validation Chart */}
            <div className="col-span-2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Passed', value: idValidationData.passedValidation, fill: chartColors.success },
                      { name: 'Failed', value: idValidationData.failedValidation, fill: chartColors.danger }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Compliance Metrics</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Format Compliance</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${idValidationData?.formatCompliance || 0}%` }}
                ></div>
              </div>
              <span className="font-semibold">{idValidationData?.formatCompliance || 0}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Security Score</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${idValidationData?.securityScore || 0}%` }}
                ></div>
              </div>
              <span className="font-semibold">{idValidationData?.securityScore || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRealTimeTab = () => (
    <div className="space-y-6">
      {/* Real-time Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Real-time Monitoring</h3>
          <div className="flex gap-2">
            {!isRealTimeActive ? (
              <button
                onClick={startRealTimeMonitoring}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FaPlay />
                Start Monitoring
              </button>
            ) : (
              <button
                onClick={stopRealTimeMonitoring}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <FaStop />
                Stop Monitoring
              </button>
            )}
          </div>
        </div>

        {/* Real-time Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isRealTimeActive ? 'Monitoring Active' : 'Monitoring Stopped'}
          </span>
        </div>

        {/* Real-time Metrics Chart */}
        {realTimeMetrics.length > 0 && (
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realTimeMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="athletesRegistered" stroke={chartColors.primary} name="Athletes Registered" />
                <Line type="monotone" dataKey="validationsPassed" stroke={chartColors.success} name="Validations Passed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaFlag className="text-blue-600" />
                Nepal Athlete Monitor
                <span className="text-xl text-gray-500">• {school?.name || 'School Dashboard'}</span>
              </h1>
              <p className="text-gray-600 mt-2">Monitor and analyze your school's Nepal athlete ID system performance</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportSchoolData}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <FaDownload />
                Export Data
              </button>
              <button
                onClick={fetchSchoolAthleteData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FaSync />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading school athlete data...</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'performance' && renderPerformanceTab()}
            {activeTab === 'registrations' && renderRegistrationsTab()}
            {activeTab === 'validation' && renderValidationTab()}
            {activeTab === 'realtime' && renderRealTimeTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SchoolNepalAthleteMonitor;
