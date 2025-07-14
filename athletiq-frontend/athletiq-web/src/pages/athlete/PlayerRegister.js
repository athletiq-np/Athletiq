// src/pages/PlayerRegister.js

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function AthleteRegister() {
  const [form, setForm] = useState({
    full_name: "",
    full_name_nep: "",
    date_of_birth: "", // Updated to match backend expectation
    gender: "male",
    main_sport: "",
    guardian_name: "",
    guardian_phone: "",
    school_id: "",
    district: "",
  });
  const [schools, setSchools] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [birthCertFile, setBirthCertFile] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredPlayer, setRegisteredPlayer] = useState(null); // For showing athlete code

  const token = localStorage.getItem("token");
  const filePhoto = useRef();
  const fileCert = useRef();

  // Load schools for dropdown
  useEffect(() => {
    async function loadSchools() {
      try {
        const res = await axios.get("http://localhost:5000/api/schools", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchools(res.data.schools || []);
      } catch {
        setSchools([]);
      }
    }
    loadSchools();
  }, [token]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handlePhoto = (e) => setPhotoFile(e.target.files[0]);
  const handleCert = (e) => setBirthCertFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (photoFile) data.append("profile_photo_url", photoFile);
      if (birthCertFile) data.append("birth_cert_url", birthCertFile);

      const response = await axios.post("http://localhost:5000/api/athletes/register", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      setRegisteredPlayer(response.data.athlete);
      setMsg(`Athlete registered successfully! Athlete Code: ${response.data.athlete.athlete_id}`);
      setForm({
        full_name: "",
        full_name_nep: "",
        date_of_birth: "",
        gender: "male",
        main_sport: "",
        guardian_name: "",
        guardian_phone: "",
        school_id: "",
        district: "",
      });
      setPhotoFile(null);
      setBirthCertFile(null);
      
      // Reset file inputs
      if (filePhoto.current) filePhoto.current.value = '';
      if (fileCert.current) fileCert.current.value = '';
    } catch (error) {
      setErr(error?.response?.data?.message || "Registration failed.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Register New Athlete</h2>
      
      {/* Success Message with Athlete Code */}
      {registeredPlayer && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Registration Successful!</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p><strong>Athlete Name:</strong> {registeredPlayer.full_name}</p>
                <p><strong>Athlete Code:</strong> <span className="font-mono text-lg font-bold">{registeredPlayer.athlete_id}</span></p>
                <p className="text-xs mt-1">Please save this athlete code for future reference.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name (English) <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="full_name" 
                value={form.full_name} 
                onChange={handleChange} 
                required 
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name (Nepali)</label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="full_name_nep" 
                value={form.full_name_nep} 
                onChange={handleChange} 
                placeholder="नेपालीमा नाम"
              />
            </div>
          </div>
        </div>

        {/* Basic Details Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="gender" 
                value={form.gender} 
                onChange={handleChange} 
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                type="date" 
                name="date_of_birth" 
                value={form.date_of_birth} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Main Sport <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="main_sport" 
                value={form.main_sport} 
                onChange={handleChange} 
                required 
                placeholder="e.g., Football, Basketball"
              />
            </div>
          </div>
        </div>

        {/* Guardian Information Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Guardian Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Guardian Name <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="guardian_name" 
                value={form.guardian_name} 
                onChange={handleChange} 
                required 
                placeholder="Parent/Guardian full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Guardian Phone <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="guardian_phone" 
                value={form.guardian_phone} 
                onChange={handleChange} 
                required 
                placeholder="+977-9800000000"
              />
            </div>
          </div>
        </div>

        {/* School and Location Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">School & Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                School <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="school_id" 
                value={form.school_id} 
                onChange={handleChange} 
                required
              >
                <option value="">Select School</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">District</label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                name="district" 
                value={form.district} 
                onChange={handleChange} 
                placeholder="e.g., Kathmandu"
              />
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
              <input 
                type="file" 
                ref={filePhoto} 
                onChange={handlePhoto} 
                accept="image/*" 
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Birth Certificate</label>
              <input 
                type="file" 
                ref={fileCert} 
                onChange={handleCert} 
                accept="application/pdf,image/*" 
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
              />
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {err && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="text-red-800 dark:text-red-200">{err}</div>
          </div>
        )}
        {msg && !registeredPlayer && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="text-green-800 dark:text-green-200">{msg}</div>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering Athlete...
            </div>
          ) : (
            "Register Athlete"
          )}
        </button>
      </form>
    </div>
  );
}
