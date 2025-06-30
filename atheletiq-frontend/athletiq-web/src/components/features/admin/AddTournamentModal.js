import React, { useState } from "react";
import axios from "axios";

/**
 * AddTournamentModal
 * Props:
 *  - open: boolean (show/hide modal)
 *  - onClose: function() => void (close modal)
 *  - user: current user object (for role and default organizer)
 *  - onAdded: function(newTournament) => void (called after successful create)
 */
export default function AddTournamentModal({ open, onClose, user, onAdded }) {
  // State for form fields
  const [name, setName] = useState("");
  const [logo, setLogo] = useState(null);      // File input
  const [organizerId, setOrganizerId] = useState(""); // Only super admin
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // TODO: For real system, fetch users/organizations if assigning as super admin
  // For now, keep organizerId empty or self

  if (!open) return null;

  // Handle logo upload preview
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");

    try {
      let logo_url = "";
      // 1. Upload logo (if present)
      if (logo) {
        const fd = new FormData();
        fd.append("file", logo);
        const res = await axios.post("http://localhost:5000/api/upload", fd, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });
        logo_url = res.data.url; // Assuming backend returns { url: ... }
      }

      // 2. Submit tournament create API
      const resp = await axios.post(
        "http://localhost:5000/api/tournaments",
        {
          name,
          logo_url,
          organizer_id: organizerId || undefined, // Only for super_admin; backend can ignore if not needed
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      onAdded && onAdded(resp.data); // Call parent to reload tournaments
      setName("");
      setLogo(null);
      setOrganizerId("");
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || "Error creating tournament.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white p-8 rounded-lg shadow-lg min-w-[360px] max-w-[95vw] relative">
        <button
          className="absolute right-3 top-3 text-xl text-gray-500 hover:text-red-500"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-athletiq-navy">Add Tournament</h2>
        {err && <div className="text-red-500 mb-2">{err}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tournament Name */}
          <div>
            <label className="block font-semibold mb-1">Tournament Name<span className="text-red-500">*</span></label>
            <input
              className="border p-2 rounded w-full"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={submitting}
              placeholder="Enter tournament name"
            />
          </div>
          {/* Logo Upload */}
          <div>
            <label className="block font-semibold mb-1">Logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={submitting}
            />
            {logo && (
              <img
                src={URL.createObjectURL(logo)}
                alt="Logo Preview"
                className="mt-2 h-16 w-16 object-contain rounded border"
              />
            )}
          </div>
          {/* Organizer (super_admin only, can assign another user/org) */}
          {user?.role === "super_admin" && (
            <div>
              <label className="block font-semibold mb-1">Organizer (User/Org ID)</label>
              <input
                className="border p-2 rounded w-full"
                type="text"
                value={organizerId}
                onChange={e => setOrganizerId(e.target.value)}
                disabled={submitting}
                placeholder="Leave blank for self"
              />
              {/* In real version, use dropdown of organizations/users */}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-athletiq-green text-white font-semibold hover:bg-green-700"
              disabled={submitting || !name}
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
