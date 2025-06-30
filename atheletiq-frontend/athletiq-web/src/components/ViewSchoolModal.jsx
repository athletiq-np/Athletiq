// src/components/ViewSchoolModal.jsx

import React from "react";

export default function ViewSchoolModal({ open, onClose, school }) {
  if (!open || !school) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>

        <div className="p-6">
          {/* Logo + Name */}
          <div className="flex flex-col items-center text-center mb-6">
            {school.logo_url ? (
              <img
                src={`http://localhost:5000/uploads/${school.logo_url}`}
                alt="School Logo"
                className="w-24 h-24 object-contain rounded-full border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                No Logo
              </div>
            )}
            <h2 className="text-lg font-semibold text-athletiq-navy mt-4">
              {school.name}
            </h2>
            {school.name_nep && (
              <h3 className="text-sm text-gray-500">{school.name_nep}</h3>
            )}
          </div>

          {/* School Details */}
          <div className="text-sm space-y-3">
            <div>
              <span className="font-medium text-gray-700">📍 Address: </span>
              <span>{school.address || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">🏙️ District: </span>
              <span>{school.district || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">🌐 Province: </span>
              <span>{school.province || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">📧 Email: </span>
              <span>{school.email || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">📞 Phone: </span>
              <span>{school.phone || school.contact || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">🆔 School Code: </span>
              <span>{school.code || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">🎓 Principal: </span>
              <span>{school.principal || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">🟢 Status: </span>
              <span className={school.is_active ? "text-green-600 font-semibold" : "text-red-600"}>
                {school.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
