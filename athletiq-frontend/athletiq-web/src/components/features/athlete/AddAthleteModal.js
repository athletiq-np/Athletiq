// src/components/modals/AddPlayerModal.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AddPlayerModal({
  open,
  onClose,
  onAdded,
  schools,
  defaultSchoolId
}) {
  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    school_id: defaultSchoolId || (schools?.[0]?.id || ""),
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [birthCertFile, setBirthCertFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm({
        full_name: "",
        dob: "",
        school_id: defaultSchoolId || (schools?.[0]?.id || ""),
      });
      setPhotoFile(null);
      setBirthCertFile(null);
      setErr("");
    }
  }, [open, schools, defaultSchoolId]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const data = new FormData();
      data.append("full_name", form.full_name);
      data.append("dob", form.dob);
      data.append("school_id", form.school_id);
      if (photoFile) data.append("photo", photoFile);
      if (birthCertFile) data.append("birth_cert", birthCertFile);

      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/players/register", data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onAdded && onAdded();
      onClose();
    } catch (error) {
      setErr(
        error?.response?.data?.message ||
          "Failed to add player. Please check required fields."
      );
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
        <button
          className="absolute top-2 right-3 text-lg"
          onClick={onClose}
          type="button"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Add Player</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              className="w-full border p-2 rounded"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Date of Birth</label>
            <input
              className="w-full border p-2 rounded"
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">School</label>
            <select
              className="w-full border p-2 rounded"
              name="school_id"
              value={form.school_id || ""}
              onChange={handleChange}
              required
              disabled={schools?.length === 1} // Lock for school admins
            >
              <option value="">Select school...</option>
              {schools?.map(
                (s) =>
                  s?.id && (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  )
              )}
            </select>
          </div>

          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm mb-1">Photo</label>
              <input
                type="file"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                accept="image/*"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Birth Certificate</label>
              <input
                type="file"
                onChange={(e) => setBirthCertFile(e.target.files[0])}
                accept="image/*,application/pdf"
              />
            </div>
          </div>

          {err && <div className="text-red-500">{err}</div>}

          <button
            type="submit"
            className="w-full bg-athletiq-navy text-white rounded py-2 mt-2"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Player"}
          </button>
        </form>
      </div>
    </div>
  );
}
