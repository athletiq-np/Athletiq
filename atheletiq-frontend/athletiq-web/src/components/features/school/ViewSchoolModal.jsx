//
// 🧠 ATHLETIQ - View School Details Modal
//
// This component displays detailed information about a single school in a modal.
// It is a "dumb" component that simply receives data and functions as props.
//

import React from 'react';
import { FaTimes, FaBuilding, FaMapMarkerAlt, FaEnvelope, FaUserTie } from 'react-icons/fa';

export default function ViewSchoolModal({ isOpen, onClose, school }) {
  // --- Guard Clause ---
  // If the modal isn't open or there's no school data, render nothing.
  // This prevents errors if the component is rendered with null props.
  if (!isOpen || !school) {
    return null;
  }

  // --- Data Display Helper ---
  // A small component to render each detail item consistently.
  const DetailItem = ({ icon, label, value }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">{value || 'Not Provided'}</dd>
    </div>
  );

  return (
    // Modal backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
      {/* Modal panel */}
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl m-4 animate-fade-in-up">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-2xl font-bold text-athletiq-navy">{school.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <FaTimes size={22} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="mt-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
            <DetailItem icon={<FaBuilding />} label="School Code" value={school.school_code} />
            <DetailItem icon={<FaMapMarkerAlt />} label="Full Address" value={school.address} />
            <DetailItem icon={<FaEnvelope />} label="School Email" value={school.email} />
            <DetailItem icon={<FaUserTie />} label="Principal Name" value={school.principal_name} />
            {/* You can add more details from your database schema here */}
          </dl>
        </div>

        {/* Modal Footer with Actions */}
        <div className="mt-8 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}