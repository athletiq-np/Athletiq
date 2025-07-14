import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter,
  FaUserShield, FaUserCog, FaEnvelope, FaPhone, FaCalendarAlt,
  FaEye, FaEyeSlash, FaDownload, FaUpload, FaCheck, FaTimes,
  FaUserGraduate, FaChalkboardTeacher, FaUserTie, FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * 👥 User Management System
 * Complete user administration for schools
 */
const UserManagement = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'student',
    grade: '',
    studentId: '',
    department: '',
    password: '',
    confirmPassword: '',
    sendWelcomeEmail: true
  });

  const userRoles = [
    { value: 'admin', label: 'Administrator', icon: FaUserShield, color: 'red' },
    { value: 'teacher', label: 'Teacher', icon: FaChalkboardTeacher, color: 'blue' },
    { value: 'coach', label: 'Coach', icon: FaUserTie, color: 'green' },
    { value: 'student', label: 'Student', icon: FaUserGraduate, color: 'purple' }
  ];

  const grades = [
    '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', 
    '11th Grade', '12th Grade', 'Undergraduate', 'Graduate'
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/schools/me/users');
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => 
        selectedStatus === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  };

  const createUser = async () => {
    try {
      if (newUser.password !== newUser.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const response = await apiClient.post('/schools/me/users', {
        ...newUser,
        fullName: `${newUser.firstName} ${newUser.lastName}`
      });

      if (response.data.success) {
        toast.success('User created successfully!');
        setShowCreateModal(false);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'student',
          grade: '',
          studentId: '',
          department: '',
          password: '',
          confirmPassword: '',
          sendWelcomeEmail: true
        });
        loadUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const response = await apiClient.put(`/schools/me/users/${userId}`, updates);
      if (response.data.success) {
        toast.success('User updated successfully!');
        loadUsers();
        setEditingUser(null);
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await apiClient.delete(`/schools/me/users/${userId}`);
      if (response.data.success) {
        toast.success('User deleted successfully!');
        loadUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await apiClient.put(`/schools/me/users/${userId}/status`, {
        isActive: !currentStatus
      });
      if (response.data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        loadUsers();
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const bulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.warning('No users selected');
      return;
    }

    try {
      const response = await apiClient.post('/schools/me/users/bulk-action', {
        userIds: selectedUsers,
        action
      });

      if (response.data.success) {
        toast.success(`Bulk action ${action} completed successfully!`);
        setSelectedUsers([]);
        loadUsers();
      }
    } catch (error) {
      toast.error(`Failed to perform bulk action: ${action}`);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await apiClient.get('/schools/me/users/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'school_users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Users exported successfully!');
    } catch (error) {
      toast.error('Failed to export users');
    }
  };

  const getRoleInfo = (role) => {
    return userRoles.find(r => r.value === role) || userRoles[3];
  };

  const UserCard = ({ user }) => {
    const roleInfo = getRoleInfo(user.role);
    const RoleIcon = roleInfo.icon;

    return (    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-12 h-12 rounded-full bg-${roleInfo.color}-100 dark:bg-${roleInfo.color}-900/30 flex items-center justify-center`}>
              <RoleIcon className={`text-${roleInfo.color}-600 dark:text-${roleInfo.color}-400`} />
            </div>
            {!user.isActive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full bg-${roleInfo.color}-100 dark:bg-${roleInfo.color}-900/30 text-${roleInfo.color}-800 dark:text-${roleInfo.color}-400`}>
              {roleInfo.label}
            </span>
          </div>
        </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers([...selectedUsers, user.id]);
                } else {
                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                }
              }}
              className="h-4 w-4 text-blue-600"
            />
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          {user.phone && (
            <div className="flex items-center">
              <FaPhone className="mr-2 text-gray-400 dark:text-gray-500" />
              {user.phone}
            </div>
          )}
          {user.studentId && (
            <div className="flex items-center">
              <FaUser className="mr-2 text-gray-400 dark:text-gray-500" />
              ID: {user.studentId}
            </div>
          )}
          {user.grade && (
            <div className="flex items-center">
              <FaUserGraduate className="mr-2 text-gray-400 dark:text-gray-500" />
              {user.grade}
            </div>
          )}
          <div className="flex items-center">
            <FaCalendarAlt className="mr-2 text-gray-400 dark:text-gray-500" />
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.isActive ? (
                <>
                  <FaCheck className="mr-1" />
                  Active
                </>
              ) : (
                <>
                  <FaTimes className="mr-1" />
                  Inactive
                </>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingUser(user)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Edit User"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => toggleUserStatus(user.id, user.isActive)}
              className={`p-2 rounded-lg transition-colors ${
                user.isActive 
                  ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                  : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              title={user.isActive ? 'Deactivate' : 'Activate'}
            >
              {user.isActive ? <FaEyeSlash /> : <FaEye />}
            </button>
            <button
              onClick={() => deleteUser(user.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete User"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const CreateUserModal = () => (
    <AnimatePresence>
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {userRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {newUser.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={newUser.studentId}
                      onChange={(e) => setNewUser({...newUser, studentId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <select
                      value={newUser.grade}
                      onChange={(e) => setNewUser({...newUser, grade: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Grade</option>
                      {grades.map(grade => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {(newUser.role === 'teacher' || newUser.role === 'coach') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Physical Education, Mathematics"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newUser.sendWelcomeEmail}
                  onChange={(e) => setNewUser({...newUser, sendWelcomeEmail: e.target.checked})}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Send welcome email to user</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage students, teachers, coaches, and administrators
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportUsers}
            className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FaDownload className="mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            <FaUserPlus className="mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Users
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Search by name, email, or ID..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              {userRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bulk Actions
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => bulkAction('activate')}
                disabled={selectedUsers.length === 0}
                className="flex-1 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => bulkAction('deactivate')}
                disabled={selectedUsers.length === 0}
                className="flex-1 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {userRoles.map(role => {
          const count = users.filter(user => user.role === role.value).length;
          const Icon = role.icon;
          return (
            <div key={role.value} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{role.label}s</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{count}</p>
                </div>
                <div className={`w-12 h-12 rounded-full bg-${role.color}-100 flex items-center justify-center`}>
                  <Icon className={`text-${role.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <FaUser className="mx-auto text-gray-400 text-4xl mb-4" />
          <p className="text-gray-600">No users found matching your criteria</p>
        </div>
      )}

      <CreateUserModal />
    </div>
  );
};

export default UserManagement;
