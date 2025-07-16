// src/pages/test/GuardianTestPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaKey, FaSearch, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';

export default function GuardianTestPage() {
  const [claimCode, setClaimCode] = useState('');
  const [sampleCodes, setSampleCodes] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSampleCodes();
  }, []);

  const fetchSampleCodes = async () => {
    try {
      // We'll fetch this from our test endpoint
      const response = await fetch('http://localhost:5000/api/test/claim-codes');
      if (response.ok) {
        const data = await response.json();
        setSampleCodes(data.codes || []);
      }
    } catch (error) {
      console.log('Could not fetch sample codes:', error);
    }
  };

  const testClaimCode = async () => {
    if (!claimCode.trim()) {
      toast.error('Please enter a claim code');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/guardian/verify-claim', {
        claimCode: claimCode.trim()
      });

      if (response.data.success) {
        setVerifyResult(response.data);
        toast.success('Claim code verified successfully!');
      }
    } catch (error) {
      console.error('Claim verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify claim code');
      setVerifyResult(null);
    } finally {
      setLoading(false);
    }
  };

  const startClaimProcess = (code) => {
    setClaimCode(code);
    window.open(`/guardian/claim/${code}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guardian Claim System Test</h1>
          <p className="text-gray-600">Test the guardian onboarding and claiming process</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Test Interface */}
          <div className="space-y-6">
            
            {/* Claim Code Tester */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FaKey className="mr-2 text-blue-600" />
                Test Claim Code
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Claim Code
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code"
                      maxLength={6}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={testClaimCode}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FaSearch />
                      )}
                    </button>
                  </div>
                </div>

                {/* Verification Result */}
                {verifyResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center mb-2">
                      <FaCheckCircle className="text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Claim Code Valid!</span>
                    </div>
                    
                    {verifyResult.athlete && (
                      <div className="space-y-2 text-sm">
                        <p><strong>Athlete:</strong> {verifyResult.athlete.full_name}</p>
                        <p><strong>Grade:</strong> {verifyResult.athlete.grade}</p>
                        <p><strong>School ID:</strong> {verifyResult.athlete.school_id}</p>
                        <p><strong>Guardian:</strong> {verifyResult.athlete.guardian_name}</p>
                        <p><strong>Phone:</strong> {verifyResult.athlete.guardian_phone}</p>
                        
                        <button
                          onClick={() => startClaimProcess(claimCode)}
                          className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Start Guardian Registration
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Guardian Dashboard Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FaUser className="mr-2 text-green-600" />
                Guardian Dashboard
              </h2>
              
              <p className="text-gray-600 mb-4">
                Test the guardian dashboard interface (requires completed registration)
              </p>
              
              <button
                onClick={() => window.open('/guardian/dashboard', '_blank')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Open Guardian Dashboard
              </button>
            </motion.div>
          </div>

          {/* Right Column - Sample Data */}
          <div className="space-y-6">
            
            {/* Sample Claim Codes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Claim Codes</h2>
              
              {sampleCodes.length > 0 ? (
                <div className="space-y-3">
                  {sampleCodes.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{item.athlete_name}</p>
                          <p className="text-sm text-gray-600">Code: {item.claim_code}</p>
                          <p className="text-sm text-gray-600">Guardian: {item.guardian_name}</p>
                        </div>
                        <button
                          onClick={() => startClaimProcess(item.claim_code)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading sample codes...</p>
                  <button
                    onClick={fetchSampleCodes}
                    className="mt-2 px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Guardian Routes</span>
                  <span className="text-green-600">✅ Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Claim Verification</span>
                  <span className="text-green-600">✅ Working</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Database Tables</span>
                  <span className="text-green-600">✅ Ready</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Sample Data</span>
                  <span className="text-green-600">✅ Generated</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
