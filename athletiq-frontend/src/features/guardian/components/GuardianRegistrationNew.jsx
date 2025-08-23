import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, FaPhone, FaEnvelope, FaLock, FaChild, FaCalendarAlt,
  FaEye, FaEyeSlash, FaSchool, FaUserFriends, FaCheck, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGuardianAuth } from '../hooks/useGuardianAuth';
import { useNavigate } from 'react-router-dom';
import {
  nepaliMonths,
  convertNepaliToEnglish,
  convertEnglishToNepali,
  calculateAge,
  formatNepaliDate,
  getDaysInNepaliMonth,
  isValidNepaliDate,
  isValidEnglishDate
} from '../utils/nepaliCalendar';

const relationshipOptions = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'other', label: 'Other Relative' }
];

export default function GuardianRegistrationNew({ onSuccess, onSwitchToLogin }) {
  const { register, loading } = useGuardianAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [schools, setSchools] = useState([]);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    // Guardian Info
    guardianFirstName: '',
    guardianMiddleName: '',
    guardianLastName: '',
    email: '',
    mobile: '',
    relationship: 'father',
    
    // Athlete Info
    athleteFirstName: '',
    athleteMiddleName: '',
    athleteLastName: '',
    gender: '',
    schoolId: '',
    schoolName: '',
    
    // Date of Birth - Dual Calendar
    englishDate: { month: '', day: '', year: '' },
    nepaliDate: { month: '', day: '', year: '' },
    finalDateOfBirth: '',
    
    // Security
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  useEffect(() => {
    const { password } = formData;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  // Search schools
  useEffect(() => {
    const searchSchools = async () => {
      if (schoolSearchTerm.length >= 3) {
        setSearchingSchools(true);
        try {
          // Mock school data - replace with actual API call
          const mockSchools = [
            { id: 1, name: 'Budhanilkantha School', location: 'Kathmandu' },
            { id: 2, name: 'St. Mary\'s School', location: 'Lalitpur' },
            { id: 3, name: 'Galaxy Public School', location: 'Bhaktapur' },
            { id: 4, name: 'Nepal Don Bosco School', location: 'Kathmandu' },
            { id: 5, name: 'Shuvatara School', location: 'Kathmandu' }
          ];
          
          const filtered = mockSchools.filter(school => 
            school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase())
          );
          setSchools(filtered);
        } catch (error) {
          console.error('School search error:', error);
        } finally {
          setSearchingSchools(false);
        }
      } else {
        setSchools([]);
      }
    };

    const debounceTimer = setTimeout(searchSchools, 300);
    return () => clearTimeout(debounceTimer);
  }, [schoolSearchTerm]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle English date change
  const handleEnglishDateChange = (field, value) => {
    const newEnglishDate = { ...formData.englishDate, [field]: value };
    setFormData(prev => ({ ...prev, englishDate: newEnglishDate }));

    // If all English date fields are filled, convert to Nepali
    if (newEnglishDate.month && newEnglishDate.day && newEnglishDate.year) {
      const englishDateString = `${newEnglishDate.year}-${String(newEnglishDate.month).padStart(2, '0')}-${String(newEnglishDate.day).padStart(2, '0')}`;
      const nepaliEquivalent = convertEnglishToNepali(englishDateString);
      
      setFormData(prev => ({
        ...prev,
        nepaliDate: nepaliEquivalent,
        finalDateOfBirth: englishDateString
      }));
    }
  };

  // Handle Nepali date change
  const handleNepaliDateChange = (field, value) => {
    const newNepaliDate = { ...formData.nepaliDate, [field]: value };
    setFormData(prev => ({ ...prev, nepaliDate: newNepaliDate }));

    // If all Nepali date fields are filled, convert to English
    if (newNepaliDate.month && newNepaliDate.day && newNepaliDate.year) {
      const englishDateString = convertNepaliToEnglish(newNepaliDate.year, newNepaliDate.month, newNepaliDate.day);
      const englishDate = new Date(englishDateString);
      
      setFormData(prev => ({
        ...prev,
        englishDate: {
          month: englishDate.getMonth() + 1,
          day: englishDate.getDate(),
          year: englishDate.getFullYear()
        },
        finalDateOfBirth: englishDateString
      }));
    }
  };

  // Handle school selection
  const handleSchoolSelect = (school) => {
    setFormData(prev => ({
      ...prev,
      schoolId: school.id,
      schoolName: school.name
    }));
    setSchoolSearchTerm(school.name);
    setSchools([]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Guardian validation
    if (!formData.guardianFirstName.trim()) newErrors.guardianFirstName = 'First name is required';
    if (!formData.guardianLastName.trim()) newErrors.guardianLastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    
    // Mobile validation (Nepal format: +977XXXXXXXXXX)
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(formData.mobile)) newErrors.mobile = 'Please enter 10 digits after +977';

    // Athlete validation
    if (!formData.athleteFirstName.trim()) newErrors.athleteFirstName = 'Athlete first name is required';
    if (!formData.athleteLastName.trim()) newErrors.athleteLastName = 'Athlete last name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.schoolId) newErrors.schoolId = 'School selection is required';
    if (!formData.finalDateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    // Age validation
    if (formData.finalDateOfBirth) {
      const age = calculateAge(formData.finalDateOfBirth);
      if (age < 5 || age > 25) {
        newErrors.dateOfBirth = 'Athlete age must be between 5 and 25 years';
      }
    }

    // Password validation
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      const registrationData = {
        fullName: `${formData.guardianFirstName} ${formData.guardianMiddleName} ${formData.guardianLastName}`.trim(),
        email: formData.email,
        phone: `+977${formData.mobile}`,
        password: formData.password,
        address: '', // Optional field
        relationship: formData.relationship,
        schoolName: formData.schoolName,
        schoolId: formData.schoolId,
        studentName: `${formData.athleteFirstName} ${formData.athleteMiddleName} ${formData.athleteLastName}`.trim(),
        dateOfBirth: formData.finalDateOfBirth
      };

      await register(registrationData);
      
      toast.success('Registration successful! Welcome to Athletiq!');
      
      // Redirect to dashboard
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/guardian-dashboard');
      }
      
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-4xl w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Guardian Registration</h1>
          <p className="text-gray-600">Join Athletiq and manage your athlete's journey</p>
        </div>

        {/* Registration Form */}
        <motion.form 
          onSubmit={handleSubmit} 
          className="bg-white shadow-xl rounded-2xl p-8 space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Guardian Information Section */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaUser className="mr-3 text-blue-500" />
              Guardian Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.guardianFirstName}
                  onChange={(e) => handleInputChange('guardianFirstName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.guardianFirstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.guardianFirstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.guardianFirstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.guardianMiddleName}
                  onChange={(e) => handleInputChange('guardianMiddleName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Middle name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.guardianLastName}
                  onChange={(e) => handleInputChange('guardianLastName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.guardianLastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.guardianLastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.guardianLastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaEnvelope className="inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="guardian@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="inline mr-2" />
                  Mobile Number *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                    +977
                  </span>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleInputChange('mobile', value);
                    }}
                    className={`flex-1 px-4 py-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.mobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="98XXXXXXXX"
                    maxLength="10"
                  />
                </div>
                {errors.mobile && (
                  <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUserFriends className="inline mr-2" />
                Relationship to Athlete *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => handleInputChange('relationship', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {relationshipOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Athlete Information Section */}
          <div className="border-b border-gray-200 pb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaChild className="mr-3 text-green-500" />
              Athlete Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.athleteFirstName}
                  onChange={(e) => handleInputChange('athleteFirstName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.athleteFirstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Athlete's first name"
                />
                {errors.athleteFirstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.athleteFirstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.athleteMiddleName}
                  onChange={(e) => handleInputChange('athleteMiddleName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Middle name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.athleteLastName}
                  onChange={(e) => handleInputChange('athleteLastName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.athleteLastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Athlete's last name"
                />
                {errors.athleteLastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.athleteLastName}</p>
                )}
              </div>
            </div>

            {/* Dual Calendar Date Input */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <FaCalendarAlt className="inline mr-2" />
                Date of Birth *
              </label>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* English Date */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">English Date (AD)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month</label>
                      <select
                        value={formData.englishDate.month}
                        onChange={(e) => handleEnglishDateChange('month', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Month</option>
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleDateString('en', {month: 'short'})}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Day</label>
                      <select
                        value={formData.englishDate.day}
                        onChange={(e) => handleEnglishDateChange('day', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Day</option>
                        {Array.from({length: 31}, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Year</label>
                      <select
                        value={formData.englishDate.year}
                        onChange={(e) => handleEnglishDateChange('year', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Year</option>
                        {Array.from({length: 21}, (_, i) => {
                          const year = 2020 - i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  {formData.englishDate.month && formData.englishDate.day && formData.englishDate.year && (
                    <div className="mt-2 text-sm text-gray-600">
                      {new Date(formData.englishDate.year, formData.englishDate.month - 1, formData.englishDate.day).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      <br />
                      <span className="text-green-600">Age: {calculateAge(formData.finalDateOfBirth)} years</span>
                    </div>
                  )}
                </div>

                {/* Nepali Date */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Nepali Date (BS)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month</label>
                      <select
                        value={formData.nepaliDate.month}
                        onChange={(e) => handleNepaliDateChange('month', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Month</option>
                        {nepaliMonths.map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month.np} ({month.en})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Day</label>
                      <select
                        value={formData.nepaliDate.day}
                        onChange={(e) => handleNepaliDateChange('day', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.nepaliDate.month || !formData.nepaliDate.year}
                      >
                        <option value="">Day</option>
                        {formData.nepaliDate.month && formData.nepaliDate.year && Array.from({
                          length: getDaysInNepaliMonth(formData.nepaliDate.year, formData.nepaliDate.month)
                        }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Year</label>
                      <select
                        value={formData.nepaliDate.year}
                        onChange={(e) => handleNepaliDateChange('year', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Year</option>
                        {Array.from({length: 21}, (_, i) => {
                          const year = 2077 - i;
                          return <option key={year} value={year}>{year} BS</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  {formData.nepaliDate.month && formData.nepaliDate.day && formData.nepaliDate.year && (
                    <div className="mt-2 text-sm text-gray-600">
                      {formatNepaliDate(formData.nepaliDate.year, formData.nepaliDate.month, formData.nepaliDate.day, 'np')}
                      <br />
                      <span className="text-green-600">Age: {calculateAge(formData.finalDateOfBirth)} years</span>
                    </div>
                  )}
                </div>
              </div>
              
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-2">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender and School */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaSchool className="inline mr-2" />
                  Search School *
                </label>
                <input
                  type="text"
                  value={schoolSearchTerm}
                  onChange={(e) => setSchoolSearchTerm(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.schoolId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Type school name (min 3 characters)"
                />
                
                {/* School Dropdown */}
                {schools.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {schools.map(school => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => handleSchoolSelect(school)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.location}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {searchingSchools && (
                  <div className="absolute right-3 top-11 text-gray-400">
                    Searching...
                  </div>
                )}
                
                {formData.schoolName && (
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <FaCheck className="mr-1" />
                    Selected: {formData.schoolName}
                  </div>
                )}
                
                {errors.schoolId && (
                  <p className="text-red-500 text-sm mt-1">{errors.schoolId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaLock className="mr-3 text-red-500" />
              Account Security
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength === 0 ? 'bg-gray-200' :
                          passwordStrength <= 25 ? 'bg-red-500' :
                          passwordStrength <= 50 ? 'bg-yellow-500' :
                          passwordStrength <= 75 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {passwordStrength === 0 ? 'Weak' :
                       passwordStrength <= 25 ? 'Weak' :
                       passwordStrength <= 50 ? 'Fair' :
                       passwordStrength <= 75 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                </div>
                
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {formData.confirmPassword && (
                  <div className="mt-2 flex items-center text-sm">
                    {formData.password === formData.confirmPassword ? (
                      <><FaCheck className="text-green-500 mr-1" /> Passwords match</>
                    ) : (
                      <><FaTimes className="text-red-500 mr-1" /> Passwords don't match</>
                    )}
                  </div>
                )}
                
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="pt-6">
            <div className="flex items-start space-x-3 mb-6">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I accept the{' '}
                <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-95'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>

            <div className="text-center mt-6">
              <span className="text-gray-600">Already have an account? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
