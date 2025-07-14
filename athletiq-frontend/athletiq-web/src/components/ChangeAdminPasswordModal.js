// src/components/ChangeAdminPasswordModal.js

import React, { useState, useEffect } from "react";
import axios from "axios";

/**
 * Modal for super admin to change school admin password.
 * Props:
 * - open: boolean
 * - onClose: function
 * - school: school object (should have id, name)
 * - onChanged: callback after password changed
 */
export default function ChangeAdminPasswordModal({ open, onClose, school, onChanged }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const token = localStorage.getItem("token");

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setPassword("");
      setErr("");
      setLoading(false);
      setShowPwd(false);
    }
  }, [open]);

  if (!open || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await axios.patch(
        `http://localhost:5000/api/schools/${school.id}/admin-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoading(false);
      setPassword("");
      if (onChanged) onChanged();
      alert("Password updated successfully!");
      onClose();
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to update password.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 min-w-[350px] shadow-lg relative">
        <button
          className="absolute top-2 right-4 text-xl text-gray-500 hover:text-black"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-3">
          Change Admin Password <br />
          <span className="text-base font-normal text-gray-600">
            ({school?.name || "School"})
          </span>
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1 font-medium">New Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="w-full border rounded p-2 pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                className="absolute right-2 top-2 text-sm text-gray-600"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {err && <div className="text-red-500">{err}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="bg-gray-200 px-4 py-1 rounded"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-athletiq-green text-white px-4 py-1 rounded"
              disabled={loading || !password}
            >
              {loading ? "Updating..." : "Change"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
ONBOARDING NOTES:
- Use in admin dashboard to allow super admin to reset a school's admin password.
- Expects `school` prop (must have id, name at minimum).
- Calls PATCH /api/schools/:id/admin-password (requires JWT).
- Handles loading, error, and resets on modal open.
*/
