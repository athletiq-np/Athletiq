// src/components/AdminDashboard/SchoolsTab.js
import React from "react";
import AddSchoolModal from "../AddSchoolModal";
import EditSchoolModal from "../EditSchoolModal";
import BulkSchoolUploadModal from "../BulkSchoolUploadModal";
import ChangeAdminPasswordModal from "../ChangeAdminPasswordModal";

export default function SchoolsTab({
  schools, loading, err,
  addSchoolOpen, setAddSchoolOpen,
  bulkSchoolOpen, setBulkSchoolOpen,
  editSchool, setEditSchool,
  changePwdSchool, setChangePwdSchool,
  reloadSchools, handleDeleteSchool
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-athletiq-navy">All Schools</h2>
        <div className="flex gap-2">
          <button onClick={() => setAddSchoolOpen(true)} className="px-4 py-2 bg-athletiq-green text-white rounded">+ Add School</button>
          <button onClick={() => setBulkSchoolOpen(true)} className="px-4 py-2 bg-athletiq-blue text-white rounded">Bulk Upload</button>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-athletiq-blue text-white">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Address</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Logo</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.address}</td>
                <td className="p-2">{s.email}</td>
                <td className="p-2">{s.is_active ? "Yes" : "No"}</td>
                <td className="p-2">
                  {s.logo_url ? <img src={`http://localhost:5000/uploads/${s.logo_url}`} alt="logo" className="h-8 w-8 rounded" /> : "-"}
                </td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setEditSchool(s)} className="bg-athletiq-blue text-white px-3 py-1 rounded">Edit</button>
                  <button onClick={() => handleDeleteSchool(s.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                  <button onClick={() => setChangePwdSchool(s)} className="bg-athletiq-green text-white px-3 py-1 rounded" title="Change Admin Password">Change Password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddSchoolModal open={addSchoolOpen} onClose={() => setAddSchoolOpen(false)} onAdded={reloadSchools} />
      <EditSchoolModal open={!!editSchool} school={editSchool} onClose={() => setEditSchool(null)} onUpdated={reloadSchools} />
      <BulkSchoolUploadModal open={bulkSchoolOpen} onClose={() => setBulkSchoolOpen(false)} onUploaded={reloadSchools} />
      <ChangeAdminPasswordModal open={!!changePwdSchool} school={changePwdSchool} onClose={() => setChangePwdSchool(null)} onChanged={reloadSchools} />
    </div>
  );
}
