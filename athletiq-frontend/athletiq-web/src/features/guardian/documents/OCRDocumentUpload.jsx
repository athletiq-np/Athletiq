import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCamera, 
  FaUpload, 
  FaSpinner, 
  FaCheck, 
  FaExclamationTriangle,
  FaCrop,
  FaSync,
  FaTrash
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';

const OCRDocumentUpload = ({ 
  onDocumentProcessed, 
  onClose, 
  existingData = null,
  documentType = 'birth_certificate' // 'birth_certificate', 'profile_photo'
}) => {
  const { t } = useTranslation();
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, success, error
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [errors, setErrors] = useState([]);
  const [processingStep, setProcessingStep] = useState('');

  // OCR field mappings for birth certificate
  const birthCertificateFields = {
    full_name: { label: t('form.fullName'), confidence: 0 },
    father_name: { label: t('form.fatherName'), confidence: 0 },
    mother_name: { label: t('form.motherName'), confidence: 0 },
    date_of_birth: { label: t('form.dateOfBirth'), confidence: 0 },
    place_of_birth: { label: t('form.placeOfBirth'), confidence: 0 },
    permanent_address: { label: t('form.permanentAddress'), confidence: 0 },
    citizenship_number: { label: t('form.citizenshipNumber'), confidence: 0 }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(['Please select a valid image file (JPEG, PNG, or WebP)']);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(['File size must be less than 10MB']);
      return;
    }

    setSelectedFile(file);
    setErrors([]);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setProcessingStep('Uploading document...');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('document_type', documentType);
      formData.append('extract_fields', JSON.stringify(Object.keys(birthCertificateFields)));

      // Upload and process with OCR
      setProcessingStep('Processing with OCR...');
      const response = await fetch('/api/guardian/documents/upload-ocr', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadState('processing');
        setProcessingStep('Extracting text...');
        
        // Simulate processing delay for UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setOcrResults(result.extracted_data);
        setOcrConfidence(result.confidence_scores);
        setUploadState('success');
        setProcessingStep('Processing complete!');
        
        // Auto-submit if confidence is high
        if (result.overall_confidence > 0.85) {
          setTimeout(() => {
            onDocumentProcessed({
              document_url: result.document_url,
              extracted_data: result.extracted_data,
              confidence_scores: result.confidence_scores
            });
          }, 1000);
        }
      } else {
        throw new Error(result.message || 'OCR processing failed');
      }
    } catch (error) {
      console.error('Document processing error:', error);
      setUploadState('error');
      setErrors([error.message]);
    }
  };

  const confirmAndSubmit = () => {
    if (ocrResults) {
      onDocumentProcessed({
        document_url: previewUrl, // This would be the actual uploaded URL
        extracted_data: ocrResults,
        confidence_scores: ocrConfidence
      });
    }
  };

  const retryProcessing = () => {
    setUploadState('idle');
    setOcrResults(null);
    setOcrConfidence(null);
    setErrors([]);
    setProcessingStep('');
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {documentType === 'birth_certificate' ? 
                t('documents.uploadBirthCertificate') : 
                t('documents.uploadPhoto')
              }
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {documentType === 'birth_certificate' ? 
              'OCR will automatically extract information from your birth certificate' :
              'Upload a clear photo for your athlete profile'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Area */}
          {!selectedFile && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            >
              <FaCamera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Document</h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your {documentType === 'birth_certificate' ? 'birth certificate' : 'photo'} here, or click to browse
              </p>
              <input
                type="file"
                id="document-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileInputChange}
              />
              <label
                htmlFor="document-upload"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                <FaUpload className="w-4 h-4" />
                <span>Choose File</span>
              </label>
            </div>
          )}

          {/* Preview and Processing */}
          {selectedFile && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setOcrResults(null);
                    setUploadState('idle');
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>

              {/* Processing Status */}
              {uploadState !== 'idle' && uploadState !== 'success' && (
                <div className="text-center py-4">
                  <FaSpinner className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{processingStep}</p>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-800">
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span className="font-medium">Processing Error</span>
                  </div>
                  <ul className="mt-2 text-sm text-red-700">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* OCR Results */}
              {ocrResults && uploadState === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-800 mb-4">
                    <FaCheck className="w-4 h-4" />
                    <span className="font-medium">Information Extracted</span>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(ocrResults).map(([field, value]) => {
                      const confidence = ocrConfidence?.[field] || 0;
                      return (
                        <div key={field} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-700">
                              {birthCertificateFields[field]?.label || field}:
                            </span>
                            <span className="ml-2 text-gray-900">{value}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(confidence)}`}>
                            {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-xs text-gray-600">
                    <p>• Review the extracted information for accuracy</p>
                    <p>• You can edit any incorrect details on the next screen</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {uploadState === 'idle' && (
                  <button
                    onClick={processDocument}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FaUpload className="w-4 h-4" />
                    <span>Process Document</span>
                  </button>
                )}

                {uploadState === 'success' && (
                  <>
                    <button
                      onClick={retryProcessing}
                      className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <FaSync className="w-4 h-4" />
                      <span>Try Again</span>
                    </button>
                    <button
                      onClick={confirmAndSubmit}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FaCheck className="w-4 h-4" />
                      <span>Use This Data</span>
                    </button>
                  </>
                )}

                {uploadState === 'error' && (
                  <button
                    onClick={retryProcessing}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    <FaSync className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OCRDocumentUpload;
