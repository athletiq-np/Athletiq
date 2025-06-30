// src/components/tournament-steps/TournamentConfigStep.jsx

// 🧠 ATHLETIQ - Tournament Configuration Step (Input Only)
// This is the third step in the tournament creation wizard.
// It focuses solely on collecting detailed configuration inputs for each selected sport,
// without immediate bracket generation or display.

// --- MODULE IMPORTS ---
import React, { useState } from 'react'; // Only useState needed now
import { motion, AnimatePresence } from 'framer-motion';

// Removed bracket-generator and DoubleEliminationBracket imports
// import { generateKnockoutBracket, generateRoundRobinFixtures } from 'bracket-generator';
// import DoubleEliminationBracket from './brackets/DoubleEliminationBracket';

// --- HELPER FUNCTIONS ---
// generateUniqueId is not used in this simplified version, can be removed if not used elsewhere
// const generateUniqueId = () => Date.now() + Math.random().toString(36).substring(2, 9);

// --- COMPONENT DEFINITION ---
/**
 * Renders the form fields for detailed sport configuration.
 * @param {object} props - The props passed from the parent component.
 * @param {object} props.form - The current state of the form data, containing `sports_config`.
 * @param {function} props.updateForm - The function to update the form state in the parent.
 */
export default function TournamentConfigStep({ form, updateForm }) {
  // State to manage which sport's accordion panel is open
  const [openSportId, setOpenSportId] = useState(null);
  // Removed participantInput and generatedFixtures states

  /**
   * Toggles the open state of a sport configuration panel.
   * @param {string} sportInstanceId - The unique ID of the sport instance.
   */
  const toggleSportPanel = (sportInstanceId) => {
    setOpenSportId(openSportId === sportInstanceId ? null : sportInstanceId);
  };

  /**
   * Handles changes to input fields within a specific sport's configuration.
   * Updates the parent form state.
   * @param {string} sportInstanceId - The unique ID of the sport instance being updated.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e - The event object.
   */
  const handleSportConfigChange = (sportInstanceId, e) => {
    const { name, value } = e.target;
    const updatedSportsConfig = form.sports_config.map(sport =>
      sport.instanceId === sportInstanceId ? { ...sport, [name]: value } : sport
    );
    updateForm({ sports_config: updatedSportsConfig });
  };

  // Removed handleGenerateBracket and renderFixtures functions

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">3. Configure Sports Details</h2> {/* Updated title */}

      {form.sports_config.length === 0 && (
        <div className="text-center text-gray-500 p-8 border-2 border-dashed rounded-lg">
          Please go back to "Sports & Format" to add sports first.
        </div>
      )}

      <div className="space-y-4">
        {form.sports_config.map((sportConfig, index) => (
          <div key={sportConfig.instanceId} className="border rounded-lg shadow-sm">
            {/* Sport Header (Clickable for Accordion) */}
            <div
              className="flex justify-between items-center p-4 bg-gray-100 cursor-pointer rounded-t-lg"
              onClick={() => toggleSportPanel(sportConfig.instanceId)}
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {sportConfig.icon} {sportConfig.name} Configuration
              </h3>
              <span className="text-gray-600">
                {openSportId === sportConfig.instanceId ? '▲' : '▼'}
              </span>
            </div>

            {/* Collapsible Content for Sport Configuration */}
            <AnimatePresence>
              {openSportId === sportConfig.instanceId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 border-t bg-white rounded-b-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Gender Category */}
                    <div>
                      <label htmlFor={`gender-${sportConfig.instanceId}`} className="block text-sm font-medium text-gray-600 mb-1">
                        Gender Category
                      </label>
                      <select
                        id={`gender-${sportConfig.instanceId}`}
                        name="gender"
                        value={sportConfig.gender || ''}
                        onChange={(e) => handleSportConfigChange(sportConfig.instanceId, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>

                    {/* Age Group - DROPDOWN */}
                    <div>
                      <label htmlFor={`age_group-${sportConfig.instanceId}`} className="block text-sm font-medium text-gray-600 mb-1">
                        Age Group
                      </label>
                      <select
                        id={`age_group-${sportConfig.instanceId}`}
                        name="age_group"
                        value={sportConfig.age_group || ''}
                        onChange={(e) => handleSportConfigChange(sportConfig.instanceId, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        required 
                      >
                        <option value="">Select Age Group</option>
                        {Array.from({ length: 9 }, (_, i) => `U${10 + i}`).map(age => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </div>

                    {/* NEW FIELD: Number of Participating Teams (Conditional for TEAM sports) */}
                    {sportConfig.type === 'team' && (
                      <div>
                        <label htmlFor={`num_participating_teams-${sportConfig.instanceId}`} className="block text-sm font-medium text-gray-600 mb-1">
                          Number of Participating Teams
                        </label>
                        <input
                          type="number"
                          id={`num_participating_teams-${sportConfig.instanceId}`}
                          name="num_participating_teams"
                          value={sportConfig.num_participating_teams || ''}
                          onChange={(e) => handleSportConfigChange(sportConfig.instanceId, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          placeholder="e.g., 8, 16"
                          min="0" // Allow 0 to indicate not set yet
                        />
                      </div>
                    )}

                    {/* NEW FIELD: Number of Team Members (Total, incl. subs & extras) - Conditional for TEAM sports */}
                    {sportConfig.type === 'team' && (
                      <div>
                        <label htmlFor={`team_members_total-${sportConfig.instanceId}`} className="block text-sm font-medium text-gray-600 mb-1">
                          Number of Team Members (Total, incl. subs & extras)
                        </label>
                        <input
                          type="number"
                          id={`team_members_total-${sportConfig.instanceId}`}
                          name="team_members_total"
                          value={sportConfig.team_members_total || ''}
                          onChange={(e) => handleSportConfigChange(sportConfig.instanceId, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          placeholder={`Min: ${sportConfig.team_members_min || 'N/A'}, Max: ${sportConfig.team_members_max || 'N/A'}`}
                          min={sportConfig.team_members_min || 1}
                          max={sportConfig.team_members_max || 99}
                        />
                      </div>
                    )}


                    {/* NEW FIELD: Format (Dynamic Dropdown for ALL sports) */}
                    <div>
                      <label htmlFor={`format-${sportConfig.instanceId}`} className="block text-sm font-medium text-gray-600 mb-1">
                        Format
                      </label>
                      <select
                        id={`format-${sportConfig.instanceId}`}
                        name="format"
                        value={sportConfig.format || ''}
                        onChange={(e) => handleSportConfigChange(sportConfig.instanceId, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        required
                      >
                        <option value="">Select Format</option>
                        {sportConfig.formats && sportConfig.formats.map(format => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Tournament Type (Dynamic Dropdown for ALL sports) */}
                    <div>
                      <label htmlFor={`tournament_type-${sportConfig.instanceId}`} className="block text-sm font-medium text-gray-600 mb-1">
                        Tournament Type
                      </label>
                      <select
                        id={`tournament_type-${sportConfig.instanceId}`}
                        name="tournament_type"
                        value={sportConfig.tournament_type || ''}
                        onChange={(e) => handleSportConfigChange(sportConfig.instanceId, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        required
                      >
                        <option value="">Select Type</option>
                        {sportConfig.tournament_types && sportConfig.tournament_types.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Removed the Participant Input for Bracket Generation and Generate Button */}
                  {/* Removed the Display Generated Fixtures */}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
