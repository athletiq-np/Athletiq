// src/components/SchoolDashboard/SchoolProfileTab.jsx

import React from "react";

/**
 * SchoolProfileTab
 * Props:
 * - school: school object
 * - onEdit: function to open edit modal
 */
export default function SchoolProfileTab({ school, onEdit }) {
  if (!school) return <p className="text-gray-500">Loading school profile...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-athletiq-navy">🏫 School Profile</h2>
        <button
          className="px-4 py-2 bg-athletiq-blue text-white rounded hover:bg-athletiq-navy"
          onClick={onEdit}
        >
          Edit Profile
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm text-gray-500">Name</h3>
          <p className="font-medium text-athletiq-navy">{school.name}</p>
        </div>

        <div>
          <h3 className="text-sm text-gray-500">School Code</h3>
          <p className="text-gray-800">{school.code}</p>
        </div>

        <div>
          <h3 className="text-sm text-gray-500">Province</h3>
          <p className="text-gray-800">{school.province}</p>
        </div>

        <div>
          <h3 className="text-sm text-gray-500">District</h3>
          <p className="text-gray-800">{school.district}</p>
        </div>

        <div>
          <h3 className="text-sm text-gray-500">Phone</h3>
          <p className="text-gray-800">{school.phone}</p>
        </div>

        <div>
          <h3 className="text-sm text-gray-500">Email</h3>
          <p className="text-gray-800">{school.email}</p>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-sm text-gray-500">Address</h3>
          <p className="text-gray-800">{school.address}</p>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-sm text-gray-500 mb-2">School Logo</h3>
          {school.logo_url ? (
            <img
              src={`http://localhost:5000/uploads/${school.logo_url}`}
              alt="School Logo"
              className="h-20 object-contain bg-gray-100 p-2 rounded"
            />
          ) : (
            <p className="text-gray-500">No logo uploaded</p>
          )}
        </div>
      </div>
    </div>
  );
}
