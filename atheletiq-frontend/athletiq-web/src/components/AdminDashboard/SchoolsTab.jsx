import React, { useState, useEffect } from "react";
import AddSchoolModal from "../AddSchoolModal";
import EditSchoolModal from "../EditSchoolModal";
import BulkSchoolUploadModal from "../BulkSchoolUploadModal";
import ChangeAdminPasswordModal from "../ChangeAdminPasswordModal";
import ViewSchoolModal from "../ViewSchoolModal";

export default function SchoolsTab({
  schools, loading, err,
  addSchoolOpen, setAddSchoolOpen,
  bulkSchoolOpen, setBulkSchoolOpen,
  editSchool, setEditSchool,
  changePwdSchool, setChangePwdSchool,
  reloadSchools, handleDeleteSchool
}) {
  const [searchText, setSearchText] = useState("");
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [viewSchool, setViewSchool] = useState(null);

  useEffect(() => {
    const filtered = schools.filter(s =>
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredSchools(filtered);
  }, [schools, searchText]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-lg font-semibold text-athletiq-navy">🏫 Schools</h2>
        <div className="flex gap-2">
          <button onClick={() => setAddSchoolOpen(true)} className="px-3 py-1 text-sm bg-athletiq-green text-white rounded">
            + Add School
          </button>
          <button onClick={() => setBulkSchoolOpen(true)} className="px-3 py-1 text-sm bg-athletiq-blue text-white rounded">
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search school..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full md:w-1/2 px-3 py-1.5 text-sm border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-athletiq-blue"
        />
        <span className="text-xs text-gray-500 ml-4">{filteredSchools.length} shown</span>
      </div>

      {/* School Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSchools.map((s) => (
          <button
            key={s.id}
            onClick={() => setViewSchool(s)}
            className="w-full bg-white rounded-md shadow-sm border p-3 flex flex-col items-center text-center hover:shadow-md transition cursor-pointer hover:ring-2 hover:ring-athletiq-blue focus:outline-none"
          >
            {s.logo_url ? (
              <img
                src={`http://localhost:5000/uploads/${s.logo_url}`}
                alt={s.name}
                className="w-16 h-16 object-contain rounded-full bg-white border mb-2"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2 text-xs">
                No Logo
              </div>
            )}
            <h3 className="text-sm font-semibold text-athletiq-navy">{s.name}</h3>
            <p className="text-xs text-gray-600">{s.address}</p>
            <p className="text-xs text-gray-500">{s.email}</p>
            <p className="text-xs mt-1">
              <span className={s.is_active ? "text-green-600 font-medium" : "text-red-500"}>
                {s.is_active ? "Active" : "Inactive"}
              </span>
            </p>
          </button>
        ))}
      </div>

      {/* Modals */}
      <AddSchoolModal
        open={addSchoolOpen}
        onClose={() => setAddSchoolOpen(false)}
        onAdded={reloadSchools}
      />
      <EditSchoolModal
        open={!!editSchool}
        school={editSchool}
        onClose={() => setEditSchool(null)}
        onUpdated={reloadSchools}
      />
      <BulkSchoolUploadModal
        open={bulkSchoolOpen}
        onClose={() => setBulkSchoolOpen(false)}
        onUploaded={reloadSchools}
      />
      <ChangeAdminPasswordModal
        open={!!changePwdSchool}
        school={changePwdSchool}
        onClose={() => setChangePwdSchool(null)}
        onChanged={reloadSchools}
      />
      <ViewSchoolModal
        open={!!viewSchool}
        school={viewSchool}
        onClose={() => setViewSchool(null)}
        onChangePassword={(school) => setChangePwdSchool(school)} /* ✅ FIXED */
      />
    </div>
  );
}
