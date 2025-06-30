import React, { useState, useEffect } from 'react';
import { FaKey, FaSpinner, FaTimes } from 'react-icons/fa';
import apiClient from '../../api/apiClient'; // Assuming you create a central apiClient config

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
  }, [isOpen]);

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
      // Use the new, correct route
      const response = await apiClient.put(
        `/admin/schools/${school.school_id}/change-password`,
        { newPassword }
      );
      
      setSuccess(response.data.message || 'Password updated successfully!');

      // Automatically close the modal after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Do not render anything if the modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md m-4 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-athletiq-navy">Change Password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          You are setting a new password for the administrator of <strong className="text-athletiq-green">{school.name}</strong>.
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-green"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-green"
                required
              />
            </div>
          </div>

          {/* Feedback Area for errors or success messages */}
          {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</div>}
          
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-6 py-2 bg-athletiq-navy text-white font-bold rounded-lg hover:bg-navy-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FaKey />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}