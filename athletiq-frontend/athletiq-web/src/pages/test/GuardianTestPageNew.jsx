import React from 'react';
import { Link } from 'react-router-dom';

export default function GuardianTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Guardian System Test Page
            </h1>
            <p className="text-gray-600">
              Test all components of the new guardian system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Guardian Portal */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-3">New Guardian Portal</h3>
              <p className="text-blue-100 mb-4">
                Complete guardian authentication and dashboard system with modern UI
              </p>
              <Link
                to="/guardian"
                className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Open Portal
              </Link>
            </div>

            {/* Legacy Simple Portal */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-3">Legacy Simple Portal</h3>
              <p className="text-green-100 mb-4">
                Original simple guardian portal for comparison
              </p>
              <Link
                to="/guardian-modern"
                className="inline-block bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                Open Legacy
              </Link>
            </div>

            {/* Direct Dashboard */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-3">Direct Dashboard</h3>
              <p className="text-purple-100 mb-4">
                Direct access to guardian dashboard (requires authentication)
              </p>
              <Link
                to="/guardian-dashboard"
                className="inline-block bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                Open Dashboard
              </Link>
            </div>

            {/* Claim Portal */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-3">Claim Portal</h3>
              <p className="text-orange-100 mb-4">
                Guardian claim system for linking with athletes
              </p>
              <Link
                to="/guardian-claim"
                className="inline-block bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
              >
                Open Claim
              </Link>
            </div>
          </div>

          {/* System Information */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">New Components:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• GuardianPortal.jsx - Main portal with auth flow</li>
                  <li>• GuardianDashboard.jsx - Modern tabbed dashboard</li>
                  <li>• GuardianLogin.jsx - Enhanced login component</li>
                  <li>• GuardianRegistration.jsx - Multi-step registration</li>
                  <li>• ChildManagement.jsx - Complete child CRUD system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">New Hooks:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• useGuardianAuth - Authentication context</li>
                  <li>• useGuardianChildren - Children data management</li>
                </ul>
                <h4 className="font-medium text-gray-700 mb-2 mt-4">Utilities:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• apiClient.js - Enhanced API client</li>
                  <li>• Proper error handling & token management</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expected API Endpoints</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div><code className="bg-white px-2 py-1 rounded">POST /api/guardian-simple/register</code> - Guardian registration</div>
              <div><code className="bg-white px-2 py-1 rounded">POST /api/guardian-simple/login</code> - Guardian login</div>
              <div><code className="bg-white px-2 py-1 rounded">GET /api/guardian-simple/profile</code> - Get guardian profile</div>
              <div><code className="bg-white px-2 py-1 rounded">GET /api/guardian-simple/children</code> - Get guardian's children</div>
              <div><code className="bg-white px-2 py-1 rounded">POST /api/guardian-simple/children</code> - Add new child</div>
              <div><code className="bg-white px-2 py-1 rounded">PUT /api/guardian-simple/children/:id</code> - Update child</div>
              <div><code className="bg-white px-2 py-1 rounded">DELETE /api/guardian-simple/children/:id</code> - Delete child</div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
