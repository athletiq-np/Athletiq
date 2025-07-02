import React, { useState, useEffect } from 'react';
// import AddSchoolModal from '@/components/features/school/AddSchoolModal'; // We will build these modals next

export default function SchoolsTab({ schools, refetchData }) {
  // KEPT: Your logic for client-side searching
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchText, setSearchText] = useState('');

  // UPGRADE: Component now manages its own state for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  // Add other modal states here as needed (e.g., const [schoolToEdit, setSchoolToEdit] = useState(null);)

  useEffect(() => {
    const lowercasedSearch = searchText.toLowerCase();
    setFilteredSchools(
      schools.filter(s =>
        s.name.toLowerCase().includes(lowercasedSearch) ||
        s.school_code.toLowerCase().includes(lowercasedSearch)
      )
    );
  }, [schools, searchText]);

  return (
    <div className="space-y-6">
      {/* KEPT: Your header with Search Bar and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search schools by name or code..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 text-sm border rounded-lg shadow-sm"
        />
        <div className="flex gap-2">
          <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 text-sm font-semibold bg-athletiq-green text-white rounded-lg hover:bg-green-700">
            + Add School
          </button>
          <button onClick={() => setIsBulkModalOpen(true)} className="px-4 py-2 text-sm font-semibold bg-athletiq-navy text-white rounded-lg hover:bg-navy-700">
            Bulk Upload
          </button>
        </div>
      </div>

      {/* KEPT: Your UI for displaying schools (upgraded to a table for scalability) */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchools.map((school) => (
              <tr key={school.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-athletiq-navy">{school.name}</div>
                  <div className="text-xs text-gray-500">{school.school_code}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{school.address}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {school.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">View</button>
                  <button className="text-green-600 hover:text-green-900">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* We will build out the modals here in the next steps */}
      {/* <AddSchoolModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={refetchData} /> */}
    </div>
  );
}