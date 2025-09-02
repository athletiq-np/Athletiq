import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRobot,
  FaChartLine,
  FaUsers,
  FaTrophy,
  FaCalendarAlt,
  FaBrain,
  FaEye,
  FaHeart,
  FaComment,
  FaShare,
  FaDownload,
  FaPlay,
  FaPause,
  FaRefresh,
  FaFilter,
  FaSort,
  FaCog,
  FaInfoCircle,
  FaLightbulb,
  FaTarget,
  FaPredictions
} from 'react-icons/fa';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { usePWA } from '../../hooks/usePWA';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * 🤖 AI-Powered Analytics Dashboard
 * Advanced analytics with machine learning insights and predictions
 * 
 * Features:
 * - Real-time data analytics and visualization
 * - AI-powered predictions and insights
 * - Performance analysis and player insights
 * - Tournament success probability modeling
 * - Social engagement analytics
 * - Automated report generation
 * - Custom AI model training
 * - Predictive modeling for match outcomes
 * - Player performance optimization suggestions
 * - Fan engagement pattern analysis
 */
export default function AIAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [modelStatus, setModelStatus] = useState(null);
  const [customQueries, setCustomQueries] = useState([]);
  
  const { isOnline, cacheData, getCachedData } = usePWA();

  // Analytics tabs
  const analyticsTabs = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'predictions', label: 'AI Predictions', icon: FaBrain },
    { id: 'performance', label: 'Performance', icon: FaTrophy },
    { id: 'engagement', label: 'Engagement', icon: FaUsers },
    { id: 'insights', label: 'Insights', icon: FaLightbulb },
    { id: 'models', label: 'AI Models', icon: FaRobot }
  ];

  // Time range options
  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ];

  useEffect(() => {
    loadAnalyticsData();
    loadAIModels();
    
    // Set up auto-refresh
    let refreshInterval;
    if (autoRefresh && isOnline) {
      refreshInterval = setInterval(() => {
        loadAnalyticsData();
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [timeRange, autoRefresh, isOnline]);

  const loadAnalyticsData = async () => {
    try {
      // Load cached data first
      const cacheKey = `analytics_${activeTab}_${timeRange}`;
      const cached = await getCachedData(cacheKey);
      if (cached) {
        setAnalyticsData(cached);
        setLoading(false);
      }

      if (isOnline) {
        const response = await apiClient.get('/analytics/dashboard', {
          params: {
            tab: activeTab,
            time_range: timeRange,
            include_ai: true
          }
        });
        
        const data = response.data;
        setAnalyticsData(data);
        
        if (data.predictions) {
          setPredictions(data.predictions);
        }
        
        if (data.insights) {
          setInsights(data.insights);
        }
        
        // Cache the data
        await cacheData(cacheKey, data);
        
        logger.info('Analytics data loaded', { tab: activeTab, timeRange });
      }
    } catch (error) {
      logger.error('Failed to load analytics data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIModels = async () => {
    try {
      if (isOnline) {
        const response = await apiClient.get('/ai/models/status');
        setModelStatus(response.data);
      }
    } catch (error) {
      logger.error('Failed to load AI model status', error);
    }
  };

  const generateAIInsight = async (query) => {
    try {
      if (!isOnline) return;
      
      setLoading(true);
      const response = await apiClient.post('/ai/generate-insight', {
        query,
        context: activeTab,
        time_range: timeRange
      });
      
      const insight = response.data.insight;
      setInsights(prev => [insight, ...prev.slice(0, 4)]); // Keep last 5 insights
      
      return insight;
    } catch (error) {
      logger.error('Failed to generate AI insight', error);
    } finally {
      setLoading(false);
    }
  };

  const trainCustomModel = async (modelConfig) => {
    try {
      if (!isOnline) return;
      
      const response = await apiClient.post('/ai/models/train', modelConfig);
      
      logger.info('Custom model training started', { modelId: response.data.model_id });
      
      // Refresh model status
      await loadAIModels();
      
      return response.data;
    } catch (error) {
      logger.error('Failed to start model training', error);
    }
  };

  const exportAnalytics = async (format = 'pdf') => {
    try {
      if (!isOnline) return;
      
      const response = await apiClient.post('/analytics/export', {
        tab: activeTab,
        time_range: timeRange,
        format,
        include_ai_insights: true
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `athletiq-analytics-${activeTab}-${timeRange}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      logger.info('Analytics exported', { tab: activeTab, format });
    } catch (error) {
      logger.error('Failed to export analytics', error);
    }
  };

  // Chart configurations
  const getChartOptions = (type) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: '#3B82F6',
          borderWidth: 1,
        },
      },
      scales: type !== 'doughnut' ? {
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      } : undefined,
    };
    
    return baseOptions;
  };

  const renderOverviewTab = () => {
    if (!analyticsData?.overview) return null;
    
    const { overview } = analyticsData;
    
    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overview.metrics?.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  {metric.change && (
                    <p className={`text-sm mt-1 ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.color || 'bg-blue-50'}`}>
                  <metric.icon className={`w-6 h-6 ${metric.iconColor || 'text-blue-500'}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {overview.charts?.map((chart, index) => (
            <motion.div
              key={chart.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{chart.title}</h3>
              <div className="h-64">
                {chart.type === 'line' && (
                  <Line data={chart.data} options={getChartOptions('line')} />
                )}
                {chart.type === 'bar' && (
                  <Bar data={chart.data} options={getChartOptions('bar')} />
                )}
                {chart.type === 'doughnut' && (
                  <Doughnut data={chart.data} options={getChartOptions('doughnut')} />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderPredictionsTab = () => {
    return (
      <div className="space-y-6">
        {/* AI Model Status */}
        {modelStatus && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Model Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  modelStatus.status === 'active' ? 'bg-green-500' : 
                  modelStatus.status === 'training' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 capitalize">{modelStatus.status}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-xl font-bold text-gray-900">{modelStatus.accuracy}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Predictions Made</p>
                <p className="text-xl font-bold text-gray-900">{modelStatus.predictions_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm text-gray-600">{modelStatus.last_updated}</p>
              </div>
            </div>
          </div>
        )}

        {/* Predictions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">{prediction.title}</h4>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  prediction.confidence > 80 ? 'bg-green-100 text-green-700' :
                  prediction.confidence > 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {prediction.confidence}% confidence
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{prediction.description}</p>
              
              <div className="space-y-2">
                {prediction.outcomes?.map((outcome, outcomeIndex) => (
                  <div key={outcomeIndex} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{outcome.label}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-athletiq-blue h-2 rounded-full" 
                          style={{ width: `${outcome.probability}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{outcome.probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom AI Query */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask AI</h3>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Ask the AI to analyze data or make predictions..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  generateAIInsight(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder*="Ask the AI"]');
                if (input.value.trim()) {
                  generateAIInsight(input.value);
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-athletiq-blue text-white rounded-lg hover:bg-athletiq-blue-dark transition-colors"
            >
              Ask AI
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInsightsTab = () => {
    return (
      <div className="space-y-6">
        {/* AI Insights */}
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <FaBrain className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {insight.impact} impact
                      </span>
                      <span className="text-xs text-gray-500">{insight.timestamp}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{insight.description}</p>
                  
                  {insight.recommendations && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">Recommendations:</h5>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start space-x-2">
                            <FaTarget className="w-4 h-4 text-athletiq-blue mt-0.5" />
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insight.data_points && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {insight.data_points.map((point, pointIndex) => (
                        <div key={pointIndex} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">{point.label}</p>
                          <p className="text-lg font-bold text-gray-900">{point.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'Tournament performance trends',
            'Player improvement areas',
            'Fan engagement patterns',
            'Revenue optimization opportunities',
            'Injury risk assessment',
            'Match outcome predictions'
          ].map((topic, index) => (
            <button
              key={topic}
              onClick={() => generateAIInsight(topic)}
              className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <FaLightbulb className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">{topic}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <FaRobot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Analytics</h1>
                <p className="text-sm text-gray-600">Powered by machine learning</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              
              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={`Auto refresh: ${autoRefresh ? 'On' : 'Off'}`}
              >
                {autoRefresh ? <FaPlay className="w-4 h-4" /> : <FaPause className="w-4 h-4" />}
              </button>
              
              {/* Manual Refresh */}
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <FaRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Export */}
              <button
                onClick={() => exportAnalytics('pdf')}
                className="p-2 rounded-lg bg-athletiq-blue text-white hover:bg-athletiq-blue-dark transition-colors"
              >
                <FaDownload className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 overflow-x-auto">
            {analyticsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-athletiq-blue text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !analyticsData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-athletiq-blue border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Loading AI analytics...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'predictions' && renderPredictionsTab()}
              {activeTab === 'insights' && renderInsightsTab()}
              {/* Add other tab renderers here */}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
