import React, { useState, useEffect, useRef } from "react";
import apiClient from "@/utils/apiClient";
import { useFormErrorHandler } from "@/hooks/useErrorHandler";
import { ErrorNotification, FieldError } from "@/components/common/ErrorNotification";

// Editable fields (add more as needed)
const FIELD_LIST = [
  { name: "full_name", label: "Full Name", type: "text" },
  { name: "full_name_nep", label: "नाम (Nepali)", type: "text" },
  { name: "dob", label: "Date of Birth", type: "date" },
  {
    name: "gender", label: "Gender", type: "select", options: [
      { value: "", label: "Select..." },
      { value: "M", label: "Male" },
      { value: "F", label: "Female" },
      { value: "O", label: "Other" }
    ]
  },
  { name: "main_sport", label: "Main Sport", type: "text" },
  { name: "guardian_name", label: "Guardian Name", type: "text" },
  { name: "guardian_relation", label: "Guardian Relation", type: "text" },
  { name: "guardian_phone", label: "Guardian Phone", type: "text" },
  { name: "player_phone", label: "Player's Phone", type: "text" },
  { name: "address", label: "Address", type: "text" },
  { name: "province", label: "Province", type: "text" },
  { name: "district", label: "District", type: "text" },
  { name: "municipality", label: "Municipality", type: "text" },
  { name: "ward", label: "Ward", type: "text" },
  { name: "city", label: "City", type: "text" },
  { name: "postal_code", label: "Postal Code", type: "text" },
  { name: "school_id", label: "School", type: "select_school" },
  { name: "jersey_number", label: "Jersey Number", type: "number" },
  { name: "current_class", label: "Current Class", type: "text" },
  { name: "admission_no", label: "Admission No.", type: "text" },
  { name: "secondary_sports", label: "Secondary Sports", type: "text" },
  { name: "playing_position", label: "Playing Position", type: "text" },
  { name: "registration_year", label: "Registration Year", type: "number" },
  { name: "is_verified", label: "Verified", type: "checkbox" },
  { name: "verification_source", label: "Verification Source", type: "text" },
  { name: "citizenship_no", label: "Citizenship No.", type: "text" },
];

export default function EditPlayerModal({ open, onClose, player, schools, onUpdated }) {
  const [form, setForm] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const fileInputPhoto = useRef();
  const fileInputCert = useRef();
  
  // Use the new error handling system
  const { 
    isLoading, 
    error, 
    fieldErrors, 
    handleFormSubmit, 
    getFieldError, 
    clearError,
    getFieldProps 
  } = useFormErrorHandler();

  // Reset state when opening
  useEffect(() => {
    if (player) {
      setForm({
        ...player,
        dob: player.dob ? player.dob.substring(0, 10) : "",
        is_verified: !!player.is_verified,
      });
      clearError();
      setPhotoFile(null);
      setCertFile(null);
      if (fileInputPhoto.current) fileInputPhoto.current.value = "";
      if (fileInputCert.current) fileInputCert.current.value = "";
    }
  }, [player, open, clearError]);

  if (!open || !player || !Array.isArray(schools) || schools.length === 0) return null;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle file uploads
  const handlePhoto = (e) => setPhotoFile(e.target.files[0]);
  const handleCert = (e) => setCertFile(e.target.files[0]);

  // Handle form submission with new error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await handleFormSubmit(async () => {
      const data = new FormData();

      FIELD_LIST.forEach(f => {
        let val = form[f.name];
        // Only append non-empty fields (skips unchanged)
        if (
          val !== undefined &&
          val !== null &&
          !(typeof val === "string" && val.trim() === "")
        ) {
          // For integer fields, ensure valid number
          if (["school_id", "jersey_number", "registration_year"].includes(f.name)) {
            if (isNaN(val)) return;
            val = Number(val);
          }
          data.append(f.name, val);
        }
      });

      if (photoFile) data.append("photo", photoFile);
      if (certFile) data.append("birth_cert", certFile);

      await apiClient.patch(`/athletes/${player.id}`, data);
      
      // Success - close modal and notify parent
      onUpdated && onUpdated();
      onClose();
    }, {
      successMessage: "Player updated successfully!",
      errorMessage: "Failed to update player. Please try again."
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative overflow-y-auto" style={{ maxHeight: "90vh" }}>
        <button className="absolute top-2 right-3 text-lg" onClick={onClose} type="button">
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Edit Player</h2>
        
        {/* Display error notification */}
        <ErrorNotification error={error} onClose={clearError} />
        
        <form onSubmit={handleSubmit} className="space-y-3" encType="multipart/form-data">
          {FIELD_LIST.map(f => {
            const fieldError = getFieldError(f.name);
            const inputClassName = `w-full border p-2 rounded ${fieldError ? 'border-red-500' : 'border-gray-300'}`;
            
            return (
              <div key={f.name}>
                <label className="block text-sm mb-1">{f.label}</label>
                {f.type === "select" ? (
                  <>
                    <select
                      name={f.name}
                      value={form[f.name] || ""}
                      onChange={handleChange}
                      className={inputClassName}
                    >
                      {f.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <FieldError error={fieldError} />
                  </>
                ) : f.type === "select_school" ? (
                  <>
                    <select
                      name={f.name}
                      value={form[f.name] || ""}
                      onChange={handleChange}
                      className={inputClassName}
                    >
                      <option value="">Select school...</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <FieldError error={fieldError} />
                  </>
                ) : f.type === "checkbox" ? (
                  <>
                    <input
                      type="checkbox"
                      name={f.name}
                      checked={!!form[f.name]}
                      onChange={handleChange}
                      className="ml-2"
                    />
                    <FieldError error={fieldError} />
                  </>
                ) : (
                  <>
                    <input
                      type={f.type}
                      name={f.name}
                      value={form[f.name] || ""}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                    <FieldError error={fieldError} />
                  </>
                )}
              </div>
            );
          })}
          {/* File upload fields */}
          <div>
            <label className="block text-sm mb-1">Profile Photo</label>
            <input
              type="file"
              ref={fileInputPhoto}
              onChange={handlePhoto}
              accept="image/*"
            />
            {player.profile_photo_url && !photoFile && (
              <img
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/${player.profile_photo_url}`}
                alt="Current"
                className="h-16 mt-2 rounded"
              />
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Birth Certificate</label>
            <input
              type="file"
              ref={fileInputCert}
              onChange={handleCert}
              accept="image/*,application/pdf"
            />
            {player.birth_cert_url && !certFile && (
              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/uploads/${player.birth_cert_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline block mt-2"
              >
                View Existing
              </a>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white rounded py-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Player"}
          </button>
        </form>
      </div>
    </div>
  );
}
