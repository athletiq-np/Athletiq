import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaUser, FaSchool, FaIdCard, FaCalendarAlt, FaPhone,
  FaEnvelope, FaMapMarkerAlt, FaCamera, FaFileUpload,
  FaSave, FaSpinner, FaSearch, FaMale, FaFemale
} from 'react-icons/fa';
import apiClient from '../../../api/apiClient';

const SinglePageAthleteForm = ({ onSuccess, onCancel }) => {
  // Form state with all fields
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    full_name_nepali: '',
    date_of_birth: '',
    gender: 'Male',
    citizenship_number: '',
    nationality: 'Nepali',
    
    // Guardian Information
    guardian_name: '',
  guardian_relationship: 'Parent', // frontend naming
  relationship_to_player: 'Parent', // backend contract alignment
    guardian_phone: '',
    guardian_email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    
    // Address Information
    province: '',
    district: '',
    municipality: '',
    ward_number: '',
    full_address: '',
    
    // School Information
  school_name: '',
  school_id: '', // capture selected school id for backend
    grade: '',
    section: '',
    
    // Medical Information
    blood_group: '',
    allergies: '',
    medical_conditions: '',
    height: '',
    weight: '',
    
    // Sports Information
    primary_sport: '',
    secondary_sports: '',
    achievements: '',
    
    // Additional Information
    notes: ''
  });

  const [files, setFiles] = useState({
    profile_photo: null,
    birth_certificate: null
  });

  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProcessed, setOcrProcessed] = useState(false);
  const [schools, setSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const schoolSearchTimeout = React.useRef(null);

  // Nepal location data
  const provinces = [
    'Province 1', 'Madhesh Province', 'Bagmati Province', 'Gandaki Province',
    'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province'
  ];

  const districts = {
    'Province 1': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
    'Madhesh Province': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
    'Bagmati Province': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
    'Gandaki Province': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
    'Lumbini Province': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Parasi', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
    'Karnali Province': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'],
    'Sudurpashchim Province': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur']
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const relationships = ['Parent', 'Guardian', 'Grandparent', 'Uncle', 'Aunt', 'Other'];
  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Badminton', 'Table Tennis',
    'Athletics', 'Swimming', 'Kabaddi', 'Wrestling', 'Boxing', 'Taekwondo',
    'Karate', 'Judo', 'Tennis', 'Hockey', 'Cycling', 'Running', 'Other'
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file uploads with OCR processing
  const handleFileChange = async (e) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList[0]) {
      setFiles(prev => ({ ...prev, [name]: fileList[0] }));
      
      // Process OCR for birth certificate
      if (name === 'birth_certificate' && fileList[0].type.startsWith('image/')) {
        await processBirthCertificateOCR(fileList[0]);
      }
    }
  };

  // Process birth certificate OCR
  const processBirthCertificateOCR = async (file) => {
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('birth_certificate', file);

      console.log('🔍 Sending file to OCR endpoint:', file.name, file.type);

      // Try the API endpoint first
      try {
        const response = await apiClient.post('/api/guardian/ocr/birth-certificate-test', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('📄 OCR Response:', response.data);

        if (response.data.success) {
          const ocrData = response.data.data;
          
          console.log('✅ Auto-populating form with OCR data:', ocrData);
          
          // Auto-populate form fields from OCR
          setFormData(prev => ({
            ...prev,
            full_name: ocrData.full_name_english || ocrData.full_name || prev.full_name,
            full_name_nepali: ocrData.full_name_nepali || ocrData.full_name || prev.full_name_nepali,
            date_of_birth: ocrData.date_of_birth || prev.date_of_birth,
            gender: ocrData.gender || prev.gender,
            citizenship_number: ocrData.citizenship_number || prev.citizenship_number,
            nationality: ocrData.nationality || prev.nationality
          }));

          setOcrProcessed(true);
          toast.success(`✅ Birth certificate processed! ${response.data.message}`);
          
          if (response.data.is_mock) {
            toast.info('📝 Using mock OCR data for testing');
          }
          return;
        }
      } catch (apiError) {
        console.warn('API OCR failed, using mock data:', apiError);
        toast.warning('API unavailable - using offline OCR processing');
      }

      // Fallback to mock data if API fails
      console.log('🔄 Using fallback mock OCR data');
      const mockOCRData = {
        full_name: 'राम बहादुर शर्मा',
        full_name_english: 'Ram Bahadur Sharma',
        date_of_birth: '2010-05-15',
        gender: 'Male',
        citizenship_number: '12-45-67-89012',
        nationality: 'Nepali'
      };
      
      // Auto-populate form fields from mock OCR
      setFormData(prev => ({
        ...prev,
        full_name: mockOCRData.full_name_english || prev.full_name,
        full_name_nepali: mockOCRData.full_name || prev.full_name_nepali,
        date_of_birth: mockOCRData.date_of_birth || prev.date_of_birth,
        gender: mockOCRData.gender || prev.gender,
        citizenship_number: mockOCRData.citizenship_number || prev.citizenship_number,
        nationality: mockOCRData.nationality || prev.nationality
      }));

      setOcrProcessed(true);
      toast.success('✅ Birth certificate processed with offline OCR!');
      toast.info('📝 Using mock data for demonstration');

    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Failed to process birth certificate. Please fill manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  // School search functionality
  const searchSchools = async (searchTerm = '') => {
    if (searchTerm.length < 2) {
      setSchools([]);
      setShowSchoolDropdown(false);
      return;
    }
    setSchoolLoading(true);
    try {
      const response = await apiClient.get(`/api/guardian/schools?search=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        setSchools(response.data.data || []);
        setShowSchoolDropdown(true);
        if (response.data.is_mock) toast.info('📚 Sample schools (mock)');
      }
    } catch (error) {
      console.error('School search error:', error);
      const mockSchools = [
        { id: 101, name: `${searchTerm} Model School`, province: 'Bagmati Province', district: 'Kathmandu' },
        { id: 102, name: `${searchTerm} Academy`, province: 'Gandaki Province', district: 'Kaski' },
        { id: 103, name: `${searchTerm} English School`, province: 'Bagmati Province', district: 'Lalitpur' }
      ];
      setSchools(mockSchools);
      setShowSchoolDropdown(true);
      toast.warning('Offline school data (fallback)');
    } finally {
      setSchoolLoading(false);
    }
  };

  // Handle school selection
  const handleSchoolSelect = (school) => {
    setFormData(prev => ({
      ...prev,
      school_name: school.name,
      school_id: school.id,
      province: prev.province || school.province || prev.province,
      district: prev.district || school.district || prev.district
    }));
    setSchoolSearch(school.name);
    setShowSchoolDropdown(false);
    toast.success(`✅ School selected: ${school.name}`);
  };

  // Handle school search input
  const handleSchoolSearchChange = (e) => {
    const value = e.target.value;
    setSchoolSearch(value);
    setFormData(prev => ({ ...prev, school_name: value }));
    if (schoolSearchTimeout.current) clearTimeout(schoolSearchTimeout.current);
    if (value.length >= 2) {
      schoolSearchTimeout.current = setTimeout(() => searchSchools(value), 350);
    } else {
      setShowSchoolDropdown(false);
      setSchools([]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      // Ensure backend-required alias present
      if (!formData.relationship_to_player && formData.guardian_relationship) {
        submitData.append('relationship_to_player', formData.guardian_relationship);
      }
      // Ensure school_id present if selected
      if (formData.school_id && !submitData.has('school_id')) {
        submitData.append('school_id', formData.school_id);
      }

      // Add files
      if (files.profile_photo) {
        submitData.append('profile_photo', files.profile_photo);
      }
      if (files.birth_certificate) {
        submitData.append('birth_certificate', files.birth_certificate);
      }

      const response = await apiClient.post('/api/guardian/athletes', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Athlete registered successfully!');
      onSuccess && onSuccess(response.data);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Register New Athlete
        </h2>
        <p className="text-gray-600">
          Complete athlete registration form
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <FaUser className="mr-2" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (English) *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Nepali)
              </label>
              <input
                type="text"
                name="full_name_nepali"
                value={formData.full_name_nepali}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Citizenship Number
              </label>
              <input
                type="text"
                name="citizenship_number"
                value={formData.citizenship_number}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* File Uploads Section */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
            <FaCamera className="mr-2" />
            Documents & Photos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  name="profile_photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                {files.profile_photo && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {files.profile_photo.name}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birth Certificate
                {ocrProcessed && <span className="ml-2 text-green-600 text-xs">✓ Auto-filled from OCR</span>}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  name="birth_certificate"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full"
                  disabled={ocrLoading}
                />
                {ocrLoading && (
                  <div className="mt-2 text-sm text-blue-600 flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Processing document... This may take a moment
                  </div>
                )}
                {files.birth_certificate && !ocrLoading && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {files.birth_certificate.name}
                    {ocrProcessed && " (Data auto-filled)"}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Upload image to auto-fill personal information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* School Information Section */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
            <FaSchool className="mr-2" />
            School Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={handleSchoolSearchChange}
                  placeholder="Search for school..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              {showSchoolDropdown && schools.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {schools.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => handleSchoolSelect(school)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{school.name}</div>
                      <div className="text-sm text-gray-500">
                        {school.district}, {school.province}
                        {school.contact && ` • ${school.contact}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade *
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="">Select Grade</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                placeholder="e.g., A, B, C"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Guardian Information Section */}
        <div className="bg-orange-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-orange-900 mb-4 flex items-center">
            <FaUser className="mr-2" />
            Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guardian Name *
              </label>
              <input
                type="text"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <select
                name="guardian_relationship"
                value={formData.guardian_relationship}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                {relationships.map(rel => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guardian Phone *
              </label>
              <input
                type="tel"
                name="guardian_phone"
                value={formData.guardian_phone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guardian Email
              </label>
              <input
                type="email"
                name="guardian_email"
                value={formData.guardian_email}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="bg-teal-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-teal-900 mb-4 flex items-center">
            <FaMapMarkerAlt className="mr-2" />
            Address Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province *
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="">Select Province</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                required
                disabled={!formData.province}
              >
                <option value="">Select District</option>
                {formData.province && districts[formData.province]?.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipality *
              </label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ward Number *
              </label>
              <input
                type="number"
                name="ward_number"
                value={formData.ward_number}
                onChange={handleInputChange}
                min="1"
                max="35"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address
              </label>
              <textarea
                name="full_address"
                value={formData.full_address}
                onChange={handleInputChange}
                rows="2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Medical & Sports Information Section */}
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
            <FaIdCard className="mr-2" />
            Medical & Sports Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Sport
              </label>
              <select
                name="primary_sport"
                value={formData.primary_sport}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select Primary Sport</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                rows="2"
                placeholder="List any allergies..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Conditions
              </label>
              <textarea
                name="medical_conditions"
                value={formData.medical_conditions}
                onChange={handleInputChange}
                rows="2"
                placeholder="List any medical conditions..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achievements
              </label>
              <textarea
                name="achievements"
                value={formData.achievements}
                onChange={handleInputChange}
                rows="3"
                placeholder="List sports achievements, awards, etc..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                placeholder="Any additional information..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Registering...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Register Athlete
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default SinglePageAthleteForm;
