import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SchoolRegistrationWizard() {
  const [step, setStep] = useState(1);
  const [school, setSchool] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const schoolId = localStorage.getItem('school_id');
  const navigate = useNavigate();

  useEffect(() => {
    // Load current onboarding info if any
    const fetchSchool = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/schools'}/${schoolId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSchool(res.data);
        setLoading(false);
      } catch (error) {
        setErr('Could not load school info.');
        setLoading(false);
      }
    };
    fetchSchool();
  }, [schoolId]);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  // Update school profile on backend
  const handleUpdate = async (updates, files = null) => {
    setErr('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      let formData;
      let config;
      if (files) {
        formData = new FormData();
        Object.entries(updates).forEach(([key, value]) => formData.append(key, value));
        Object.entries(files).forEach(([key, file]) => formData.append(key, file));
        config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } };
      } else {
        formData = updates;
        config = { headers: { Authorization: `Bearer ${token}` } };
      }
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/schools'}/${schoolId}`,
        formData,
        config
      );
      setSchool(res.data.school);
      setSuccess('Saved!');
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to update school info.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (err) return <div className="text-red-500">{err}</div>;

  // Step content (you can expand fields as you like)
  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">School Onboarding</h2>
      <div className="mb-4">Step {step} of 3</div>

      {step === 1 && (
        <form onSubmit={e => {
          e.preventDefault();
          handleUpdate({
            name: e.target.name.value,
            address: e.target.address.value,
            province: e.target.province.value,
            district: e.target.district.value,
            municipality: e.target.municipality.value,
            ward: e.target.ward.value,
            phone: e.target.phone.value,
            email: e.target.email.value,
          });
          handleNext();
        }}>
          <input className="w-full border p-2 mb-2" name="name" defaultValue={school.name || ''} placeholder="School Name" required />
          <input className="w-full border p-2 mb-2" name="address" defaultValue={school.address || ''} placeholder="Address" />
          <input className="w-full border p-2 mb-2" name="province" defaultValue={school.province || ''} placeholder="Province" />
          <input className="w-full border p-2 mb-2" name="district" defaultValue={school.district || ''} placeholder="District" />
          <input className="w-full border p-2 mb-2" name="municipality" defaultValue={school.municipality || ''} placeholder="Municipality" />
          <input className="w-full border p-2 mb-2" name="ward" defaultValue={school.ward || ''} placeholder="Ward" />
          <input className="w-full border p-2 mb-2" name="phone" defaultValue={school.phone || ''} placeholder="Phone" />
          <input className="w-full border p-2 mb-2" name="email" defaultValue={school.email || ''} placeholder="School Email" />
          {err && <div className="text-red-500 mb-2">{err}</div>}
          <button className="w-full py-2 bg-blue-500 text-white rounded" type="submit">Save & Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={async e => {
          e.preventDefault();
          const logoFile = e.target.logo.files[0];
          const docFile = e.target.registration_doc.files[0];
          await handleUpdate({}, { logo: logoFile, registration_doc: docFile });
          handleNext();
        }}>
          <div className="mb-2">Upload Logo (optional):</div>
          <input type="file" name="logo" className="mb-2" accept="image/*" />
          {school.logo_url && <img src={`/uploads/${school.logo_url}`} alt="logo" className="w-24 h-24 object-contain mb-2" />}
          <div className="mb-2">Upload Registration Document (optional):</div>
          <input type="file" name="registration_doc" className="mb-2" accept="image/*,.pdf" />
          {school.registration_doc_url && <a href={`/uploads/${school.registration_doc_url}`} target="_blank" rel="noopener noreferrer">View uploaded document</a>}
          {err && <div className="text-red-500 mb-2">{err}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={handlePrev} className="py-2 px-4 bg-gray-300 rounded">Back</button>
            <button type="submit" className="py-2 px-4 bg-blue-500 text-white rounded">Save & Next</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div>
          <div className="mb-4 text-green-600 font-bold">
            Onboarding Complete!
          </div>
          <div className="mb-4">
            <button className="py-2 px-4 bg-green-600 text-white rounded"
              onClick={() => {
                localStorage.removeItem('school_id');
                navigate('/school-dashboard');
              }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  );
}
