import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, Plus, Trash2, Upload } from 'lucide-react';
import { getTournamentTeams } from '../../../api/tournamentApi';

const CertificateGenerationModal = ({ isOpen, onClose, onSubmit, templates, tournamentId }) => {
  const [mode, setMode] = useState('single'); // 'single' or 'bulk'
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  
  // Single generation state
  const [singleForm, setSingleForm] = useState({
    participant_id: '',
    participant_type: 'player',
    template_id: '',
    certificate_type: 'participation',
    achievement_details: {}
  });

  // Bulk generation state
  const [bulkRequests, setBulkRequests] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedType, setSelectedType] = useState('participation');

  const [errors, setErrors] = useState({});

  // Load tournament data
  useEffect(() => {
    if (isOpen && tournamentId) {
      loadTournamentData();
    }
  }, [isOpen, tournamentId]);

  const loadTournamentData = async () => {
    try {
      const teamsRes = await getTournamentTeams(tournamentId);
      setTeams(teamsRes.data.teams || []);
      
      // Extract players from teams
      const allPlayers = [];
      teamsRes.data.teams?.forEach(team => {
        if (team.players) {
          team.players.forEach(player => {
            allPlayers.push({
              ...player,
              team_name: team.name
            });
          });
        }
      });
      setPlayers(allPlayers);
    } catch (error) {
      console.error('Error loading tournament data:', error);
    }
  };

  const handleSingleFormChange = (field, value) => {
    setSingleForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validation
    const newErrors = {};
    if (!singleForm.participant_id) newErrors.participant_id = 'Please select a participant';
    if (!singleForm.template_id) newErrors.template_id = 'Please select a template';
    if (!singleForm.certificate_type) newErrors.certificate_type = 'Please select certificate type';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(singleForm);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const addBulkRequest = (participantType) => {
    const participants = participantType === 'team' ? teams : players;
    
    participants.forEach(participant => {
      // Check if already added
      const exists = bulkRequests.some(req => 
        req.participant_id === participant.id && 
        req.participant_type === participantType
      );
      
      if (!exists) {
        setBulkRequests(prev => [...prev, {
          participant_id: participant.id,
          participant_type: participantType,
          participant_name: participant.name,
          template_id: selectedTemplate,
          certificate_type: selectedType,
          achievement_details: {}
        }]);
      }
    });
  };

  const removeBulkRequest = (index) => {
    setBulkRequests(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkSubmit = async () => {
    if (bulkRequests.length === 0) {
      setErrors({ submit: 'Please add at least one certificate request' });
      return;
    }

    if (!selectedTemplate) {
      setErrors({ submit: 'Please select a template for bulk generation' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Update all requests with selected template and type
      const updatedRequests = bulkRequests.map(req => ({
        ...req,
        template_id: selectedTemplate,
        certificate_type: selectedType
      }));
      
      await onSubmit(updatedRequests);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const certificateTypes = [
    { value: 'participation', label: 'Participation Certificate' },
    { value: 'winner', label: 'Winner Certificate' },
    { value: 'runner_up', label: 'Runner Up Certificate' },
    { value: 'achievement', label: 'Achievement Certificate' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
            Generate Certificates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-lg ${
                mode === 'single'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Single Certificate
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`px-4 py-2 rounded-lg ${
                mode === 'bulk'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulk Generation
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {mode === 'single' ? (
            /* Single Certificate Form */
            <form onSubmit={handleSingleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Participant Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participant Type *
                  </label>
                  <select
                    value={singleForm.participant_type}
                    onChange={(e) => handleSingleFormChange('participant_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="player">Player</option>
                    <option value="team">Team</option>
                  </select>
                </div>

                {/* Participant Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {singleForm.participant_type === 'team' ? 'Team' : 'Player'} *
                  </label>
                  <select
                    value={singleForm.participant_id}
                    onChange={(e) => handleSingleFormChange('participant_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.participant_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select {singleForm.participant_type}</option>
                    {(singleForm.participant_type === 'team' ? teams : players).map(participant => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name}
                        {singleForm.participant_type === 'player' && participant.team_name && 
                          ` (${participant.team_name})`
                        }
                      </option>
                    ))}
                  </select>
                  {errors.participant_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.participant_id}</p>
                  )}
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Template *
                  </label>
                  <select
                    value={singleForm.template_id}
                    onChange={(e) => handleSingleFormChange('template_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.template_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select template</option>
                    {templates.filter(t => t.is_active).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.template_type})
                      </option>
                    ))}
                  </select>
                  {errors.template_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>
                  )}
                </div>

                {/* Certificate Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Type *
                  </label>
                  <select
                    value={singleForm.certificate_type}
                    onChange={(e) => handleSingleFormChange('certificate_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {certificateTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Achievement Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievement Details (Optional)
                </label>
                <textarea
                  value={singleForm.achievement_details.description || ''}
                  onChange={(e) => handleSingleFormChange('achievement_details', {
                    ...singleForm.achievement_details,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the specific achievement or participation details..."
                />
              </div>

              {/* Error Display */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{errors.submit}</p>
                </div>
              )}
            </form>
          ) : (
            /* Bulk Generation Interface */
            <div className="p-6 space-y-6">
              {/* Bulk Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Bulk Generation Settings</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select template</option>
                      {templates.filter(t => t.is_active).map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {certificateTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Participants */}
              <div className="flex space-x-4">
                <button
                  onClick={() => addBulkRequest('player')}
                  disabled={!selectedTemplate}
                  className="flex-1 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Add All Players ({players.length})
                </button>
                <button
                  onClick={() => addBulkRequest('team')}
                  disabled={!selectedTemplate}
                  className="flex-1 bg-green-50 text-green-700 px-4 py-3 rounded-lg hover:bg-green-100 disabled:opacity-50 flex items-center justify-center"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Add All Teams ({teams.length})
                </button>
              </div>

              {/* Bulk Requests List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    Certificate Requests ({bulkRequests.length})
                  </h3>
                  {bulkRequests.length > 0 && (
                    <button
                      onClick={() => setBulkRequests([])}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {bulkRequests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No certificate requests added yet.</p>
                      <p className="text-sm">Select a template and add participants above.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {bulkRequests.map((request, index) => (
                        <div key={index} className="p-3 flex items-center justify-between">
                          <div className="flex items-center">
                            {request.participant_type === 'team' ? (
                              <Trophy className="h-4 w-4 text-blue-500 mr-2" />
                            ) : (
                              <Users className="h-4 w-4 text-green-500 mr-2" />
                            )}
                            <span className="font-medium">{request.participant_name}</span>
                            <span className="ml-2 text-sm text-gray-500 capitalize">
                              ({request.participant_type})
                            </span>
                          </div>
                          <button
                            onClick={() => removeBulkRequest(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={mode === 'single' ? handleSingleSubmit : handleBulkSubmit}
            disabled={loading || (mode === 'bulk' && bulkRequests.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Generate {mode === 'bulk' ? `${bulkRequests.length} ` : ''}Certificate{mode === 'bulk' && bulkRequests.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerationModal;
