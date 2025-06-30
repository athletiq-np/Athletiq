//
// 🧠 ATHLETIQ - Tournament Info Step Component (Complete Version)
//
// This is the first step in the tournament creation wizard. It collects
// core tournament metadata like name, dates, level, description, etc.
//

import React from 'react';

export default function TournamentInfoStep({ form, updateForm }) {
  const handleChange = (e) => {
    updateForm({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">1. Tournament Details</h2>

      {/* Tournament Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">
          Tournament Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name || ''}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
          placeholder="e.g., Inter-Province School Football Cup"
        />
      </div>

      {/* Hosted By */}
      <div>
        <label htmlFor="hosted_by" className="block text-sm font-medium text-gray-600 mb-1">
          Organized By
        </label>
        <input
          type="text"
          id="hosted_by"
          name="hosted_by"
          value={form.hosted_by || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
          placeholder="e.g., Koshi Province Sports Federation"
        />
      </div>

      {/* Logo URL */}
      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-600 mb-1">
          Logo URL (Optional)
        </label>
        <input
          type="text"
          id="logo_url"
          name="logo_url"
          value={form.logo_url || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
          placeholder="https://example.com/logo.png"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
          placeholder="Brief overview of the tournament"
        ></textarea>
      </div>

      {/* Level */}
      <div>
        <label htmlFor="level" className="block text-sm font-medium text-gray-600 mb-1">
          Tournament Level (e.g., Province, National, School)
        </label>
        <input
          type="text"
          id="level"
          name="level"
          value={form.level || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
        />
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="start_date" className="block text-sm font-medium text-gray-600 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="start_date"
          name="start_date"
          value={form.start_date || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
        />
      </div>

      {/* End Date */}
      <div>
        <label htmlFor="end_date" className="block text-sm font-medium text-gray-600 mb-1">
          End Date
        </label>
        <input
          type="date"
          id="end_date"
          name="end_date"
          value={form.end_date || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
        />
      </div>
    </div>
  );
}
