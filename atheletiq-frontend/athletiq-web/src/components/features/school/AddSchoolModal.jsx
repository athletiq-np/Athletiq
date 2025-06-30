// src/components/AddSchoolModal.js

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

/**
 * Modal for adding a new school.
 * Props:
 * - open: Boolean, show/hide modal
 * - onClose: Function to close modal
 * - onAdded: Function to call after successful add
 */
export default function AddSchoolModal({ open, onClose, onAdded }) {
  // Extend with more fields as needed
  const [form, setForm] = useState({
    name: "",
    address: "",
    email: "",
    is_active: true,
    // province: "", district: "", city: "", phone: "", etc.
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const fileInput = useRef();

  // Reset form each open
  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        address: "",
        email: "",
        is_active: true,
        // province: "", district: "", city: "", phone: "", etc.
      });
      setLogoFile(null);
      setErr("");
      if (fileInput.current) fileInput.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  // Input change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Logo file change
  const handleLogo = (e) => {
    setLogoFile(e.target.files[0]);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      // Required validation
      if (!form.name || !form.address) {
        setErr("Name and address are required.");
        setLoading(false);
        return;
      }
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => data.append(key, val));
      if (logoFile) data.append("logo", logoFile);

      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/schools",
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onAdded) onAdded();
      onClose();
    } catch (error) {
      setErr(error?.response?.data?.message || "Add school failed.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg relative">
        <button className="absolute top-2 right-3 text-2xl font-bold text-gray-400 hover:text-red-500" onClick={onClose} type="button">
          &times;
        </button>
        <h2 className="text-2xl font-extrabold text-athletiq-navy mb-4">Add School</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-semibold">School Name <span className="text-red-500">*</span></label>
            <input
              className="w-full border border-athletiq-blue/40 p-2 rounded focus:ring-2 focus:ring-athletiq-blue"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={100}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-semibold">Address <span className="text-red-500">*</span></label>
            <input
              className="w-full border border-athletiq-blue/40 p-2 rounded"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-semibold">Email</label>
            <input
              className="w-full border border-athletiq-blue/40 p-2 rounded"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              maxLength={100}
              placeholder="(Optional)"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label className="text-sm font-semibold">Active</label>
          </div>
          {/* 
          // Add more fields as needed:
          <div>
            <label className="block text-sm mb-1 font-semibold">Province</label>
            <input className="w-full border p-2 rounded" name="province" value={form.province} onChange={handleChange} />
          </div>
          */}
          <div>
            <label className="block text-sm mb-1 font-semibold">Logo</label>
            <input
              type="file"
              ref={fileInput}
              onChange={handleLogo}
              accept="image/*"
            />
          </div>
          {err && <div className="text-red-500 text-sm">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-athletiq-green text-white rounded-lg py-2 font-bold hover:bg-green-700 transition"
          >
            {loading ? "Adding..." : "Add School"}
          </button>
        </form>
      </div>
    </div>
  );
}

/*
ONBOARDING NOTES:
- You can extend the form to include any field from your schools table, just add to form state and the <form>.
- Handles logo upload, "is_active" status, and resets after every close.
- Shows loader, error, and disables the button during API call.
- Color/class matches ATHLETIQ theme.
*/
