import React from "react";

// List of fields to display in view mode
const VIEW_FIELDS = [
  { name: "player_code", label: "Player ID" },
  { name: "full_name", label: "Full Name" },
  { name: "full_name_nep", label: "नाम (Nepali)" },
  { name: "dob", label: "Date of Birth" },
  { name: "gender", label: "Gender" },
  { name: "main_sport", label: "Main Sport" },
  { name: "guardian_name", label: "Guardian Name" },
  { name: "guardian_relation", label: "Guardian Relation" },
  { name: "guardian_phone", label: "Guardian Phone" },
  { name: "player_phone", label: "Player's Phone" },
  { name: "address", label: "Address" },
  { name: "province", label: "Province" },
  { name: "district", label: "District" },
  { name: "municipality", label: "Municipality" },
  { name: "ward", label: "Ward" },
  { name: "city", label: "City" },
  { name: "postal_code", label: "Postal Code" },
  { name: "school_name", label: "School" },
  { name: "jersey_number", label: "Jersey Number" },
  { name: "current_class", label: "Current Class" },
  { name: "admission_no", label: "Admission No." },
  { name: "secondary_sports", label: "Secondary Sports" },
  { name: "playing_position", label: "Playing Position" },
  { name: "registration_year", label: "Registration Year" },
  { name: "is_verified", label: "Verified" },
  { name: "verification_source", label: "Verification Source" },
  { name: "citizenship_no", label: "Citizenship No." },
];

export default function ViewPlayerModal({ open, onClose, player }) {
  // All hooks/logic first – but this is just display
  if (!open || !player) return null;

  // Optionally, convert gender to label
  function genderLabel(val) {
    if (val === "M") return "Male";
    if (val === "F") return "Female";
    if (val === "O") return "Other";
    return "";
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative overflow-y-auto" style={{ maxHeight: "90vh" }}>
        <button className="absolute top-2 right-3 text-lg" onClick={onClose} type="button">
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Player Details</h2>
        <div className="flex items-center gap-6 mb-6">
          {/* Profile photo */}
          <div>
            {player.profile_photo_url ? (
              <img
                src={`http://localhost:5000/uploads/${player.profile_photo_url}`}
                alt="profile"
                className="h-24 w-24 rounded object-cover border"
              />
            ) : (
              <div className="h-24 w-24 bg-gray-200 flex items-center justify-center rounded">
                <span className="text-gray-400">No Photo</span>
              </div>
            )}
          </div>
          <div>
            {/* Main fields up top */}
            <div className="font-semibold">ID: {player.player_code}</div>
            <div>{player.full_name}</div>
            <div className="text-sm text-gray-600">{player.dob}</div>
            <div className="text-sm">{genderLabel(player.gender)}</div>
            <div className="text-sm">{player.school_name}</div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-2">
          {VIEW_FIELDS.map(f =>
            player[f.name] !== undefined && f.name !== "school_name" && f.name !== "player_code" && f.name !== "full_name" && f.name !== "dob" && f.name !== "gender" ? (
              <div key={f.name} className="flex">
                <span className="w-40 text-gray-600">{f.label}:</span>
                <span className="flex-1">{f.name === "is_verified"
                  ? (player[f.name] ? "Yes" : "No")
                  : player[f.name]}</span>
              </div>
            ) : null
          )}
        </div>

        {/* Birth certificate */}
        <div className="mt-4">
          <label className="block text-sm mb-1">Birth Certificate</label>
          {player.birth_cert_url ? (
            <a
              href={`http://localhost:5000/uploads/${player.birth_cert_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View/Download
            </a>
          ) : (
            <span className="text-gray-400">Not uploaded</span>
          )}
        </div>
      </div>
    </div>
  );
}
