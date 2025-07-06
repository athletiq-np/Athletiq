import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAllTemplates, 
  getTemplatesByCategory, 
  templateCategories,
  createTournamentFromTemplate 
} from '../../../data/tournamentTemplates';

const TournamentTemplateSelector = ({ onTemplateSelect, onSkip }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const categories = ['All', ...Object.keys(templateCategories)];
  const templates = selectedCategory === 'All' 
    ? getAllTemplates() 
    : getTemplatesByCategory(selectedCategory);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      const tournamentData = createTournamentFromTemplate(selectedTemplate.id);
      onTemplateSelect(tournamentData);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Choose Tournament Template
        </h2>
        <p className="text-gray-600">
          Start with a pre-configured template or create from scratch
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <motion.button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category === 'All' ? 'All Templates' : templateCategories[category]?.name || category}
          </motion.button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <AnimatePresence>
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
                selectedTemplate?.id === template.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTemplateSelect(template)}
              whileHover={{ y: -2 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{template.icon}</div>
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: templateCategories[template.category]?.color }}
                  >
                    {template.category}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {template.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">
                  {template.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Format:</span>
                    <span className="font-medium capitalize">{template.config.format}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">{template.config.duration} days</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Sports:</span>
                    <span className="font-medium">{template.config.sports.length} sports</span>
                  </div>
                </div>

                {/* Sports Preview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {template.config.sports.slice(0, 3).map((sport) => (
                      <span 
                        key={sport}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {sport.replace('-', ' ')}
                      </span>
                    ))}
                    {template.config.sports.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{template.config.sports.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <motion.button
          onClick={onSkip}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Create from Scratch
        </motion.button>
        
        <motion.button
          onClick={handleUseTemplate}
          disabled={!selectedTemplate}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            selectedTemplate
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          whileHover={selectedTemplate ? { scale: 1.02 } : {}}
          whileTap={selectedTemplate ? { scale: 0.98 } : {}}
        >
          Use Template
        </motion.button>
      </div>

      {/* Template Details Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Template Details</h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <div>
                    <h4 className="font-medium">{selectedTemplate.name}</h4>
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <span className="ml-2 font-medium capitalize">{selectedTemplate.config.format}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.config.duration} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Registration:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.config.registrationDeadline} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Teams:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.config.maxTeamsPerSchool}/school</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500 text-sm">Age Categories:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTemplate.config.ageCategories.map((age) => (
                      <span key={age} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {age}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500 text-sm">Sports Included:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTemplate.config.sports.map((sport) => (
                      <span key={sport} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {sport.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUseTemplate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use This Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentTemplateSelector;
