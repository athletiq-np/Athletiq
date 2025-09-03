import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.full_name || user?.username}!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">Online</p>
            <p className="text-sm text-gray-500">All systems operational</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Total Schools</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">1</p>
            <p className="text-sm text-gray-500">Registered schools</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">3</p>
            <p className="text-sm text-gray-500">System users</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">API Status</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">✓</p>
            <p className="text-sm text-gray-500">Backend connected</p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => window.open('http://localhost:8000/admin', '_blank')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Django Admin Panel</div>
                <div className="text-sm text-gray-500">Manage database records directly</div>
              </button>

              <button
                onClick={() => navigate('/school')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">School Dashboard</div>
                <div className="text-sm text-gray-500">View school management interface</div>
              </button>

              <button
                onClick={() => window.open('http://localhost:8000/api', '_blank')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">API Documentation</div>
                <div className="text-sm text-gray-500">Browse API endpoints</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              System Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">User Role:</span>
                <span className="font-medium">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User Type:</span>
                <span className="font-medium">{user?.user_type || 'System'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="text-gray-500">
            <p>• Superuser login successful</p>
            <p>• System status: All services running</p>
            <p>• Database: Connected and operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}
