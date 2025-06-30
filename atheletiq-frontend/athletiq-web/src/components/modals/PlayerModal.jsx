// src/components/SchoolDashboard/PlayerModal.jsx

import React from "react";

export default function PlayerModal({ open, player, onClose }) {
  if (!open || !player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

        {/* Photo and Name */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={`http://localhost:5000/uploads/${player.photo_url}`}
            alt={player.full_name}
            className="w-16 h-16 rounded-full object-cover border"
          />
          <div>
            <h2 className="text-xl font-semibold text-athletiq-navy">{player.full_name}</h2>
            <p className="text-sm text-gray-600">{player.full_name_nep}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">DOB:</span>
            <div>{player.dob}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Gender:</span>
            <div>{player.gender}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Guardian Phone:</span>
            <div>{player.guardian_phone}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <div className={`inline-block px-2 py-1 rounded text-xs font-semibold
              ${player.status === "verified"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"}`}>
              {player.status || "Pending"}
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="mt-4">
          <span className="font-medium text-gray-700">Birth Certificate:</span>
          {player.birth_cert_url ? (
            <img
              src={`http://localhost:5000/uploads/${player.birth_cert_url}`}
              alt="Birth Cert"
              className="w-full mt-2 border rounded"
            />
          ) : (
            <div className="text-gray-500 mt-1">Not uploaded</div>
          )}
        </div>
      </div>
    </div>
  );
}
