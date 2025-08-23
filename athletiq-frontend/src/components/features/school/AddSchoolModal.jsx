// src/components/AddSchoolModal.js

import React, { useState, useRef, useEffect } from "react";
import schoolApi from '@/api/schoolApi';
import { toast } from 'react-toastify';

/**
 * Modal for adding, viewing, or editing a school.
 * Props:
 * - open: Boolean, show/hide modal
 * - onClose: Function to close modal
 * - onAdded: Function to call after successful add/edit
 * - viewMode: Boolean, if true shows the form in read-only mode
 * - school: Object, existing school data for editing/viewing
 */
export default function AddSchoolModal({ open, onClose, onAdded, viewMode: initialViewMode = false, school = null }) {
  // Track if we're in view or edit mode
  const [isViewMode, setIsViewMode] = useState(initialViewMode);
  const [isEditMode, setIsEditMode] = useState(!initialViewMode);
  // Extend with more fields as needed
  const [form, setForm] = useState({
    // School Information
    name: "",
    address: "",
    country: "Nepal",
    province: "",
    district: "",
    city: "",
    ward: "",
    phone: "",
    email: "",
    website: "",
    principal_name: "",
    is_active: true,
    
    // Admin Account
    admin_name: "",
    admin_email: "",
    password: "",
    confirm_password: ""
  });
  
  const nepaliProvinces = [
    "Province 1", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"
  ];
  
  const districts = [
    // This would be populated based on selected province
    "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar"
  ];
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const fileInput = useRef();

  // Initialize form with school data when in edit/view mode
  useEffect(() => {
    if (open) {
      // Reset modes based on props when modal opens
      setIsViewMode(initialViewMode);
      setIsEditMode(!initialViewMode);
      
      if (school) {
        // Pre-fill form with existing school data
        setForm({
          name: school.name || "",
          address: school.address || "",
          country: school.country || "Nepal",
          province: school.province || "",
          district: school.district || "",
          city: school.city || "",
          ward: school.ward || "",
          phone: school.phone || "",
          email: school.email || "",
          website: school.website || "",
          principal_name: school.principal_name || "",
          is_active: school.is_active !== false,
          admin_name: school.admin_name || "",
          admin_email: school.admin_email || "",
          password: "",
          confirm_password: ""
        });
      } else {
        // Reset form for new school
        setForm({
          name: "",
          address: "",
          country: "Nepal",
          province: "",
          district: "",
          city: "",
          ward: "",
          phone: "",
          email: "",
          website: "",
          principal_name: "",
          is_active: true,
          admin_name: "",
          admin_email: "",
          password: "",
          confirm_password: ""
        });
      }
      setLogoFile(null);
      setErr("");
      if (fileInput.current) fileInput.current.value = "";
    }
  }, [open, school]);

  if (!open) return null;

  // Handle form input changes
  const handleChange = (e) => {
    if (isViewMode) return; // Don't allow changes in view mode
    
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Logo file change
  const handleLogo = (e) => {
    if (isViewMode) return; // Don't allow file changes in view mode
    setLogoFile(e.target.files[0]);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    
    try {
      // Required validation
      if (!form.name || !form.address) {
        setErr("School name and address are required.");
        setLoading(false);
        return;
      }

      // For edit mode, don't require admin fields
      if (!school) {
        // Validate admin fields for new school only
        if (!form.admin_name || !form.admin_email || !form.password || !form.confirm_password) {
          setErr("All admin account fields are required.");
          setLoading(false);
          return;
        }

        // Validate password match
        if (form.password !== form.confirm_password) {
          setErr("Passwords do not match.");
          setLoading(false);
          return;
        }

        // Validate password length
        if (form.password.length < 8) {
          setErr("Password must be at least 8 characters long.");
          setLoading(false);
          return;
        }
      }

      // Prepare school data with proper structure
      const schoolData = {
        name: form.name,
        address: form.address,
        country: form.country || 'Nepal',
        province: form.province || '',
        district: form.district || '',
        city: form.city || '',
        ward: form.ward || '',
        phone: form.phone || '',
        email: form.email || '',
        website: form.website || '',
        principal_name: form.principal_name || '',
        is_active: form.is_active !== false, // Default to true if not set
        
        // Admin data (for new school only)
        ...(!school && {
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          password: form.password
        })
      };
      
      // Remove empty strings and null/undefined values
      Object.keys(schoolData).forEach(key => {
        if (schoolData[key] === '' || schoolData[key] === null || schoolData[key] === undefined) {
          delete schoolData[key];
        }
      });

      let response;
      if (school) {
        // Update existing school
        // If there's a new logo file, include it in the schoolData
        if (logoFile) {
          schoolData.logo = logoFile;
        }
        response = await schoolApi.updateSchool(school.id, schoolData);
        toast.success('School updated successfully');
      } else {
        // For new school, include logo if present
        if (logoFile) {
          schoolData.logo = logoFile;
        }
        response = await schoolApi.createSchool(schoolData);
        toast.success('School created successfully');
      }
      
      if (onAdded) {
        try {
          await onAdded();
        } catch (error) {
          console.error('Error in onAdded callback:', error);
          throw error;
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving school:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = 'An error occurred while saving the school. Please try again.';
      
      if (error.response?.data) {
        // Handle validation errors
        if (error.response.data.errors) {
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          setErr(`Validation error: ${errorMessages}`);
        } else {
          errorMessage = error.response.data.message || 'An error occurred. Please try again.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErr(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render field in view mode
  const renderField = (label, value, isAddress = false) => {
    if (isViewMode) {
      return (
        <div className="mb-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
          <dd className={`mt-1 text-sm ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
            {value || 'Not provided'}
          </dd>
        </div>
      );
    }
    return null;
  };

  // If in view mode, show a detailed view
  if (isViewMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">School Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                  <dl className="mt-2 space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">School Name</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{form.name || 'N/A'}</dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {form.address || 'N/A'}
                        {form.city && `, ${form.city}`}
                        {form.district && `, ${form.district}`}
                        {form.province && `, ${form.province}`}
                        {form.country && `, ${form.country}`}
                      </dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Ward</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{form.ward || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                  <dl className="mt-2 space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {form.phone ? (
                          <a href={`tel:${form.phone}`} className="hover:underline">
                            {form.phone}
                          </a>
                        ) : 'N/A'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Email</dt>
                      <dd className="mt-1 text-sm text-blue-600 dark:text-blue-400 break-all">
                        {form.email ? (
                          <a href={`mailto:${form.email}`} className="hover:underline">
                            {form.email}
                          </a>
                        ) : 'N/A'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Website</dt>
                      <dd className="mt-1 text-sm text-blue-600 dark:text-blue-400 break-all">
                        {form.website ? (
                          <a 
                            href={form.website.startsWith('http') ? form.website : `https://${form.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {form.website}
                          </a>
                        ) : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">School Logo</h3>
                  <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                    {school?.logo ? (
                      <img 
                        src={school.logo} 
                        alt={`${form.name} logo`} 
                        className="max-h-full max-w-full object-contain p-4"
                      />
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-center p-6">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-sm">No logo available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Principal Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{form.principal_name || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Status</h3>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      form.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    }`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                {form.admin_email && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Admin Contact</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white">{form.admin_name || 'N/A'}</p>
                      <a 
                        href={`mailto:${form.admin_email}`} 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {form.admin_email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsViewMode(false);
                    setIsEditMode(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Edit School
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit/Add mode
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isViewMode ? 'View School' : school ? 'Edit School' : 'Add New School'}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-red-500 focus:outline-none"
              type="button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-6">
              {/* School Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="h-5 w-5 text-athletiq-blue mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  School Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">School Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                          isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                        }`}
                        required
                        placeholder="Enter school name"
                        disabled={isViewMode}
                        readOnly={isViewMode}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        rows={2}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                          isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                        }`}
                        required
                        placeholder="Full address"
                        disabled={isViewMode}
                        readOnly={isViewMode}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Province <span className="text-red-500">*</span></label>
                        <select
                          name="province"
                          value={form.province}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                            isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                          }`}
                          required
                          disabled={isViewMode}
                        >
                          <option value="">Select Province</option>
                          {nepaliProvinces.map(province => (
                            <option key={province} value={province}>{province}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">District <span className="text-red-500">*</span></label>
                        <select
                          name="district"
                          value={form.district}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                            isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                          }`}
                          required
                          disabled={!form.province || isViewMode}
                        >
                          <option value="">Select District</option>
                          {districts.map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">City/Municipality</label>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                            isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                          }`}
                          placeholder="City"
                          disabled={isViewMode}
                          readOnly={isViewMode}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ward No.</label>
                        <input
                          type="number"
                          name="ward"
                          value={form.ward}
                          onChange={handleChange}
                          min="1"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50"
                          placeholder="Ward number"
                          disabled={viewMode}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +977
                          </span>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="flex-1 min-w-0 block w-full rounded-r-md border-gray-300 focus:border-athletiq-blue focus:ring-athletiq-blue/50"
                            placeholder="98XXXXXXXX"
                            required
                            disabled={viewMode}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                            isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                          }`}
                          placeholder="school@example.com"
                          disabled={isViewMode}
                          readOnly={isViewMode}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          https://
                        </span>
                        <input
                          type="text"
                          name="website"
                          value={form.website}
                          onChange={handleChange}
                          className={`flex-1 min-w-0 block w-full rounded-r-md border-gray-300 focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                            isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                          }`}
                          placeholder="yourschool.edu.np"
                          disabled={isViewMode}
                          readOnly={isViewMode}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Principal's Name</label>
                      <input
                        type="text"
                        name="principal_name"
                        value={form.principal_name}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                          isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                        }`}
                        placeholder="Principal's full name"
                        disabled={isViewMode}
                        readOnly={isViewMode}
                      />
                    </div>
                    
                    <div className="pt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
                      <div className="mt-1 flex items-center">
                        <label className="cursor-pointer">
                          <span className="sr-only">Choose logo</span>
                          <div className="flex items-center">
                            <div className="h-20 w-20 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                              {logoFile ? (
                                <img 
                                  src={URL.createObjectURL(logoFile)} 
                                  alt="School logo preview" 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <input
                              ref={fileInput}
                              type="file"
                              accept="image/*"
                              onChange={handleLogo}
                              className="hidden"
                              disabled={isViewMode}
                            />
                            <div className="ml-4">
                              <div className="text-sm text-gray-900 font-medium">
                                {logoFile ? logoFile.name : 'Upload a file'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {logoFile ? 'Click to change' : 'PNG, JPG, GIF up to 5MB'}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Admin Account Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="h-5 w-5 text-athletiq-blue mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Administrator Account
                </h3>
                <p className="text-sm text-gray-600 mb-4">This account will have full administrative access to the school's dashboard.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="admin_name"
                      value={form.admin_name}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                        isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                      }`}
                      placeholder="Admin's full name"
                      required
                      disabled={isViewMode}
                      readOnly={isViewMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="admin_email"
                      value={form.admin_email}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                        isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                      }`}
                      placeholder="admin@example.com"
                      required
                      disabled={isViewMode}
                      readOnly={isViewMode}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Create Password <span className="text-red-500">*</span></label>
                    <div className="relative mt-1">
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-athletiq-blue focus:ring-athletiq-blue/50 ${
                          isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                        }`}
                        placeholder="••••••••"
                        minLength="8"
                        required
                        disabled={isViewMode}
                        readOnly={isViewMode}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {form.password.length > 0 && (
                          <span className={`text-sm ${form.password.length >= 8 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {form.password.length >= 8 ? '✓' : form.password.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative mt-1">
                      <input
                        type="password"
                        name="confirm_password"
                        value={form.confirm_password}
                        onChange={handleChange}
                        className={`block w-full rounded-md shadow-sm ${
                          form.password && form.confirm_password && form.password !== form.confirm_password
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-athletiq-blue focus:ring-athletiq-blue/50'
                        } ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                        placeholder="••••••••"
                        minLength="8"
                        required
                        disabled={isViewMode}
                        readOnly={isViewMode}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {form.confirm_password && form.password === form.confirm_password && (
                          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {form.confirm_password && form.password !== form.confirm_password && (
                          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {form.confirm_password && form.password !== form.confirm_password && (
                      <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {err && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{err}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              {isViewMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsViewMode(false);
                    setIsEditMode(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit School
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {school ? 'Updating...' : 'Saving...'}
                      </div>
                    ) : school ? 'Update School' : 'Save School'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  isViewMode 
                    ? 'border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                {isViewMode ? 'Close' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/*
ONBOARDING NOTES:
- You can extend the form to include any field from your schools table, just add to form state and the <form>.
- Handles logo upload, "is_active" status, and resets after every close.
- Shows loader, error, and disables the button during API call.
- Color/class matches ATHLETIQ theme.
*/
