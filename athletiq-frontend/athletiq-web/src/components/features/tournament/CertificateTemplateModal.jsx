import React, { useState, useEffect } from 'react';
import { X, Upload, Eye, Save, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { validateCertificateTemplate } from '../../../api/certificateApi';

const CertificateTemplateModal = ({ isOpen, onClose, onSubmit, template = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'participation',
    template_data: {
      layout: 'classic',
      colors: {
        primary: '#1e40af',
        secondary: '#64748b',
        accent: '#f59e0b'
      },
      fonts: {
        title: 'serif',
        body: 'sans-serif'
      },
      elements: {
        logo: true,
        border: true,
        signature: true,
        date: true,
        verification_code: true
      },
      content: {
        title: 'Certificate of {type}',
        subtitle: 'This is to certify that',
        body: '{participant_name} has successfully {achievement}',
        footer: 'Tournament: {tournament_name}'
      }
    },
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize form with template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        template_type: template.template_type || 'participation',
        template_data: template.template_data || formData.template_data,
        is_active: template.is_active !== undefined ? template.is_active : true
      });
    }
  }, [template]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleTemplateDataChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        [category]: {
          ...prev.template_data[category],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate form data
    const validation = validateCertificateTemplate(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
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

  const layoutOptions = [
    { value: 'classic', label: 'Classic Layout' },
    { value: 'modern', label: 'Modern Layout' },
    { value: 'elegant', label: 'Elegant Layout' },
    { value: 'minimal', label: 'Minimal Layout' }
  ];

  const fontOptions = [
    { value: 'serif', label: 'Serif (Traditional)' },
    { value: 'sans-serif', label: 'Sans-serif (Modern)' },
    { value: 'script', label: 'Script (Elegant)' },
    { value: 'display', label: 'Display (Bold)' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit' : 'Create'} Certificate Template
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <Eye className="mr-1 h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {previewMode ? (
            <CertificatePreview template={formData} />
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter template name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Type *
                  </label>
                  <select
                    value={formData.template_type}
                    onChange={(e) => handleInputChange('template_type', e.target.value)}
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

              {/* Layout Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Design Settings
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Layout Style
                    </label>
                    <select
                      value={formData.template_data.layout}
                      onChange={(e) => handleTemplateDataChange('layout', null, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {layoutOptions.map(layout => (
                        <option key={layout.value} value={layout.value}>
                          {layout.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={formData.template_data.colors.primary}
                      onChange={(e) => handleTemplateDataChange('colors', 'primary', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Font Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Font
                    </label>
                    <select
                      value={formData.template_data.fonts.title}
                      onChange={(e) => handleTemplateDataChange('fonts', 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {fontOptions.map(font => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Font
                    </label>
                    <select
                      value={formData.template_data.fonts.body}
                      onChange={(e) => handleTemplateDataChange('fonts', 'body', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {fontOptions.map(font => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Type className="mr-2 h-5 w-5" />
                  Content Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Title
                    </label>
                    <input
                      type="text"
                      value={formData.template_data.content.title}
                      onChange={(e) => handleTemplateDataChange('content', 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Certificate of {type}"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use {'{type}'} for certificate type, {'{tournament_name}'} for tournament name
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Body
                    </label>
                    <textarea
                      value={formData.template_data.content.body}
                      onChange={(e) => handleTemplateDataChange('content', 'body', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="This certifies that {participant_name} has successfully {achievement}"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use {'{participant_name}'}, {'{achievement}'}, {'{date}'} as placeholders
                    </p>
                  </div>
                </div>
              </div>

              {/* Elements Toggle */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Certificate Elements
                </h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(formData.template_data.elements).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleTemplateDataChange('elements', key, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {key.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Make this template active
                </label>
              </div>

              {/* Error Display */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{errors.submit}</p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!previewMode && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {template ? 'Update' : 'Create'} Template
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Certificate Preview Component
const CertificatePreview = ({ template }) => {
  const previewData = {
    participant_name: 'John Doe',
    tournament_name: 'Summer Championship 2025',
    type: template.template_type,
    achievement: 'participated in',
    date: new Date().toLocaleDateString()
  };

  const replaceTemplateVars = (text, data) => {
    return text.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
  };

  return (
    <div className="p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white border-2 border-gray-300 rounded-lg p-8" 
           style={{ 
             fontFamily: template.template_data.fonts.body === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif',
             borderColor: template.template_data.colors.primary 
           }}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" 
              style={{ 
                color: template.template_data.colors.primary,
                fontFamily: template.template_data.fonts.title === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif'
              }}>
            {replaceTemplateVars(template.template_data.content.title, previewData)}
          </h1>
          {template.template_data.content.subtitle && (
            <p className="text-gray-600 text-lg">
              {replaceTemplateVars(template.template_data.content.subtitle, previewData)}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="text-center mb-8">
          <p className="text-lg text-gray-800 leading-relaxed">
            {replaceTemplateVars(template.template_data.content.body, previewData)}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          {template.template_data.content.footer && (
            <p className="text-sm text-gray-600 mb-4">
              {replaceTemplateVars(template.template_data.content.footer, previewData)}
            </p>
          )}
          
          {template.template_data.elements.date && (
            <p className="text-sm text-gray-500">
              Issued on: {previewData.date}
            </p>
          )}
          
          {template.template_data.elements.verification_code && (
            <p className="text-xs text-gray-400 mt-2">
              Verification Code: ABC123XYZ
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplateModal;
