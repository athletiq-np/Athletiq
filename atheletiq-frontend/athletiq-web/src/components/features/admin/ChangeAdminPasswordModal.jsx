import React, { useState, useEffect } from 'react';
import { FaKey, FaSpinner, FaTimes } from 'react-icons/fa';
// FIX: The import path is now corrected to use the '@' alias.
import apiClient from '@/api/apiClient';

export default function ChangeAdminPasswordModal({ isOpen, onClose, school }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effect to reset the form state whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setIsLoading(false);
    }
  }, [isOpen, school]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setIsLoading(true);

    try {
      const response = await apiClient.put(
        // The API endpoint we created for this action
        `/admin/schools/${school.id}/change-password`,
        { newPassword }
      );
      
      setSuccess(response.data.message || 'Password updated successfully!');
      
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-athletiq-navy">Change Password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Setting a new password for the admin of <strong className="text-athletiq-green">{school?.name}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-athletiq-green"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-athletiq-green"
                required
              />
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</div>}
          
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-6 py-2 bg-athletiq-navy text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaKey />}
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}