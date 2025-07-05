import React from 'react';
import { Users, FileText, TrendingUp, Settings, Activity, Bell, Plus, BarChart3, Calendar, Download } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full max-w-none p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 text-lg">Welcome back! Here's your platform overview.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
                <Bell className="h-5 w-5 text-slate-600" />
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span className="font-medium">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-green-500 text-sm font-medium">+12%</div>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Total Users</p>
              <p className="text-3xl font-bold text-slate-900">1,247</p>
              <p className="text-xs text-slate-500 mt-1">+23 this week</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-green-500 text-sm font-medium">+8%</div>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Documents</p>
              <p className="text-3xl font-bold text-slate-900">8,492</p>
              <p className="text-xs text-slate-500 mt-1">+156 today</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-green-500 text-sm font-medium">+15%</div>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Revenue</p>
              <p className="text-3xl font-bold text-slate-900">$24,680</p>
              <p className="text-xs text-slate-500 mt-1">vs last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-green-500 text-sm font-medium">Live</div>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium mb-1">Active Now</p>
              <p className="text-3xl font-bold text-slate-900">342</p>
              <p className="text-xs text-slate-500 mt-1">users online</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Sarah Johnson registered</p>
                      <p className="text-xs text-slate-500 mt-1">New user joined the platform</p>
                      <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Document verification completed</p>
                      <p className="text-xs text-slate-500 mt-1">Alex Rivera's credentials approved</p>
                      <p className="text-xs text-slate-400 mt-1">5 minutes ago</p>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Performance metrics updated</p>
                      <p className="text-xs text-slate-500 mt-1">Monthly analytics report generated</p>
                      <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                    </div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Tournament scheduled</p>
                      <p className="text-xs text-slate-500 mt-1">Regional championships next week</p>
                      <p className="text-xs text-slate-400 mt-1">3 hours ago</p>
                    </div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Add New User</span>
                </button>
                
                <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Upload Document</span>
                </button>
                
                <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">View Reports</span>
                </button>
                
                <button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Export Data</span>
                </button>
                
                <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-4 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
