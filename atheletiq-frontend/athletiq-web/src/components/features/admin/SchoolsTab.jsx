//
// 🧠 ATHLETIQ - Admin Schools Tab (Upgraded)
//
// This component is now more self-contained and robust. It manages its own state
// for modals and displays the school data in a clean, functional table.
//

import React, { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';

// --- All modal components are now imported via the clean '@' alias ---
import AddSchoolModal from '@/components/features/school/AddSchoolModal';
import EditSchoolModal from '@/components/features/school/EditSchoolModal';
import BulkSchoolUploadModal from '@/components/features/school/BulkSchoolUploadModal';
import ChangeAdminPasswordModal from '@/components/features/admin/ChangeAdminPasswordModal';
import ViewSchoolModal from '@/components/features/school/ViewSchoolModal';

// This component now only needs the list of schools and a function to refetch them.
export default function SchoolsTab({ schools, refetchSchools }) {
  // --- STATE MANAGEMENT ---
  // All state related to this tab is now managed here, not in the parent dashboard.
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchText, setSearchText] = useState('');

  // State for controlling modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState(null);
  const [schoolToView, setSchoolToView] = useState(null);
  const [schoolForPwdChange, setSchoolForPwdChange] = useState(null);


  // --- DATA HANDLING ---
  // Effect to filter schools whenever the search text or the main schools list changes.
  useEffect(() => {
    if (!searchText) {
      setFilteredSchools(schools);
    } else {
      const lowercasedSearch = searchText.toLowerCase();
      const filtered = schools.filter(s =>
        s.name.toLowerCase().includes(lowercasedSearch) ||
        s.school_code.toLowerCase().includes(lowercasedSearch) ||
        s.email?.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredSchools(filtered);
    }
  }, [schools, searchText]);

  // --- EVENT HANDLERS ---
  const handleDeleteSchool = async (schoolId) => {
    if (!window.confirm("Are you sure you want to delete this school? This action is permanent and will delete all associated players and teams.")) return;
    try {
      await apiClient.delete(`/schools/${schoolId}`); // Assuming a delete endpoint exists
      alert('School deleted successfully.');
      refetchSchools(); // Call the refetch function passed from the parent
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete school.");
    }
  };


  // --- RENDER ---
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with search and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search by name, code, or email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-athletiq-green"
        />
        <div className="flex gap-2">
          <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 text-sm font-semibold bg-athletiq-green text-white rounded-lg hover:bg-green-700">
            + Add New School
          </button>
          <button onClick={() => setIsBulkModalOpen(true)} className="px-4 py-2 text-sm font-semibold bg-athletiq-navy text-white rounded-lg hover:bg-navy-700">
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Schools Table - A more professional way to display data */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchools.map((school) => (
              <tr key={school.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-athletiq-navy">{school.name}</div>
                  <div className="text-xs text-gray-500">{school.school_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{school.address}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {school.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => setSchoolToView(school)} className="text-blue-600 hover:text-blue-900">View</button>
                  <button onClick={() => setSchoolToEdit(school)} className="text-green-600 hover:text-green-900">Edit</button>
                  <button onClick={() => setSchoolForPwdChange(school)} className="text-yellow-600 hover:text-yellow-900">Password</button>
                  <button onClick={() => handleDeleteSchool(school.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All modals are rendered here but are invisible until their state is triggered */}
      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refetchSchools}
      />
      <EditSchoolModal
        isOpen={!!schoolToEdit}
        onClose={() => setSchoolToEdit(null)}
        school={schoolToEdit}
        onSuccess={refetchSchools}
      />
      <BulkSchoolUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={refetchSchools}
      />
      <ChangeAdminPasswordModal
        isOpen={!!schoolForPwdChange}
        onClose={() => setSchoolForPwdChange(null)}
        school={schoolForPwdChange}
      />
      <ViewSchoolModal
        isOpen={!!schoolToView}
        onClose={() => setSchoolToView(null)}
        school={schoolToView}
      />
    </div>
  );
}