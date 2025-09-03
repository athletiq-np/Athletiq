import React, { useState } from 'react';
import { registerPlayer } from '@/api/playerApi';

const AddPlayerButton = ({ onPlayerAdded, children, className, schools = [], user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  
  // Tab configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'personal', label: 'Personal Details', icon: '📋' },
    { id: 'guardian', label: 'Guardian Info', icon: '👨‍👩‍👧‍👦' },
    { id: 'physical', label: 'Physical & Sports', icon: '🏃‍♂️' },
    { id: 'family', label: 'Family & Medical', icon: '🏥' },
    { id: 'documents', label: 'Documents', icon: '📄' }
  ];
  
  // Debug schools data
  console.log('AddPlayerButton - Schools data:', schools);
  console.log('AddPlayerButton - User data:', user);
  console.log('AddPlayerButton - Schools details:', schools?.map(s => ({ id: s.school_id || s.id, name: s.name, code: s.school_code })));
  
  const [formData, setFormData] = useState({
    // Core required fields matching backend model
    full_name: '',
    date_of_birth: '',
    gender: '',
    school_id: '',
    
    // Guardian information (required)
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    relationship_to_player: '',
    
    // Personal information
    full_name_nepali: '',
    grade: '',
    section: '',
    nationality: 'Nepali',
    citizenship_no: '',
    address: '',
    province: '',
    district: '',
    municipality_or_rural_municipality: '',
    ward_no: '',
    
    // Physical attributes
    height_cm: '',
    weight_kg: '',
    blood_group: '',
    
    // Sports information
    primary_sport: '',
    registered_sports: [],
    
    // Family information
    father_name: '',
    mother_name: '',
    
    // Medical information
    medical_conditions: '',
    allergies: '',
    emergency_contact: '',
    medical_notes: '',
    
    // Document information
    profile_photo_url: '',
    birth_certificate_url: '',
    birth_certificate_no: '',
    birth_certificate_date: '',
    birth_certificate_office: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleKeyDown = (e) => {
    // Prevent Enter key from triggering any form submission
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Only allow Enter to submit if we're on the documents tab and clicking the submit button
      if (currentTab === 'documents') {
        // Focus on the submit button instead of submitting
        const submitButton = document.querySelector('button[data-submit-button="true"]');
        if (submitButton) {
          submitButton.focus();
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      date_of_birth: '',
      gender: '',
      school_id: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      relationship_to_player: '',
      full_name_nepali: '',
      grade: '',
      section: '',
      nationality: 'Nepali',
      citizenship_no: '',
      address: '',
      province: '',
      district: '',
      municipality_or_rural_municipality: '',
      ward_no: '',
      height_cm: '',
      weight_kg: '',
      blood_group: '',
      primary_sport: '',
      registered_sports: [],
      father_name: '',
      mother_name: '',
      medical_conditions: '',
      allergies: '',
      emergency_contact: '',
      medical_notes: '',
      profile_photo_url: '',
      birth_certificate_url: '',
      birth_certificate_no: '',
      birth_certificate_date: '',
      birth_certificate_office: '',
    });
    setCurrentTab('basic');
    setError('');
  };

  const validateRequiredDocuments = () => {
    // Check if at least birth certificate information is provided
    if (!formData.birth_certificate_no && !formData.birth_certificate_url) {
      return 'Please provide either birth certificate number or birth certificate document URL.';
    }
    return null;
  };

  const handleSubmit = async () => {
    // Add debugging to check what triggered the submission
    console.log('Form submission triggered. Current tab:', currentTab);
    console.log('Form data:', formData);
    
    setIsLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Set school_id if user is school admin
      let schoolId = formData.school_id;
      if (user?.role === 'school_admin' && user?.school_id) {
        schoolId = user.school_id;
      }
      
      // Validate required fields before submission
      if (!schoolId) {
        setError('Please select a school.');
        setIsLoading(false);
        return;
      }
      
      if (!formData.full_name) {
        setError('Please enter the player\'s full name.');
        setIsLoading(false);
        return;
      }
      
      if (!formData.date_of_birth) {
        setError('Please enter the date of birth.');
        setIsLoading(false);
        return;
      }
      
      if (!formData.gender) {
        setError('Please select a gender.');
        setIsLoading(false);
        return;
      }
      
      if (!formData.guardian_name) {
        setError('Please enter guardian name.');
        setIsLoading(false);
        return;
      }
      
      if (!formData.guardian_phone) {
        setError('Please enter guardian phone number.');
        setIsLoading(false);
        return;
      }
      
      if (!formData.relationship_to_player) {
        setError('Please select relationship to player.');
        setIsLoading(false);
        return;
      }
      
      // Validate documents section
      const documentError = validateRequiredDocuments();
      if (documentError) {
        setError(documentError);
        setCurrentTab('documents'); // Switch to documents tab to show the error
        setIsLoading(false);
        return;
      }
      
      // Prepare data for submission, mapping frontend fields to backend expected fields
      const dataToSubmit = {
        ...formData,
        school_id: schoolId,
        // Convert gender values to backend format
        gender: formData.gender === 'M' ? 'Male' : 
                formData.gender === 'F' ? 'Female' : 
                formData.gender === 'O' ? 'Other' : formData.gender,
        // Ensure registered_sports is array
        registered_sports: Array.isArray(formData.registered_sports) ? 
                          formData.registered_sports : []
      };
      
      // Append all form data to FormData (including required fields even if empty)
      Object.entries(dataToSubmit).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Include school_id even if it's an empty string (for better error messages)
          if (key === 'school_id' || (value !== '' && value !== null && value !== undefined)) {
            if (value instanceof File) {
              formDataToSend.append(key, value);
            } else if (typeof value === 'object') {
              formDataToSend.append(key, JSON.stringify(value));
            } else {
              formDataToSend.append(key, value);
            }
          }
        }
      });

      console.log('Submitting player data:', Object.fromEntries(formDataToSend));
      const response = await registerPlayer(formDataToSend);
      
      // Success
      console.log('Player added successfully:', response);
      resetForm();
      setIsOpen(false);
      
      // Show success message (you can replace this with a proper toast notification)
      if (response?.message) {
        alert(response.message);
      } else {
        alert('Player added successfully!');
      }
      
      // Trigger table refresh with a slight delay to ensure backend is updated
      if (onPlayerAdded) {
        setTimeout(() => {
          onPlayerAdded(response.data || response);
        }, 100);
      }
      
    } catch (err) {
      console.error('Error adding player:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to add player. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Player</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
            
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCurrentTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        currentTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="space-y-6">
                {/* Basic Information Tab */}
                {currentTab === 'basic' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                    
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="full_name_nepali" className="block text-sm font-medium text-gray-700">
                        Full Name (Nepali)
                      </label>
                      <input
                        type="text"
                        id="full_name_nepali"
                        name="full_name_nepali"
                        value={formData.full_name_nepali}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          id="date_of_birth"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                          Gender *
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* School Selection */}
                    <div>
                      <label htmlFor="school_id" className="block text-sm font-medium text-gray-700">
                        School *
                      </label>
                      <select
                        id="school_id"
                        name="school_id"
                        value={formData.school_id}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select School</option>
                        {schools && schools.length > 0 ? (
                          schools.map(school => (
                            <option key={school.school_id || school.id} value={school.school_id || school.id}>
                              {school.name} ({school.school_code || school.school_id || school.id})
                            </option>
                          ))
                        ) : (
                          // Temporary test school for development
                          <option value="4">Athletiq International School (ID: 4)</option>
                        )}
                      </select>
                      {(!schools || schools.length === 0) && (
                        <p className="mt-1 text-sm text-yellow-600">
                          Using test school for development. Contact administrator to set up proper schools.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                          Grade
                        </label>
                        <input
                          type="text"
                          id="grade"
                          name="grade"
                          value={formData.grade}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                          Section
                        </label>
                        <input
                          type="text"
                          id="section"
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Details Tab */}
                {currentTab === 'personal' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Personal Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                          Nationality
                        </label>
                        <input
                          type="text"
                          id="nationality"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="citizenship_no" className="block text-sm font-medium text-gray-700">
                          Citizenship Number
                        </label>
                        <input
                          type="text"
                          id="citizenship_no"
                          name="citizenship_no"
                          value={formData.citizenship_no}
                          onChange={handleChange}
                          placeholder="XX-XX-XX-XXXXX"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                          Province
                        </label>
                        <input
                          type="text"
                          id="province"
                          name="province"
                          value={formData.province}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                          District
                        </label>
                        <input
                          type="text"
                          id="district"
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="municipality_or_rural_municipality" className="block text-sm font-medium text-gray-700">
                          Municipality/Rural Municipality
                        </label>
                        <input
                          type="text"
                          id="municipality_or_rural_municipality"
                          name="municipality_or_rural_municipality"
                          value={formData.municipality_or_rural_municipality}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="ward_no" className="block text-sm font-medium text-gray-700">
                          Ward No.
                        </label>
                        <input
                          type="text"
                          id="ward_no"
                          name="ward_no"
                          value={formData.ward_no}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Guardian Information Tab */}
                {currentTab === 'guardian' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Guardian Information</h3>
                    
                    <div>
                      <label htmlFor="guardian_name" className="block text-sm font-medium text-gray-700">
                        Guardian Name *
                      </label>
                      <input
                        type="text"
                        id="guardian_name"
                        name="guardian_name"
                        value={formData.guardian_name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="guardian_phone" className="block text-sm font-medium text-gray-700">
                          Guardian Phone *
                        </label>
                        <input
                          type="tel"
                          id="guardian_phone"
                          name="guardian_phone"
                          value={formData.guardian_phone}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="guardian_email" className="block text-sm font-medium text-gray-700">
                          Guardian Email
                        </label>
                        <input
                          type="email"
                          id="guardian_email"
                          name="guardian_email"
                          value={formData.guardian_email}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="relationship_to_player" className="block text-sm font-medium text-gray-700">
                        Relationship to Player *
                      </label>
                      <select
                        id="relationship_to_player"
                        name="relationship_to_player"
                        value={formData.relationship_to_player}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        id="emergency_contact"
                        name="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Physical & Sports Tab */}
                {currentTab === 'physical' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Physical Attributes & Sports</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="height_cm" className="block text-sm font-medium text-gray-700">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          id="height_cm"
                          name="height_cm"
                          value={formData.height_cm}
                          onChange={handleChange}
                          min="50"
                          max="250"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          id="weight_kg"
                          name="weight_kg"
                          value={formData.weight_kg}
                          onChange={handleChange}
                          min="10"
                          max="200"
                          step="0.1"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700">
                          Blood Group
                        </label>
                        <select
                          id="blood_group"
                          name="blood_group"
                          value={formData.blood_group}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="primary_sport" className="block text-sm font-medium text-gray-700">
                        Primary Sport
                      </label>
                      <input
                        type="text"
                        id="primary_sport"
                        name="primary_sport"
                        value={formData.primary_sport}
                        onChange={handleChange}
                        placeholder="e.g., Football, Basketball, Cricket"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="registered_sports" className="block text-sm font-medium text-gray-700">
                        Registered Sports (comma-separated)
                      </label>
                      <input
                        type="text"
                        id="registered_sports"
                        name="registered_sports"
                        value={Array.isArray(formData.registered_sports) ? formData.registered_sports.join(', ') : formData.registered_sports}
                        onChange={(e) => {
                          const sports = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                          setFormData(prev => ({ ...prev, registered_sports: sports }));
                        }}
                        placeholder="e.g., Football, Basketball, Cricket"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Family & Medical Tab */}
                {currentTab === 'family' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Family & Medical Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">
                          Father's Name
                        </label>
                        <input
                          type="text"
                          id="father_name"
                          name="father_name"
                          value={formData.father_name}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="mother_name" className="block text-sm font-medium text-gray-700">
                          Mother's Name
                        </label>
                        <input
                          type="text"
                          id="mother_name"
                          name="mother_name"
                          value={formData.mother_name}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700">
                        Medical Conditions
                      </label>
                      <textarea
                        id="medical_conditions"
                        name="medical_conditions"
                        value={formData.medical_conditions}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                        Allergies
                      </label>
                      <textarea
                        id="allergies"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">
                        Medical Notes
                      </label>
                      <textarea
                        id="medical_notes"
                        name="medical_notes"
                        value={formData.medical_notes}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Documents Tab */}
                {currentTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Document Information</h3>
                      <div className="text-sm text-red-600 font-medium">
                        * At least one birth certificate field is required
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="profile_photo_url" className="block text-sm font-medium text-gray-700">
                        Profile Photo URL
                      </label>
                      <input
                        type="url"
                        id="profile_photo_url"
                        name="profile_photo_url"
                        value={formData.profile_photo_url}
                        onChange={handleChange}
                        placeholder="https://example.com/photo.jpg"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="border border-yellow-200 rounded-md p-4 bg-yellow-50">
                      <h4 className="text-md font-medium text-yellow-800 mb-3">Birth Certificate Information *</h4>
                      <p className="text-sm text-yellow-700 mb-4">
                        Please provide either the birth certificate document URL or at least the certificate number.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="birth_certificate_url" className="block text-sm font-medium text-gray-700">
                            Birth Certificate Document URL
                          </label>
                          <input
                            type="url"
                            id="birth_certificate_url"
                            name="birth_certificate_url"
                            value={formData.birth_certificate_url}
                            onChange={handleChange}
                            placeholder="https://example.com/birth_certificate.pdf"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="birth_certificate_no" className="block text-sm font-medium text-gray-700">
                              Birth Certificate Number *
                            </label>
                            <input
                              type="text"
                              id="birth_certificate_no"
                              name="birth_certificate_no"
                              value={formData.birth_certificate_no}
                              onChange={handleChange}
                              placeholder="e.g., BC123456789"
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label htmlFor="birth_certificate_date" className="block text-sm font-medium text-gray-700">
                              Birth Certificate Issue Date
                            </label>
                            <input
                              type="date"
                              id="birth_certificate_date"
                              name="birth_certificate_date"
                              value={formData.birth_certificate_date}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="birth_certificate_office" className="block text-sm font-medium text-gray-700">
                            Birth Certificate Issuing Office
                          </label>
                          <input
                            type="text"
                            id="birth_certificate_office"
                            name="birth_certificate_office"
                            value={formData.birth_certificate_office}
                            onChange={handleChange}
                            placeholder="e.g., Ward Office, Municipality Office"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(tab => tab.id === currentTab);
                      if (currentIndex > 0) {
                        setCurrentTab(tabs[currentIndex - 1].id);
                      }
                    }}
                    disabled={tabs.findIndex(tab => tab.id === currentTab) === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex space-x-3">
                    {tabs.findIndex(tab => tab.id === currentTab) < tabs.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const currentIndex = tabs.findIndex(tab => tab.id === currentTab);
                          if (currentIndex < tabs.length - 1) {
                            setCurrentTab(tabs[currentIndex + 1].id);
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleSubmit}
                        data-submit-button="true"
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Adding Player...' : 'Add Player'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPlayerButton;