// src/components/features/school/BulkAthleteRegistration.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUpload, FaDownload, FaCheck, FaTimes, FaSpinner, FaFileExcel,
  FaUsers, FaExclamationTriangle, FaCheckCircle, FaCloudUploadAlt,
  FaFileAlt, FaArrowRight, FaChartLine, FaBell
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';

export default function BulkAthleteRegistration({ school, onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const steps = [
    { id: 1, title: 'Download Template', description: 'Get CSV template' },
    { id: 2, title: 'Upload File', description: 'Upload filled CSV' },
    { id: 3, title: 'Validate Data', description: 'Check for errors' },
    { id: 4, title: 'Process Registration', description: 'Complete registration' }
  ];

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/api/bulk-registration/template', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `athlete_registration_template_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully!');
      setCurrentStep(2);
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Download error:', error);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setValidation(null);
    setResults(null);
    setCurrentStep(3);
  };

  const handleDragEvents = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    handleDragEvents(e);
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleValidateFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    try {
      setProcessing(true);
      const response = await apiClient.post('/api/bulk-registration/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setValidation(response.data.validation);
      
      if (response.data.validation.is_valid) {
        toast.success(`Validation successful! ${response.data.validation.total_rows} athletes ready for registration`);
        setCurrentStep(4);
      } else {
        toast.error(`Validation failed. ${response.data.validation.errors.length} errors found`);
      }
    } catch (error) {
      toast.error('File validation failed');
      console.error('Validation error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessRegistration = async () => {
    if (!selectedFile || !validation?.is_valid) return;

    const formData = new FormData();
    formData.append('csvFile', selectedFile);
    if (school?.id) {
      formData.append('school_id', school.id);
    }

    try {
      setProcessing(true);
      const response = await apiClient.post('/api/bulk-registration/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResults(response.data);
      toast.success(`Registration complete! ${response.data.results.successful_registrations} athletes registered successfully`);
      
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      toast.error('Registration processing failed');
      console.error('Processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setValidation(null);
    setResults(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <FaUsers className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Bulk Athlete Registration</h2>
                <p className="text-green-100">Register multiple athletes at once</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${currentStep >= step.id 
                      ? 'bg-white text-green-600 border-white' 
                      : 'border-green-300 text-green-300'
                    }`}>
                    {currentStep > step.id ? <FaCheck /> : step.id}
                  </div>
                  <div className="ml-3 text-sm">
                    <div className={`font-medium ${currentStep >= step.id ? 'text-white' : 'text-green-300'}`}>
                      {step.title}
                    </div>
                    <div className={`${currentStep >= step.id ? 'text-green-100' : 'text-green-300'}`}>
                      {step.description}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-white' : 'bg-green-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {/* Step 1: Download Template */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <div className="bg-blue-50 rounded-xl p-8">
                  <FaFileExcel className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Download CSV Template</h3>
                  <p className="text-gray-600 mb-6">
                    Download our template file to ensure your data is formatted correctly for bulk registration.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 mb-6 text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Template includes:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Required fields: Full Name, Date of Birth, Gender, Grade</li>
                      <li>• Optional fields: Section, Guardian Details, Address</li>
                      <li>• Sample data for reference</li>
                      <li>• Format validation guidelines</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleDownloadTemplate}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <FaDownload />
                    <span>Download Template</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Upload File */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 text-center">Upload Your CSV File</h3>
                
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragEnter={(e) => { handleDragEvents(e); setDragOver(true); }}
                  onDragLeave={(e) => { handleDragEvents(e); setDragOver(false); }}
                  onDragOver={handleDragEvents}
                  onDrop={handleDrop}
                >
                  <FaCloudUploadAlt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      Drag and drop your CSV file here
                    </p>
                    <p className="text-gray-600">or</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Maximum file size: 5MB • CSV format only • Up to 100 athletes
                  </p>
                </div>

                {selectedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FaFileAlt className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{selectedFile.name}</p>
                        <p className="text-sm text-green-600">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Validate Data */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 text-center">Validate Your Data</h3>
                
                {!validation && (
                  <div className="text-center">
                    <button
                      onClick={handleValidateFile}
                      disabled={processing}
                      className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 mx-auto disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          <span>Validate File</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {validation && (
                  <div className="space-y-4">
                    <div className={`rounded-lg p-4 ${
                      validation.is_valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {validation.is_valid ? (
                          <FaCheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                        )}
                        <div>
                          <h4 className={`font-medium ${
                            validation.is_valid ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {validation.is_valid ? 'Validation Successful!' : 'Validation Failed'}
                          </h4>
                          <p className={`text-sm ${
                            validation.is_valid ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {validation.is_valid 
                              ? `${validation.total_rows} athletes ready for registration`
                              : `${validation.errors.length} errors found`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {validation.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h5 className="font-medium text-red-800 mb-2">Errors to fix:</h5>
                        <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                          {validation.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.preview && validation.preview.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-2">Data Preview:</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                {Object.keys(validation.preview[0]).map(key => (
                                  <th key={key} className="text-left p-2 font-medium text-gray-700">
                                    {key.replace('*', '')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {validation.preview.slice(0, 3).map((row, index) => (
                                <tr key={index} className="border-b">
                                  {Object.values(row).map((value, i) => (
                                    <td key={i} className="p-2 text-gray-600">{value}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Process Registration */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 text-center">Process Registration</h3>
                
                {!results && (
                  <div className="text-center">
                    <div className="bg-blue-50 rounded-xl p-6 mb-6">
                      <FaUsers className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-700 mb-4">
                        Ready to register {validation?.total_rows} athletes with Nepal Athlete IDs
                      </p>
                      <p className="text-sm text-gray-600">
                        Guardian notifications will be sent automatically where contact information is provided
                      </p>
                    </div>
                    
                    <button
                      onClick={handleProcessRegistration}
                      disabled={processing}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>Processing Registration...</span>
                        </>
                      ) : (
                        <>
                          <FaArrowRight />
                          <span>Start Registration</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {results && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <FaCheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-green-800 mb-2">Registration Complete!</h4>
                      <p className="text-green-600">
                        {results.results.successful_registrations} out of {results.results.total_processed} athletes registered successfully
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <FaCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {results.results.successful_registrations}
                        </div>
                        <div className="text-sm text-gray-600">Successful</div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <FaTimes className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-600">
                          {results.results.failed_registrations}
                        </div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <FaBell className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {results.report?.notifications_sent || 0}
                        </div>
                        <div className="text-sm text-gray-600">Notifications Sent</div>
                      </div>
                    </div>

                    {results.athletes && results.athletes.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-3">Registered Athletes:</h5>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {results.athletes.map((athlete, index) => (
                            <div key={index} className="flex justify-between items-center bg-white rounded p-2">
                              <span className="text-gray-700">{athlete.name}</span>
                              <div className="text-right">
                                <div className="text-sm font-mono text-blue-600">{athlete.nepal_id}</div>
                                <div className="text-xs text-gray-500">Grade {athlete.grade}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={results ? resetWizard : onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            {results ? 'Register More Athletes' : 'Cancel'}
          </button>

          {results && (
            <button
              onClick={onClose}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
