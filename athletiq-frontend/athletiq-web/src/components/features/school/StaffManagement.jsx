// src/components/features/school/StaffManagement.jsx
import React from 'react';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaUser } from 'react-icons/fa';

export default function StaffManagement({ staff, onRefresh }) {
  const mockStaff = [
    { id: 1, name: 'John Doe', role: 'Principal', email: 'john@school.edu', phone: '9841234567', subjects: ['Administration'], photo: null },
    { id: 2, name: 'Jane Smith', role: 'Sports Teacher', email: 'jane@school.edu', phone: '9851234568', subjects: ['Football', 'Basketball'], photo: null },
    { id: 3, name: 'Bob Johnson', role: 'Coach', email: 'bob@school.edu', phone: '9861234569', subjects: ['Cricket', 'Athletics'], photo: null },
  ];

  const displayStaff = (staff && staff.length > 0) ? staff : mockStaff;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff & Coaches</h2>
          <p className="text-gray-600">Manage teaching staff and sports coaches</p>
        </div>
        <button className="bg-athletiq-blue text-white px-4 py-2 rounded-lg hover:bg-athletiq-navy transition-colors flex items-center space-x-2">
          <FaPlus className="h-4 w-4" />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects/Sports</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {member.photo ? (
                          <img className="h-10 w-10 rounded-full" src={member.photo} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FaUser className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.phone}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {(member.subjects && Array.isArray(member.subjects)) ? member.subjects.map((subject, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {subject}
                        </span>
                      )) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          No subjects assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
