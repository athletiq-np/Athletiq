/**
 * PlayerRegistrationForm.js
 * - Single-step player registration for school admin/coach
 * - Uploads all fields + photo + birth certificate in one API call
 * - Uses OCR to auto-fill fields (optional, editable)
 * - Shows success message and resets form
 * - Requires: registerPlayer, extractCertificateOCR from playerApi.js
 */

import React, { useState } from "react";
import { registerPlayer, extractCertificateOCR } from "../api/playerApi";

const initialFields = {
  full_name_eng: "",
  full_name_nep: "",
  dob_ad: "",
  dob_bs: "",
  gender: "",
  father_name: "",
  mother_name: "",
};

export default function PlayerRegistrationForm({ token, onRegistered }) {
  const [fields, setFields] = useState(initialFields);
  const [photo, setPhoto] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Handle form field change
  function handleChange(e) {
    setFields({ ...fields, [e.target.name]: e.target.value });
  }

  // OCR auto-fill handler
  async function handleOCR() {
    setError("");
    if (!certificate) return setError("Upload birth certificate first.");
    setExtracting(true);
    try {
      const res = await extractCertificateOCR(certificate, token);
      if (res.data) setFields(f => ({ ...f, ...res.data }));
      else setError(res.message || "Could not extract data.");
    } catch (e) {
      setError("OCR failed. Please try again.");
    }
    setExtracting(false);
  }

  // All-in-one registration handler
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (!photo || !certificate) {
        setError("Photo and certificate are required.");
        setSubmitting(false);
        return;
      }
      const formData = new FormData();
      Object.entries(fields).forEach(([key, val]) => formData.append(key, val));
      formData.append("photo", photo);
      formData.append("certificate", certificate);

      const res = await registerPlayer(formData, token);
      if (res.player && res.player.id) {
        setSuccess(`Player registered! Player ID: ${res.player.id}`);
        setFields(initialFields);
        setPhoto(null);
        setCertificate(null);
        onRegistered && onRegistered();
      } else {
        setError(res.message || "Registration failed.");
      }
    } catch (e) {
      setError("Registration failed. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 500, margin: '0 auto', padding: 24,
      border: '1px solid #eee', borderRadius: 8, background: '#fff'
    }}>
      <h2>Player Registration</h2>

      <input required placeholder="Full Name (English)" name="full_name_eng"
        value={fields.full_name_eng} onChange={handleChange} className="mb-2 w-full p-2" />
      <input required placeholder="Full Name (Nepali)" name="full_name_nep"
        value={fields.full_name_nep} onChange={handleChange} className="mb-2 w-full p-2" />
      <input required type="date" placeholder="DOB (AD)" name="dob_ad"
        value={fields.dob_ad} onChange={handleChange} className="mb-2 w-full p-2" />
      <input required placeholder="DOB (BS)" name="dob_bs"
        value={fields.dob_bs} onChange={handleChange} className="mb-2 w-full p-2" />
      <select required name="gender" value={fields.gender}
        onChange={handleChange} className="mb-2 w-full p-2">
        <option value="">Select Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      <input required placeholder="Father's Name" name="father_name"
        value={fields.father_name} onChange={handleChange} className="mb-2 w-full p-2" />
      <input required placeholder="Mother's Name" name="mother_name"
        value={fields.mother_name} onChange={handleChange} className="mb-2 w-full p-2" />

      <div className="mb-2">
        <label>Photo:
          <input type="file" accept="image/*"
            onChange={e => setPhoto(e.target.files[0])} required />
        </label>
      </div>
      <div className="mb-2">
        <label>Birth Certificate:
          <input type="file" accept="image/*,.pdf"
            onChange={e => setCertificate(e.target.files[0])} required />
        </label>
        <button type="button" onClick={handleOCR} disabled={extracting || !certificate}
          className="ml-2 px-2 py-1 bg-blue-400 text-white">
          {extracting ? "Extracting..." : "Auto-Fill from OCR"}
        </button>
      </div>
      <button type="submit" className="mt-4 px-3 py-2 bg-green-600 text-white"
        disabled={submitting}>
        {submitting ? "Registering..." : "Register Player"}
      </button>

      {success && <div style={{ color: "green", marginTop: 8 }}>{success}</div>}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </form>
  );
}
