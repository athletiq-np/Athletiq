// src/components/SchoolEditModal.js

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

/**
 * SchoolEditModal (Super Admin) - Edit all school fields and admin info.
 * Also updates admin user (name/email) when changed.
 */
export default function SchoolEditModal({ school, open, onClose, onUpdated }) {
  // Default form state based on school prop
  const defaultForm = {
    name: school?.name || "",
    name_ne: school?.name_ne || "", // Nepali name (was "name_np")
    type: school?.type || "",
    registration_no: school?.registration_no || "",
    pan_number: school?.pan_number || "",
    estd_year: school?.estd_year || "",
    logo_url: school?.logo_url || "",
    registration_doc_url: school?.registration_doc_url || "",
    association: school?.association || "",
    email: school?.email || "",
    phone: school?.phone || "",
    mobile: school?.mobile || "",
    landline: school?.landline || "",
    website: school?.website || "",
    facebook_url: school?.facebook_url || "",
    principal_name: school?.principal_name || "",
    principal_phone: school?.principal_phone || "",
    principal_email: school?.principal_email || "",
    admin_name: school?.admin_name || "",    // Allow edit
    admin_email: school?.admin_email || "",  // Allow edit
    address: school?.address || "",
    province: school?.province || "",
    district: school?.district || "",
    municipality: school?.municipality || "",
    ward: school?.ward || "",
    city: school?.city || "",
    postal_code: school?.postal_code || "",
    country: school?.country || "",
    place_id: school?.place_id || "",
    location_lat: school?.location_lat || "",
    location_lng: school?.location_lng || "",
    onboarding_status: school?.onboarding_status || "",
    is_active: school?.is_active ?? true,
  };

  const [form, setForm] = useState(defaultForm);
  const [logoFile, setLogoFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fileInputLogo = useRef();
  const fileInputDoc = useRef();

  // Reset form when modal opens or school changes
  useEffect(() => {
    setForm({
      ...defaultForm,
      ...school,
      name_ne: school?.name_ne || "", // force update
      admin_name: school?.admin_name || "",
      admin_email: school?.admin_email || "",
    });
    setLogoFile(null);
    setDocFile(null);
    setErr("");
    if (fileInputLogo.current) fileInputLogo.current.value = "";
    if (fileInputDoc.current) fileInputDoc.current.value = "";
    // eslint-disable-next-line
  }, [school, open]);

  if (!open) return null;

  // Handle all input changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // File handlers
  const handleLogoChange = e => setLogoFile(e.target.files[0]);
  const handleDocChange = e => setDocFile(e.target.files[0]);

  // Submit handler (updates school + admin info)
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const data = new FormData();
      // Append all fields (exclude undefined)
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      if (logoFile) data.append("logo", logoFile);
      if (docFile) data.append("registration_doc", docFile);

      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:5000/api/schools/${school.id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      if (onUpdated) onUpdated(res.data.school);
      onClose();
    } catch (error) {
      setErr(error?.response?.data?.message || "Update failed.");
    }
    setLoading(false);
  };

  // Helper to render input
  const textField = (label, name, type = "text", required = false) => (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        className="w-full border p-2 rounded"
        name={name}
        value={form[name] ?? ""}
        onChange={handleChange}
        required={required}
        type={type}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative max-h-[95vh] overflow-y-auto">
        <button className="absolute top-2 right-3 text-lg" onClick={onClose}>
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Edit School</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {textField("School Name (English)", "name", "text", true)}
            {textField("School Name (नेपाली)", "name_ne")}
            {textField("School Type", "type")}
            {textField("Association", "association")}
            {textField("Registration Number", "registration_no")}
            {textField("PAN/VAT Number", "pan_number")}
            {textField("Established Year", "estd_year")}
            {textField("Email", "email", "email")}
            {textField("Phone", "phone")}
            {textField("Mobile", "mobile")}
            {textField("Landline", "landline")}
            {textField("Website", "website")}
            {textField("Facebook/Page", "facebook_url")}
            {textField("Principal Name", "principal_name")}
            {textField("Principal Phone", "principal_phone")}
            {textField("Principal Email", "principal_email")}
            {textField("Admin Name", "admin_name")}
            {textField("Admin Email", "admin_email")}
            {textField("Address", "address", "text", true)}
            {textField("Province", "province")}
            {textField("District", "district")}
            {textField("Municipality", "municipality")}
            {textField("Ward", "ward")}
            {textField("City/Village", "city")}
            {textField("Postal Code", "postal_code")}
            {textField("Country", "country")}
            {textField("Google Place ID", "place_id")}
            {textField("Latitude", "location_lat")}
            {textField("Longitude", "location_lng")}
            {textField("Onboarding Status", "onboarding_status")}
          </div>
          <div className="flex gap-6 items-center mt-2">
            <div>
              <label className="block text-sm mb-1">Logo</label>
              {school.logo_url && (
                <img
                  src={`http://localhost:5000/uploads/${school.logo_url}`}
                  alt="Logo"
                  className="h-16 mb-2 rounded shadow"
                />
              )}
              <input
                type="file"
                ref={fileInputLogo}
                onChange={handleLogoChange}
                accept="image/*"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Registration Doc</label>
              {school.registration_doc_url && (
                <a
                  href={`http://localhost:5000/uploads/${school.registration_doc_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Document
                </a>
              )}
              <input
                type="file"
                ref={fileInputDoc}
                onChange={handleDocChange}
                accept="application/pdf,image/*"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Active</label>
            <select
              className="w-full border p-2 rounded"
              name="is_active"
              value={form.is_active ? "true" : "false"}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  is_active: e.target.value === "true"
                }))
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          {err && <div className="text-red-500">{err}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 mt-2"
            disabled={loading}
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

/*
ONBOARDING NOTES:
- This modal allows editing ALL school fields, including admin name/email.
- admin_name and admin_email will also update the corresponding school admin user on the backend if changed.
- Nepali name uses key `name_ne` (matches db).
- Requires backend PATCH /api/schools/:id to support updating admin user.
*/
