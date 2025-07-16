// src/components/features/athlete/BulkAthleteUploadModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUpload, FaFileExcel, FaDownload, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function BulkAthleteUploadModal({ isOpen, onClose, onSubmit, houses = [] }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Results

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setStep(2);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      await onSubmit(formData);
      
      setUploadResult({
        success: true,
        message: 'Students imported successfully!',
        totalProcessed: 10, // Mock data
        successful: 9,
        failed: 1,
        errors: ['Row 5: Invalid phone number format']
      });
      setStep(3);
      toast.success('Bulk upload completed!');
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
      setStep(3);
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setStep(1);
    setUploadResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'nameNepali', 'grade', 'section', 'rollNumber', 'dateOfBirth', 'gender', 'house', 'guardianName', 'guardianPhone', 'guardianEmail', 'address'],
      ['John Doe', 'जोन डो', '10', 'A', '001', '2008-05-15', 'Male', 'Red House', 'Jane Doe', '9841234567', 'jane@email.com', 'Kathmandu'],
      ['Mary Smith', 'मेरी स्मिथ', '9', 'B', '002', '2009-08-22', 'Female', 'Blue House', 'Robert Smith', '9851234568', 'robert@email.com', 'Pokhara']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_upload_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={handleClose}
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <FaUpload className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">Bulk Student Import</h2>
                <p className="text-gray-600">Upload multiple students at once</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-green-400 transition-colors">
                    <FaFileExcel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                    <p className="text-gray-500 mb-4">Select a CSV file containing student data</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                    >
                      <FaUpload className="h-4 w-4 mr-2" />
                      Choose File
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📋 Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• File must be in CSV format</li>
                    <li>• Include headers: name, nameNepali, grade, section, etc.</li>
                    <li>• Date format: YYYY-MM-DD</li>
                    <li>• Gender: Male or Female</li>
                    <li>• Phone numbers: 10 digits starting with 98</li>
                  </ul>
                </div>

                <div className="text-center">
                  <button
                    onClick={downloadSampleCSV}
                    className="inline-flex items-center px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <FaDownload className="h-4 w-4 mr-2" />
                    Download Sample Template
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <FaFileExcel className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">File Selected</h3>
                  <p className="text-gray-600 mb-4">{file?.name}</p>
                  <p className="text-sm text-gray-500">Size: {(file?.size / 1024).toFixed(2)} KB</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Before uploading:</h4>
                      <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                        <li>• Make sure all required fields are filled</li>
                        <li>• Verify phone numbers and email formats</li>
                        <li>• Check date formats (YYYY-MM-DD)</li>
                        <li>• This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className={`px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FaUpload className="h-4 w-4" />
                        <span>Upload Students</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && uploadResult && (
              <div className="space-y-6">
                <div className="text-center">
                  {uploadResult.success ? (
                    <FaCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  ) : (
                    <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  )}
                  <h3 className={`text-lg font-medium mb-2 ${
                    uploadResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {uploadResult.success ? 'Upload Completed!' : 'Upload Failed'}
                  </h3>
                  <p className="text-gray-600">{uploadResult.message}</p>
                </div>

                {uploadResult.success && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3">📊 Upload Summary:</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{uploadResult.totalProcessed}</div>
                        <div className="text-sm text-green-800">Total Processed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{uploadResult.successful}</div>
                        <div className="text-sm text-green-800">Successful</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                        <div className="text-sm text-red-800">Failed</div>
                      </div>
                    </div>
                  </div>
                )}

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">❌ Errors:</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-4 pt-4">
                  <button
                    onClick={resetModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Upload More
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
