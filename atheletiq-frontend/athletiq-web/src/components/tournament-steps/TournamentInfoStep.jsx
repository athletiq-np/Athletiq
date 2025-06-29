//
// 🧠 ATHLETIQ - Tournament Info Step Component (Simplified)
//
// This is the first step in the tournament creation wizard. This simplified version
// collects only the most essential details: the tournament's name, logo, and organizer.
//

// --- MODULE IMPORTS ---
import React from 'react';

// --- COMPONENT DEFINITION ---

/**
 * Renders the simplified form fields for the first step of tournament creation.
 * @param {object} props - The props passed from the parent component.
 * @param {object} props.form - The current state of the form data.
 * @param {function} props.updateForm - The function to update the form state in the parent.
 */
export default function TournamentInfoStep({ form, updateForm }) {
  
  /**
   * Handles changes in any of the input fields.
   * It calls the parent's updateForm function with the new value.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The event object from the input field.
   */
  const handleChange = (e) => {
    updateForm({ [e.target.name]: e.target.value });
  };

  // --- RENDER ---
  // The UI is now focused on just three fields to keep it simple.
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">1. Tournament Details</h2>
      
      {/* Tournament Name Input */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">
          Tournament Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-athletiq-blue focus:border-athletiq-blue"
          placeholder="e.g., Annual Inter-School Football Cup"
          required
        />
      </div>

      {/* Hosted By (Organized By) Input */}
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
          placeholder="e.g., St. Xavier's School"
        />
      </div>
      
      {/* Logo URL Input */}
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

    </div>
  );
}