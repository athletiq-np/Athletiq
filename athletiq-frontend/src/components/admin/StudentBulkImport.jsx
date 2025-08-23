// src/components/admin/StudentBulkImport.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Download, 
  Check, 
  X, 
  AlertTriangle,
  Users,
  RefreshCw,
  Eye,
  Save
} from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '@/api/apiClient';
import { toast } from 'react-toastify';

/**
 * 📊 Student Bulk Import System
 * Advanced CSV/Excel import functionality with:
 * - File validation and parsing
 * - Data preview and correction
 * - Batch processing with progress tracking
 * - Error handling and reporting
 * - Template download
 */
export default function StudentBulkImport() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Processing, 4: Results
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Required fields for student import
  const requiredFields = [
    'first_name',
    'last_name', 
    'email',
    'student_id',
    'grade',
    'house',
    'date_of_birth'
  ];

  const optionalFields = [
    'phone',
    'address',
    'parent_name',
    'parent_email',
    'parent_phone',
    'medical_notes',
    'emergency_contact',
    'sports_interests'
  ];

  // Download template file
  const downloadTemplate = () => {
    const templateData = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@school.edu',
        student_id: 'STU001',
        grade: '10',
        house: 'Red House',
        date_of_birth: '2008-05-15',
        phone: '+1234567890',
        address: '123 Main St, City',
        parent_name: 'Jane Doe',
        parent_email: 'jane.doe@email.com',
        parent_phone: '+1234567891',
        medical_notes: 'No allergies',
        emergency_contact: 'Jane Doe - +1234567891',
        sports_interests: 'Football, Basketball'
      },
      {
        first_name: 'Sarah',
        last_name: 'Smith',
        email: 'sarah.smith@school.edu',
        student_id: 'STU002',
        grade: '11',
        house: 'Blue House',
        date_of_birth: '2007-08-22',
        phone: '+1234567892',
        address: '456 Oak Ave, City',
        parent_name: 'Mike Smith',
        parent_email: 'mike.smith@email.com',
        parent_phone: '+1234567893',
        medical_notes: 'Asthma inhaler required',
        emergency_contact: 'Mike Smith - +1234567893',
        sports_interests: 'Tennis, Swimming'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
    toast.success('Template downloaded successfully!');
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      toast.error('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(uploadedFile);
    parseFile(uploadedFile);
  };

  // Parse uploaded file
  const parseFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let data;
        
        if (file.type === 'text/csv') {
          // Parse CSV
          const text = e.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          data = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });
        } else {
          // Parse Excel
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet);
        }

        setParsedData(data);
        validateData(data);
        setStep(2);
        toast.success(`Successfully parsed ${data.length} records`);
        
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Error parsing file. Please check the format.');
      }
    };

    if (file.type === 'text/csv') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // Validate parsed data
  const validateData = (data) => {
    const results = data.map((row, index) => {
      const errors = [];
      const warnings = [];

      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push(`Missing required field: ${field}`);
        }
      });

      // Validate email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Invalid email format');
      }

      // Validate student ID uniqueness (within file)
      const duplicateId = data.find((otherRow, otherIndex) => 
        otherIndex !== index && otherRow.student_id === row.student_id
      );
      if (duplicateId) {
        errors.push('Duplicate student ID in file');
      }

      // Validate date format
      if (row.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(row.date_of_birth)) {
        warnings.push('Date of birth should be in YYYY-MM-DD format');
      }

      // Validate grade
      if (row.grade && (isNaN(row.grade) || row.grade < 1 || row.grade > 12)) {
        warnings.push('Grade should be a number between 1-12');
      }

      return {
        rowIndex: index + 1,
        data: row,
        errors,
        warnings,
        isValid: errors.length === 0
      };
    });

    setValidationResults(results);
  };

  // Process import
  const processImport = async () => {
    const validRows = validationResults.filter(result => result.isValid);
    
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsProcessing(true);
    setStep(3);
    setProcessProgress(0);

    try {
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < validRows.length; i += batchSize) {
        batches.push(validRows.slice(i, i + batchSize));
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          const response = await apiClient.post('/schools/me/students/bulk-import', {
            students: batch.map(row => row.data)
          });

          results.successful += response.data.successful || batch.length;
          
        } catch (error) {
          results.failed += batch.length;
          results.errors.push(`Batch ${i + 1}: ${error.response?.data?.message || error.message}`);
        }

        setProcessProgress(((i + 1) / batches.length) * 100);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setImportResults(results);
      setStep(4);
      toast.success(`Import completed! ${results.successful} students imported successfully.`);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset import process
  const resetImport = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setValidationResults([]);
    setImportResults(null);
    setProcessProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render validation status
  const renderValidationStatus = (result) => {
    if (result.errors.length > 0) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <X size={16} />
          <span className="text-sm">
            {result.errors.length} error{result.errors.length > 1 ? 's' : ''}
          </span>
        </div>
      );
    } else if (result.warnings.length > 0) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle size={16} />
          <span className="text-sm">
            {result.warnings.length} warning{result.warnings.length > 1 ? 's' : ''}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Check size={16} />
          <span className="text-sm">Valid</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Upload size={32} />
          <div>
            <h1 className="text-2xl font-bold">Student Bulk Import</h1>
            <p className="text-blue-100">Import students from CSV or Excel files</p>
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="flex items-center gap-4 mt-6">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step >= stepNum ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}
              `}>
                {stepNum}
              </div>
              <span className="text-sm">
                {stepNum === 1 && 'Upload'}
                {stepNum === 2 && 'Preview'}
                {stepNum === 3 && 'Process'}
                {stepNum === 4 && 'Results'}
              </span>
              {stepNum < 4 && <div className="w-8 h-0.5 bg-white/20"></div>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: File Upload */}
        {step === 1 && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Template Download */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Download Template</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by downloading our template file to ensure your data is formatted correctly.
              </p>
              <button
                onClick={downloadTemplate}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download size={20} />
                Download Excel Template
              </button>
            </div>

            {/* File Upload Area */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Upload Student Data</h3>
              
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Drop your file here or click to browse
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
                <p className="text-sm text-gray-400">
                  Maximum file size: 10MB
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-600" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Required Fields Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Required Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Required Fields</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {requiredFields.map(field => (
                      <li key={field} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Optional Fields</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {optionalFields.map(field => (
                      <li key={field} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Data Preview */}
        {step === 2 && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Validation Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Validation Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="text-green-600 dark:text-green-400" size={20} />
                    <span className="font-semibold text-green-800 dark:text-green-300">Valid Records</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {validationResults.filter(r => r.isValid).length}
                  </p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <X className="text-red-600" size={20} />
                    <span className="font-semibold text-red-800">Invalid Records</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {validationResults.filter(r => !r.isValid).length}
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-yellow-600" size={20} />
                    <span className="font-semibold text-yellow-800">Warnings</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {validationResults.filter(r => r.warnings.length > 0).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Data Preview</h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye size={16} />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>

              {showPreview && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 text-left">Row</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Student ID</th>
                        <th className="p-2 text-left">Grade</th>
                        <th className="p-2 text-left">Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.slice(0, 10).map((result) => (
                        <tr key={result.rowIndex} className="border-t">
                          <td className="p-2">{result.rowIndex}</td>
                          <td className="p-2">{renderValidationStatus(result)}</td>
                          <td className="p-2">
                            {result.data.first_name} {result.data.last_name}
                          </td>
                          <td className="p-2">{result.data.email}</td>
                          <td className="p-2">{result.data.student_id}</td>
                          <td className="p-2">{result.data.grade}</td>
                          <td className="p-2">
                            {result.errors.length > 0 && (
                              <div className="text-red-600 text-xs">
                                {result.errors.slice(0, 2).join(', ')}
                                {result.errors.length > 2 && '...'}
                              </div>
                            )}
                            {result.warnings.length > 0 && (
                              <div className="text-yellow-600 text-xs">
                                {result.warnings.slice(0, 2).join(', ')}
                                {result.warnings.length > 2 && '...'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {validationResults.length > 10 && (
                    <p className="text-gray-500 text-sm mt-2">
                      Showing first 10 rows of {validationResults.length} total records
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetImport}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={processImport}
                disabled={validationResults.filter(r => r.isValid).length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={20} />
                Import {validationResults.filter(r => r.isValid).length} Valid Records
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw size={48} className="mx-auto text-blue-600 dark:text-blue-400 mb-4 animate-spin" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Processing Import</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please wait while we import your student data...
            </p>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${processProgress}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-500">
              {Math.round(processProgress)}% Complete
            </p>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && importResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Results Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Import Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center">
                      <Check size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-green-800 dark:text-green-300 font-semibold">Successfully Imported</p>
                      <p className="text-2xl font-bold text-green-600">
                        {importResults.successful}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <X size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-red-800 font-semibold">Failed to Import</p>
                      <p className="text-2xl font-bold text-red-600">
                        {importResults.failed}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Errors Encountered:</h4>
                  <ul className="space-y-1 text-sm text-red-600">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetImport}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Upload size={20} />
                Import More Students
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Users size={20} />
                View Student List
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
