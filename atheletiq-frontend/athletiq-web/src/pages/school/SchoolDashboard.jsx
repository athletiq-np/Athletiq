// src/pages/school/SchoolDashboard.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import EditSchoolModal from '@/components/features/school/EditSchoolModal';

export default function SchoolDashboard() {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const token = localStorage.getItem("token");

  const fetchSchool = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/schools/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSchool(res.data);
    } catch (err) {
      console.error("Failed to load school:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!school) return <div className="p-6 text-red-500">Failed to load school data.</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-athletiq-navy">🏫 School Dashboard</h1>
        <button
          onClick={() => setEditOpen(true)}
          className="px-4 py-2 rounded bg-athletiq-blue text-white hover:bg-athletiq-navy"
        >
          ✏️ Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-6 rounded shadow">
        <div>
          <p className="text-gray-500">School Name</p>
          <p className="font-semibold text-lg">{school.name}</p>
        </div>
        <div>
          <p className="text-gray-500">Phone</p>
          <p>{school.phone || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Email</p>
          <p>{school.email || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Address</p>
          <p>{school.address || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Province</p>
          <p>{school.province || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">District</p>
          <p>{school.district || "—"}</p>
        </div>
        <div className="sm:col-span-2 pt-4">
          <p className="text-gray-500">Logo</p>
          {school.logo_url ? (
            <img src={school.logo_url} alt="School Logo" className="h-24 mt-2 rounded shadow" />
          ) : (
            <p className="italic text-gray-400 mt-2">No logo uploaded</p>
          )}
        </div>
      </div>

      {/* MODAL */}
      {editOpen && (
        <EditSchoolModal
          school={school}
          token={token}
          onClose={() => setEditOpen(false)}
          onUpdate={fetchSchool}
        />
      )}
    </div>
  );
}
