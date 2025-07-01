// src/pages/PlayerRegister.js

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function PlayerRegister() {
  const [form, setForm] = useState({
    full_name: "",
    full_name_nep: "",
    dob: "",
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
      if (photoFile) data.append("photo", photoFile);
      if (birthCertFile) data.append("birth_cert", birthCertFile);

      await axios.post("http://localhost:5000/api/players/register", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMsg("Player registered successfully!");
      setForm({
        full_name: "",
        full_name_nep: "",
        dob: "",
        gender: "male",
        main_sport: "",
        guardian_name: "",
        guardian_phone: "",
        school_id: "",
        district: "",
      });
      setPhotoFile(null);
      setBirthCertFile(null);
    } catch (error) {
      setErr(error?.response?.data?.message || "Registration failed.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Register Player</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block mb-1 text-sm">Full Name (English)</label>
          <input className="w-full border p-2 rounded" name="full_name" value={form.full_name} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 text-sm">Full Name (Nepali)</label>
          <input className="w-full border p-2 rounded" name="full_name_nep" value={form.full_name_nep} onChange={handleChange} />
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block mb-1 text-sm">Gender</label>
            <select className="w-full border p-2 rounded" name="gender" value={form.gender} onChange={handleChange} required>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">Date of Birth</label>
            <input className="w-full border p-2 rounded" type="date" name="dob" value={form.dob} onChange={handleChange} required />
          </div>
        </div>
        <div>
          <label className="block mb-1 text-sm">Guardian Name</label>
          <input className="w-full border p-2 rounded" name="guardian_name" value={form.guardian_name} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 text-sm">Guardian Phone</label>
          <input className="w-full border p-2 rounded" name="guardian_phone" value={form.guardian_phone} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 text-sm">School</label>
          <select className="w-full border p-2 rounded" name="school_id" value={form.school_id} onChange={handleChange} required>
            <option value="">Select School</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm">District</label>
          <input className="w-full border p-2 rounded" name="district" value={form.district} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1 text-sm">Main Sport</label>
          <input className="w-full border p-2 rounded" name="main_sport" value={form.main_sport} onChange={handleChange} required />
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block mb-1 text-sm">Photo</label>
            <input type="file" ref={filePhoto} onChange={handlePhoto} accept="image/*" />
          </div>
          <div>
            <label className="block mb-1 text-sm">Birth Certificate</label>
            <input type="file" ref={fileCert} onChange={handleCert} accept="application/pdf,image/*" />
          </div>
        </div>
        {err && <div className="text-red-500">{err}</div>}
        {msg && <div className="text-green-600">{msg}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
          {loading ? "Registering..." : "Register Player"}
        </button>
      </form>
    </div>
  );
}
