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
    
    // Helper fields for UI
    first_name: '',
    last_name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = (e) => {
    e?.stopPropagation?.();
    setIsOpen(true);
  };
  
  const handleClose = (e) => {
    e?.stopPropagation?.();
    setIsOpen(false);
    setError('');
    setFormData({
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
      
      // Optional personal fields
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
      
      // Helper fields for UI
      first_name: '',
      last_name: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Auto-generate full_name when first_name or last_name changes
      if (name === 'first_name' || name === 'last_name') {
        const firstName = name === 'first_name' ? value : prev.first_name;
        const lastName = name === 'last_name' ? value : prev.last_name;
        newData.full_name = `${firstName} ${lastName}`.trim();
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      
      // Remove helper fields that aren't needed for backend
      delete dataToSubmit.first_name;
      delete dataToSubmit.last_name;
      
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
      
      if (response && response.success) {
        if (onPlayerAdded) {
          onPlayerAdded(response.data);
        }
        handleClose(e);
      } else {
        const errorMsg = response?.message || 'Failed to add player';
        console.error('Error response:', response);
        setError(errorMsg);
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
        onClick={handleOpen}
        className={`${className || 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'} flex items-center`}
      >
        {children || 'Add Player'}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl relative p-6"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Player</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
                {error.includes('session has expired') && (
                  <div className="mt-2">
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
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
              
              {/* School Selection - always show since we allow everyone to add athletes */}
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
                    placeholder="e.g., 10, 11, 12"
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
                    placeholder="e.g., A, B, C"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Guardian Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label htmlFor="relationship_to_player" className="block text-sm font-medium text-gray-700">
                      Relationship
                    </label>
                    <select
                      id="relationship_to_player"
                      name="relationship_to_player"
                      value={formData.relationship_to_player}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select Relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
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
                      placeholder="98xxxxxxxx"
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
              </div>
              
              {/* Optional: Primary Sport */}
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
                  placeholder="e.g., Football, Basketball, Athletics"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPlayerButton;
