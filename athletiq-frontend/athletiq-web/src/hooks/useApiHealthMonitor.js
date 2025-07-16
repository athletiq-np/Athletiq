// Enterprise API Health Monitor
// Real-time API status monitoring for the AthletiQ dashboard

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

// API Health endpoints to monitor
const HEALTH_ENDPOINTS = [
  { name: 'Authentication', endpoint: '/auth/health', critical: true },
  { name: 'Tournaments', endpoint: '/tournaments/health', critical: true },
  { name: 'Schools', endpoint: '/schools/health', critical: true },
  { name: 'Athletes', endpoint: '/athletes/health', critical: false },
  { name: 'Matchday', endpoint: '/matchday/health', critical: false },
  { name: 'Certificates', endpoint: '/certificates/health', critical: false },
  { name: 'Documents', endpoint: '/documents/health', critical: false }
];

export const useApiHealthMonitor = (intervalMs = 30000) => {
  const [healthStatus, setHealthStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [overallStatus, setOverallStatus] = useState('unknown');

  // Check health of a single endpoint
  const checkEndpointHealth = useCallback(async (endpoint) => {
    try {
      const response = await apiClient.get(endpoint.endpoint, {
        timeout: 5000
      });
      
      return {
        name: endpoint.name,
        status: 'healthy',
        responseTime: Date.now() - performance.now(),
        statusCode: response.status,
        critical: endpoint.critical,
        lastChecked: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      return {
        name: endpoint.name,
        status: 'unhealthy',
        responseTime: null,
        statusCode: error.response?.status || 0,
        critical: endpoint.critical,
        lastChecked: new Date().toISOString(),
        error: error.message,
        data: null
      };
    }
  }, []);

  // Check all endpoints
  const checkAllEndpoints = useCallback(async () => {
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      // Check main API health first
      const mainHealth = await apiClient.get('/health', { timeout: 5000 });
      
      // Then check individual endpoints
      const healthChecks = await Promise.allSettled(
        HEALTH_ENDPOINTS.map(endpoint => checkEndpointHealth(endpoint))
      );

      const healthResults = {};
      let healthyCount = 0;
      let criticalIssues = 0;

      healthChecks.forEach((result, index) => {
        const endpoint = HEALTH_ENDPOINTS[index];
        if (result.status === 'fulfilled') {
          healthResults[endpoint.name] = result.value;
          if (result.value.status === 'healthy') {
            healthyCount++;
          } else if (result.value.critical) {
            criticalIssues++;
          }
        } else {
          healthResults[endpoint.name] = {
            name: endpoint.name,
            status: 'error',
            critical: endpoint.critical,
            error: result.reason?.message || 'Unknown error',
            lastChecked: new Date().toISOString()
          };
          if (endpoint.critical) criticalIssues++;
        }
      });

      // Add main API status
      healthResults['API Server'] = {
        name: 'API Server',
        status: 'healthy',
        responseTime: performance.now() - startTime,
        statusCode: mainHealth.status,
        critical: true,
        lastChecked: new Date().toISOString(),
        data: mainHealth.data
      };

      // Determine overall status
      let status = 'healthy';
      if (criticalIssues > 0) {
        status = 'critical';
      } else if (healthyCount < HEALTH_ENDPOINTS.length) {
        status = 'degraded';
      }

      setHealthStatus(healthResults);
      setOverallStatus(status);
      setLastCheck(new Date());
      
    } catch (error) {
      console.error('Health check failed:', error);
      setOverallStatus('critical');
      setHealthStatus({
        'API Server': {
          name: 'API Server',
          status: 'unhealthy',
          critical: true,
          error: error.message,
          lastChecked: new Date().toISOString()
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [checkEndpointHealth]);

  // Set up interval monitoring
  useEffect(() => {
    checkAllEndpoints(); // Initial check
    
    const interval = setInterval(checkAllEndpoints, intervalMs);
    
    return () => clearInterval(interval);
  }, [checkAllEndpoints, intervalMs]);

  // Manual refresh
  const refresh = useCallback(() => {
    checkAllEndpoints();
  }, [checkAllEndpoints]);

  // Get status summary
  const getStatusSummary = useCallback(() => {
    const total = Object.keys(healthStatus).length;
    const healthy = Object.values(healthStatus).filter(s => s.status === 'healthy').length;
    const critical = Object.values(healthStatus).filter(s => s.status === 'unhealthy' && s.critical).length;
    
    return {
      total,
      healthy,
      unhealthy: total - healthy,
      critical,
      healthPercentage: total > 0 ? Math.round((healthy / total) * 100) : 0
    };
  }, [healthStatus]);

  return {
    healthStatus,
    overallStatus,
    isLoading,
    lastCheck,
    refresh,
    summary: getStatusSummary()
  };
};
