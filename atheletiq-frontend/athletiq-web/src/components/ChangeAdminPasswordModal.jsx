import React, { useState, useEffect } from "react";
import axios from "axios";

/**
 * Modal to allow Super Admin to change a school admin's password.
 *
 * Props:
 * - open: Boolean — modal visibility
 * - school: Object — selected school info (must include `id` and `name`)
 * - onClose: Function — close modal callback
 * - onChanged: Function (optional) — callback after successful update
 */
export default function ChangeAdminPasswordModal({ open, school, onClose, onChanged }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset modal state when opened
  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirm("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!password || !confirm) {
      setError("Both password fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

     // ChangeAdminPasswordModal.js (or wherever you send the request)
await axios.put(
  `/api/schools/${schoolId}/admin-password`,
  { newPassword },
  { headers: { Authorization: `Bearer ${token}` } }
);

      // Success callback
      onChanged && onChanged();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update password.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
        <button
          className="absolute top-2 right-2 text-xl text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold text-athletiq-navy mb-4">
          Change Password for {school.name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">New Password</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-athletiq-blue text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
