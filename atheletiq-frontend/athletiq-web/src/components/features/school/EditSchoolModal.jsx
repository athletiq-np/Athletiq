// src/components/SchoolDashboard/EditSchoolModal.jsx

import React, { useState } from "react";
import axios from "axios";

/**
 * EditSchoolModal
 * Props:
 * - school: current school object
 * - onClose: function to close the modal
 * - onUpdate: callback after successful update
 * - token: JWT auth token
 */
export default function EditSchoolModal({ school, onClose, onUpdate, token }) {
  const [form, setForm] = useState({
    name: school.name || "",
    address: school.address || "",
    phone: school.phone || "",
    email: school.email || "",
    province: school.province || "",
    district: school.district || "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const formData = new FormData();
      for (let key in form) {
        formData.append(key, form[key]);
      }
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await axios.patch(`http://localhost:5000/api/schools/${school.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMsg("✅ Profile updated!");
      onUpdate(); // refetch school data in parent
      onClose(); // close modal
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-xl space-y-4">
        <h2 className="text-xl font-bold text-athletiq-navy">✏️ Edit School Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="School Name"
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="province"
              value={form.province}
              onChange={handleChange}
              placeholder="Province"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="District"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="border p-2 rounded"
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Upload New Logo</label>
            <input
              type="file"
              onChange={(e) => setLogoFile(e.target.files[0])}
              accept="image/*"
              className="text-sm"
            />
          </div>

          {msg && <p className="text-sm">{msg}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-athletiq-blue text-white hover:bg-athletiq-navy"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
