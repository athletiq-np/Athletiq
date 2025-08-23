import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEdit, FaTrash, FaCopy, FaEye, FaDownload,
  FaTrophy, FaUsers, FaCalendarAlt, FaCog, FaSave,
  FaTimes, FaCheck, FaFilter, FaSearch, FaFileExport
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  getAllTemplates, 
  getTemplatesByCategory, 
  templateCategories,
  createTournamentFromTemplate,
  saveCustomTemplate
} from '../../data/tournamentTemplates';

/**
 * 🏆 Tournament Template Manager
 * Advanced template creation and management system
 */
const TournamentTemplateManager = () => {
  const { theme } = useTheme();
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'Sports',
    sport: '',
    format: 'single-elimination',
    maxTeams: 16,
    minTeams: 4,
    estimatedDuration: '1 day',
    rules: '',
    scoringSystem: 'standard',
    advancementRules: 'winner-advances',
    tiebreakers: ['head-to-head', 'point-differential'],
    customSettings: {
      allowByes: true,
      randomSeeding: false,
      consolationBracket: false,
      thirdPlaceMatch: true
    },
    requiredFields: ['team-name', 'participants'],
    optionalFields: ['coach', 'contact'],
    notifications: {
      tournamentStart: true,
      matchUpdates: true,
      elimination: true,
      completion: true
    }
  });

  const formatOptions = [
    { value: 'single-elimination', label: 'Single Elimination' },
    { value: 'double-elimination', label: 'Double Elimination' },
    { value: 'round-robin', label: 'Round Robin' },
    { value: 'swiss', label: 'Swiss System' },
    { value: 'group-stage', label: 'Group Stage + Knockout' },
    { value: 'ladder', label: 'Ladder Tournament' }
  ];

  const sportOptions = [
    'Basketball', 'Football', 'Soccer', 'Tennis', 'Volleyball', 
    'Baseball', 'Swimming', 'Track & Field', 'Wrestling', 'Chess',
    'Esports', 'Debate', 'Academic', 'Other'
  ];

  const scoringOptions = [
    { value: 'standard', label: 'Standard (Win/Loss)' },
    { value: 'points', label: 'Points Based' },
    { value: 'time', label: 'Time Based' },
    { value: 'custom', label: 'Custom Scoring' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchTerm]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Load built-in templates
      const builtInTemplates = getAllTemplates();
      
      // Load custom templates from API
      const response = await apiClient.get('/schools/me/tournament-templates');
      const customTemplates = response.data.data || [];
      
      setTemplates([...builtInTemplates, ...customTemplates]);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback to built-in templates only
      setTemplates(getAllTemplates());
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.sport?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const saveTemplate = async () => {
    try {
      const templateData = {
        ...newTemplate,
        id: editingTemplate?.id || `custom-${Date.now()}`,
        isCustom: true,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user' // Replace with actual user ID
      };

      if (editingTemplate) {
        // Update existing template
        const response = await apiClient.put(`/schools/me/tournament-templates/${editingTemplate.id}`, templateData);
        if (response.data.success) {
          toast.success('Template updated successfully!');
        }
      } else {
        // Create new template
        const response = await apiClient.post('/schools/me/tournament-templates', templateData);
        if (response.data.success) {
          toast.success('Template created successfully!');
        }
      }

      setShowCreateModal(false);
      setEditingTemplate(null);
      resetNewTemplate();
      loadTemplates();
    } catch (error) {
      toast.error(editingTemplate ? 'Failed to update template' : 'Failed to create template');
      console.error('Error saving template:', error);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await apiClient.delete(`/schools/me/tournament-templates/${templateId}`);
      if (response.data.success) {
        toast.success('Template deleted successfully!');
        loadTemplates();
      }
    } catch (error) {
      toast.error('Failed to delete template');
      console.error('Error deleting template:', error);
    }
  };

  const duplicateTemplate = async (template) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      id: `custom-${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await apiClient.post('/schools/me/tournament-templates', duplicatedTemplate);
      if (response.data.success) {
        toast.success('Template duplicated successfully!');
        loadTemplates();
      }
    } catch (error) {
      toast.error('Failed to duplicate template');
      console.error('Error duplicating template:', error);
    }
  };

  const exportTemplate = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Template exported successfully!');
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      category: 'Sports',
      sport: '',
      format: 'single-elimination',
      maxTeams: 16,
      minTeams: 4,
      estimatedDuration: '1 day',
      rules: '',
      scoringSystem: 'standard',
      advancementRules: 'winner-advances',
      tiebreakers: ['head-to-head', 'point-differential'],
      customSettings: {
        allowByes: true,
        randomSeeding: false,
        consolationBracket: false,
        thirdPlaceMatch: true
      },
      requiredFields: ['team-name', 'participants'],
      optionalFields: ['coach', 'contact'],
      notifications: {
        tournamentStart: true,
        matchUpdates: true,
        elimination: true,
        completion: true
      }
    });
  };

  const startEditTemplate = (template) => {
    setNewTemplate(template);
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const TemplateCard = ({ template }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{template.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <FaTrophy className="mr-1" />
              {template.format}
            </span>
            <span className="flex items-center">
              <FaUsers className="mr-1" />
              {template.minTeams}-{template.maxTeams} teams
            </span>
            <span className="flex items-center">
              <FaCalendarAlt className="mr-1" />
              {template.estimatedDuration}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            template.category === 'Sports' ? 'bg-blue-100 text-blue-800' :
            template.category === 'Academic' ? 'bg-green-100 text-green-800' :
            template.category === 'Special Events' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {template.category}
          </span>
          {template.isCustom && (
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
              Custom
            </span>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewTemplate(template)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Preview Template"
            >
              <FaEye />
            </button>
            <button
              onClick={() => exportTemplate(template)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Export Template"
            >
              <FaDownload />
            </button>
            <button
              onClick={() => duplicateTemplate(template)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Duplicate Template"
            >
              <FaCopy />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {template.isCustom && (
              <>
                <button
                  onClick={() => startEditTemplate(template)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit Template"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Template"
                >
                  <FaTrash />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const CreateTemplateModal = () => (
    <AnimatePresence>
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'Create Tournament Template'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                  resetNewTemplate();
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Inter-School Basketball Championship"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the tournament format"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(templateCategories).map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport
                    </label>
                    <select
                      value={newTemplate.sport}
                      onChange={(e) => setNewTemplate({...newTemplate, sport: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Sport</option>
                      {sportOptions.map(sport => (
                        <option key={sport} value={sport}>
                          {sport}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tournament Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Tournament Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Format
                  </label>
                  <select
                    value={newTemplate.format}
                    onChange={(e) => setNewTemplate({...newTemplate, format: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {formatOptions.map(format => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Teams
                    </label>
                    <input
                      type="number"
                      value={newTemplate.minTeams}
                      onChange={(e) => setNewTemplate({...newTemplate, minTeams: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Teams
                    </label>
                    <input
                      type="number"
                      value={newTemplate.maxTeams}
                      onChange={(e) => setNewTemplate({...newTemplate, maxTeams: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={newTemplate.estimatedDuration}
                    onChange={(e) => setNewTemplate({...newTemplate, estimatedDuration: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1 day, 2 weeks, 1 month"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scoring System
                  </label>
                  <select
                    value={newTemplate.scoringSystem}
                    onChange={(e) => setNewTemplate({...newTemplate, scoringSystem: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {scoringOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Tournament Rules</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.customSettings.allowByes}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          customSettings: {
                            ...newTemplate.customSettings,
                            allowByes: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Allow byes in brackets</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.customSettings.randomSeeding}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          customSettings: {
                            ...newTemplate.customSettings,
                            randomSeeding: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Random seeding</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.customSettings.consolationBracket}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          customSettings: {
                            ...newTemplate.customSettings,
                            consolationBracket: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Consolation bracket</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.customSettings.thirdPlaceMatch}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          customSettings: {
                            ...newTemplate.customSettings,
                            thirdPlaceMatch: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Third place match</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.notifications.tournamentStart}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          notifications: {
                            ...newTemplate.notifications,
                            tournamentStart: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Tournament start notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.notifications.matchUpdates}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          notifications: {
                            ...newTemplate.notifications,
                            matchUpdates: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Match update notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.notifications.elimination}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          notifications: {
                            ...newTemplate.notifications,
                            elimination: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Elimination notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.notifications.completion}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          notifications: {
                            ...newTemplate.notifications,
                            completion: e.target.checked
                          }
                        })}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Tournament completion notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                  resetNewTemplate();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaSave className="mr-2" />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Tournament Templates
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Create, manage, and customize tournament templates for your school
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'bg-athletiq-blue-600 hover:bg-athletiq-blue-700 text-white' 
              : 'bg-athletiq-blue-600 hover:bg-athletiq-blue-700 text-white'
          }`}
        >
          <FaPlus className="mr-2" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Search Templates
            </label>
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-athletiq-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-athletiq-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-athletiq-blue-500'
                }`}
                placeholder="Search by name, sport, or description..."
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-athletiq-blue-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-athletiq-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-athletiq-blue-500'
              }`}
            >
              <option value="All">All Categories</option>
              {Object.keys(templateCategories).map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FaTrophy className={`mx-auto text-4xl mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            No templates found matching your criteria
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-athletiq-blue-600 hover:bg-athletiq-blue-700 text-white rounded-lg transition-colors"
          >
            Create Your First Template
          </button>
        </div>
      )}

      <CreateTemplateModal />
    </div>
  );
};

export default TournamentTemplateManager;
