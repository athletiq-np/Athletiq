// Simple Guardian Portal - No complex logic, just basic forms
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';

export default function SimpleGuardianPortal() {
  // Simple state
  const [view, setView] = useState('welcome');
  const [loading, setLoading] = useState(false);
  
  // Registration form
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+977');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [studentName, setStudentName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  // School search
  const [schools, setSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  // Login form  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Child form
  const [childFullName, setChildFullName] = useState('');
  const [childDateOfBirth, setChildDateOfBirth] = useState('');
  const [childGender, setChildGender] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [childSchoolName, setChildSchoolName] = useState('');
  const [childSelectedSchoolId, setChildSelectedSchoolId] = useState(null);

  // Enhanced athlete profile fields
  const [childAddress, setChildAddress] = useState('');
  const [childNationality, setChildNationality] = useState('Nepali');
  const [childBloodGroup, setChildBloodGroup] = useState('');
  const [childHeight, setChildHeight] = useState('');
  const [childWeight, setChildWeight] = useState('');
  const [childEmergencyContact, setChildEmergencyContact] = useState('');
  const [childMedicalConditions, setChildMedicalConditions] = useState('');
  const [childSportsInterests, setChildSportsInterests] = useState([]);
  const [childAchievements, setChildAchievements] = useState('');

  // Document management
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [documentsUploading, setDocumentsUploading] = useState(false);
  const [ocrExtractedData, setOcrExtractedData] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  // Children management
  const [children, setChildren] = useState([]);
  const [editingChildId, setEditingChildId] = useState(null);

  // Load schools from API
  const loadSchools = async (searchTerm = '') => {
    try {
      const url = searchTerm
        ? `/guardian-simple/schools?search=${encodeURIComponent(searchTerm)}`
        : '/guardian-simple/schools';
      const response = await apiClient.get(url);
      if (response.data.success) {
        setSchools(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load schools:', error);
    }
  };

  // Handle school search
  const handleSchoolSearch = (value) => {
    setSchoolSearch(value);
    setSchoolName('');
    setSelectedSchoolId(null);
    setShowSchoolDropdown(true);
    if (value.length > 0) {
      loadSchools(value);
    } else {
      setSchools([]);
    }
  };

  // Handle school search for child forms
  const handleChildSchoolSearch = (value) => {
    setSchoolSearch(value);
    setChildSchoolName('');
    setChildSelectedSchoolId(null);
    setShowSchoolDropdown(true);
    if (value.length > 0) {
      loadSchools(value);
    } else {
      setSchools([]);
    }
  };

  // Select school from dropdown
  const selectSchool = (school) => {
    setSchoolName(school.school_name);
    setSelectedSchoolId(school.school_id);
    setSchoolSearch(school.school_name);
    setShowSchoolDropdown(false);
  };

  // Select school for child forms
  const selectChildSchool = (school) => {
    setChildSchoolName(school.school_name);
    setChildSelectedSchoolId(school.school_id);
    setSchoolSearch(school.school_name);
    setShowSchoolDropdown(false);
  };

  // Clear school selection
  const clearSchool = () => {
    setSchoolName('');
    setSelectedSchoolId(null);
    setSchoolSearch('');
    setShowSchoolDropdown(false);
  };

  // Clear child school selection
  const clearChildSchool = () => {
    setChildSchoolName('');
    setChildSelectedSchoolId(null);
    setSchoolSearch('');
    setShowSchoolDropdown(false);
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size should be less than 5MB');
        return;
      }
      setProfilePhoto(file);
    }
  };

  // Handle birth certificate upload and OCR
  const handleBirthCertificateUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
        toast.error('Please select a valid image or PDF file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      setBirthCertificate(file);
      
      // Process OCR immediately
      await processBirthCertificateOCR(file);
    }
  };

  // Process birth certificate with GPT Vision OCR
  const processBirthCertificateOCR = async (file) => {
    try {
      setOcrProcessing(true);
      toast.info('Processing birth certificate with AI...');

      const formData = new FormData();
      formData.append('document', file);
      
      const guardianToken = localStorage.getItem('guardianToken');
      const response = await apiClient.post('/guardian-simple/process-birth-certificate', formData, {
        headers: {
          'Authorization': `Bearer ${guardianToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const extractedData = response.data.data;
        setOcrExtractedData(extractedData);
        
        // Auto-fill form fields with extracted data
        if (extractedData.fullName) setChildFullName(extractedData.fullName);
        if (extractedData.dateOfBirth) setChildDateOfBirth(extractedData.dateOfBirth);
        if (extractedData.gender) setChildGender(extractedData.gender);
        if (extractedData.address) setChildAddress(extractedData.address);
        if (extractedData.nationality) setChildNationality(extractedData.nationality);
        
        toast.success('Birth certificate processed! Data has been auto-filled.');
      } else {
        toast.error('Failed to process birth certificate: ' + response.data.message);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Failed to process birth certificate. Please fill manually.');
    } finally {
      setOcrProcessing(false);
    }
  };

  // Upload documents to server
  const uploadDocuments = async (athleteId) => {
    if (!profilePhoto && !birthCertificate) return { success: true };

    try {
      setDocumentsUploading(true);
      const formData = new FormData();
      
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }
      if (birthCertificate) {
        formData.append('birthCertificate', birthCertificate);
      }
      
      formData.append('athleteId', athleteId);
      
      const guardianToken = localStorage.getItem('guardianToken');
      const response = await apiClient.post('/guardian-simple/upload-documents', formData, {
        headers: {
          'Authorization': `Bearer ${guardianToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUploadedDocuments(response.data.data.documents || []);
        toast.success('Documents uploaded successfully!');
        return { success: true };
      } else {
        toast.error('Failed to upload documents: ' + response.data.message);
        return { success: false };
      }
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Failed to upload documents');
      return { success: false };
    } finally {
      setDocumentsUploading(false);
    }
  };

  // Clear all child form fields
  const clearChildForm = () => {
    setChildFullName('');
    setChildDateOfBirth('');
    setChildGender('');
    setChildGrade('');
    setChildSchoolName('');
    setChildSelectedSchoolId(null);
    setSchoolSearch('');
    setShowSchoolDropdown(false);
    
    // Clear enhanced fields
    setChildAddress('');
    setChildNationality('Nepali');
    setChildBloodGroup('');
    setChildHeight('');
    setChildWeight('');
    setChildEmergencyContact('');
    setChildMedicalConditions('');
    setChildSportsInterests([]);
    setChildAchievements('');
    
    // Clear documents
    setProfilePhoto(null);
    setBirthCertificate(null);
    setOcrExtractedData(null);
    setUploadedDocuments([]);
  };

  // Load schools on component mount
  useEffect(() => {
    loadSchools();
    
    // Check if user is already logged in
    const token = localStorage.getItem('guardianToken');
    const guardianInfo = localStorage.getItem('guardianInfo');
    
    if (token && guardianInfo) {
      console.log('User already logged in, redirecting to dashboard');
      setView('dashboard');
      loadChildren(); // Load children when logged in
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSchoolDropdown(false);
    };
    
    if (showSchoolDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSchoolDropdown]);

  // Load children when dashboard is viewed
  useEffect(() => {
    if (view === 'dashboard') {
      loadChildren();
    }
  }, [view]);

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (!schoolName || !selectedSchoolId) {
      toast.error('Please select a school from the dropdown!');
      return;
    }

    setLoading(true);
    try {
      console.log('Registration data:', {
        fullName: guardianName,
        email: email,
        phone: countryCode + phone,
        password: password,
        address: '',
        relationship: relationship,
        schoolName: schoolName,
        schoolId: selectedSchoolId,
        studentName: studentName,
        dateOfBirth: dateOfBirth
      });
      
      // Register guardian
      const response = await apiClient.post('/guardian-simple/register', {
        fullName: guardianName,
        email: email,
        phone: countryCode + phone,
        password: password,
        address: '',
        relationship: relationship,
        schoolName: schoolName,
        schoolId: selectedSchoolId,
        studentName: studentName,
        dateOfBirth: dateOfBirth
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        toast.success('Registration successful! Welcome to your dashboard!');
        
        // Store auth data if provided
        console.log('Response data structure:', {
          hasData: !!response.data.data,
          hasToken: !!(response.data.data && response.data.data.token),
          data: response.data.data
        });
        
        if (response.data.data && response.data.data.token) {
          localStorage.setItem('guardianToken', response.data.data.token);
          localStorage.setItem('guardianInfo', JSON.stringify(response.data.data.guardian));
          console.log('Auth data stored successfully');
        } else {
          console.log('No token found in response, will still redirect to dashboard');
        }
        
        // Always go to dashboard after successful registration
        console.log('Setting view to dashboard...');
        setView('dashboard');
        
        // Clear form
        setEmail('');
        setCountryCode('+977');
        setPhone('');
        setGuardianName('');
        setRelationship('Parent');
        setStudentName('');
        setDateOfBirth('');
        setPassword('');
        setConfirmPassword('');
        setSchoolName('');
        setSchoolSearch('');
        setSelectedSchoolId(null);
        setShowSchoolDropdown(false);
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.post('/guardian-simple/login', {
        email: loginEmail,
        password: loginPassword
      });
      
      if (response.data.success) {
        toast.success('Login successful!');
        // Store auth data
        localStorage.setItem('guardianToken', response.data.data.token);
        localStorage.setItem('guardianInfo', JSON.stringify(response.data.data.guardian));
        setView('dashboard');
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle add child
  const handleAddChild = async (e) => {
    e.preventDefault();
    
    if (!childFullName || !childDateOfBirth || !childGender || !childGrade || !childSchoolName) {
      toast.error('Please fill in all required fields!');
      return;
    }

    setLoading(true);
    try {
      const guardianToken = localStorage.getItem('guardianToken');
      const response = await apiClient.post('/guardian-simple/add-child', {
        childFullName,
        dateOfBirth: childDateOfBirth,
        gender: childGender,
        grade: childGrade,
        schoolName: childSchoolName,
        schoolId: childSelectedSchoolId
      }, {
        headers: {
          'Authorization': `Bearer ${guardianToken}`
        }
      });
      
      if (response.data.success) {
        toast.success('Child added successfully!');
        // Clear form
        setChildFullName('');
        setChildDateOfBirth('');
        setChildGender('');
        setChildGrade('');
        setChildSchoolName('');
        setChildSelectedSchoolId(null);
        setSchoolSearch('');
        setShowSchoolDropdown(false);
        // Reload children and go back to dashboard
        await loadChildren();
        setView('dashboard');
      } else {
        toast.error(response.data.message || 'Failed to add child');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  // Load children
  const loadChildren = async () => {
    try {
      const guardianToken = localStorage.getItem('guardianToken');
      console.log('Loading children, token exists:', !!guardianToken);
      if (!guardianToken) return;

      const response = await apiClient.get('/guardian-simple/children', {
        headers: {
          'Authorization': `Bearer ${guardianToken}`
        }
      });
      
      console.log('Children response:', response.data);
      
      if (response.data.success) {
        console.log('Setting children data:', response.data.data);
        setChildren(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    }
  };

  // Handle edit child
  const handleEditChild = async (child) => {
    try {
      setEditingChildId(child.id);
      
      // Load basic info
      setChildFullName(child.full_name);
      setChildDateOfBirth(child.date_of_birth);
      setChildGender(child.gender || '');
      setChildGrade(child.grade || '');
      setChildSchoolName(child.school_name);
      setChildSelectedSchoolId(child.school_id);
      setSchoolSearch(child.school_name);
      
      // Load extended athlete profile
      const guardianToken = localStorage.getItem('guardianToken');
      const response = await apiClient.get(`/guardian-simple/athlete-profile/${child.id}`, {
        headers: {
          'Authorization': `Bearer ${guardianToken}`
        }
      });
      
      if (response.data.success) {
        const profile = response.data.data;
        setChildAddress(profile.address || '');
        setChildNationality(profile.nationality || 'Nepali');
        setChildBloodGroup(profile.blood_group || '');
        setChildHeight(profile.height || '');
        setChildWeight(profile.weight || '');
        setChildEmergencyContact(profile.emergency_contact || '');
        setChildMedicalConditions(profile.medical_conditions || '');
        setChildSportsInterests(profile.sports_interests || []);
        setChildAchievements(profile.achievements || '');
        setUploadedDocuments(profile.documents || []);
      }
      
      setView('edit-athlete-profile');
    } catch (error) {
      console.error('Failed to load athlete profile:', error);
      // Fallback to basic edit
      setEditingChildId(child.id);
      setChildFullName(child.full_name);
      setChildDateOfBirth(child.date_of_birth);
      setChildGender(child.gender || '');
      setChildGrade(child.grade || '');
      setChildSchoolName(child.school_name);
      setChildSelectedSchoolId(child.school_id);
      setSchoolSearch(child.school_name);
      setView('edit-athlete-profile');
    }
  };

  // Handle update child
  const handleUpdateChild = async (e) => {
    e.preventDefault();
    
    if (!childFullName || !childDateOfBirth || !childSchoolName) {
      toast.error('Please fill in all required fields!');
      return;
    }

    setLoading(true);
    try {
      const guardianToken = localStorage.getItem('guardianToken');
      
      // Update athlete profile with complete data
      const updateData = {
        // Basic info
        fullName: childFullName,
        dateOfBirth: childDateOfBirth,
        gender: childGender,
        grade: childGrade,
        schoolName: childSchoolName,
        schoolId: childSelectedSchoolId,
        
        // Enhanced profile data
        address: childAddress,
        nationality: childNationality,
        bloodGroup: childBloodGroup,
        height: childHeight,
        weight: childWeight,
        emergencyContact: childEmergencyContact,
        medicalConditions: childMedicalConditions,
        sportsInterests: childSportsInterests,
        achievements: childAchievements
      };
      
      const response = await apiClient.put(`/guardian-simple/athlete-profile/${editingChildId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${guardianToken}`
        }
      });
      
      if (response.data.success) {
        // Upload documents if any
        if (profilePhoto || birthCertificate) {
          const uploadResult = await uploadDocuments(editingChildId);
          if (!uploadResult.success) {
            toast.warning('Profile updated but some documents failed to upload');
          }
        }
        
        toast.success('Athlete profile updated successfully!');
        clearChildForm();
        setEditingChildId(null);
        // Reload children and go back to dashboard
        await loadChildren();
        setView('dashboard');
      } else {
        toast.error(response.data.message || 'Failed to update athlete profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update athlete profile');
    } finally {
      setLoading(false);
    }
  };

  // Welcome screen
  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Guardian Portal</h1>
            <p className="text-gray-600">Simple registration and login</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setView('register')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
            >
              New Guardian - Register
            </button>
            
            <button
              onClick={() => setView('login')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700"
            >
              Existing Guardian - Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  if (view === 'register') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <button 
              onClick={() => setView('welcome')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Guardian Registration</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian Name
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship to Student
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Relative">Relative</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+977"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your child's full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={schoolName || schoolSearch}
                  onChange={(e) => handleSchoolSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search for your child's school..."
                  required
                  disabled={!!schoolName}
                />
                
                {/* School dropdown */}
                {showSchoolDropdown && schoolSearch && !schoolName && schools.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {schools.map((school, idx) => (
                      <button
                        key={school.school_id || idx}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => selectSchool(school)}
                      >
                        <div className="font-medium">{school.school_name}</div>
                        <div className="text-sm text-gray-500">{school.city || 'City not specified'}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Selected school indicator */}
                {schoolName && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-green-600">✓ Selected: {schoolName}</p>
                    <button
                      type="button"
                      onClick={clearSchool}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Change School
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create a secure password"
                minLength="6"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
                minLength="6"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button 
                onClick={() => setView('login')} 
                className="text-blue-600 hover:text-blue-800"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <button 
              onClick={() => setView('welcome')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Guardian Login</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button 
                onClick={() => setView('register')} 
                className="text-blue-600 hover:text-blue-800"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Athlete Profile Editor
  if (view === 'edit-athlete-profile' && editingChildId) {
    const editingChild = children.find(child => child.id === editingChildId);
    
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setView('dashboard')}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              
              {editingChild && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  editingChild.verification_status === 'verified' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {editingChild.verification_status === 'verified' ? 'Verified Athlete' : 'Pending Approval'}
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Athlete Profile Manager</h1>
            <p className="text-gray-600">Complete athlete information, documents, and profile management</p>
            
            {ocrExtractedData && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-blue-800">Data extracted from birth certificate</span>
                </div>
                <p className="text-sm text-blue-700">
                  Information has been automatically filled from the uploaded birth certificate. Please review and adjust as needed.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleUpdateChild} className="space-y-6">
            
            {/* Profile Photo and Documents Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Photo & Documents</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {profilePhoto ? (
                        <img
                          src={URL.createObjectURL(profilePhoto)}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Birth Certificate Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Certificate
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleBirthCertificateUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      disabled={ocrProcessing}
                    />
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    
                    {ocrProcessing && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-sm">Processing with AI...</span>
                      </div>
                    )}
                    
                    {birthCertificate && (
                      <div className="text-sm text-green-600">
                        ✓ {birthCertificate.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Display */}
              {uploadedDocuments.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Previously Uploaded Documents</h3>
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{doc.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{doc.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={childFullName}
                    onChange={(e) => setChildFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={childDateOfBirth}
                    onChange={(e) => setChildDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={childGender}
                    onChange={(e) => setChildGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade/Class *
                  </label>
                  <select
                    value={childGrade}
                    onChange={(e) => setChildGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select grade</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                      <option key={grade} value={`Grade ${grade}`}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={childNationality}
                    onChange={(e) => setChildNationality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nepali"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <select
                    value={childBloodGroup}
                    onChange={(e) => setChildBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={childAddress}
                  onChange={(e) => setChildAddress(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Complete address"
                />
              </div>
            </div>

            {/* School Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">School Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => handleChildSchoolSearch(e.target.value)}
                    onFocus={() => setShowSchoolDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search and select school"
                    required
                  />
                  
                  {showSchoolDropdown && schools.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {schools.map((school) => (
                        <div
                          key={school.school_id}
                          onClick={() => selectChildSchool(school)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{school.school_name}</div>
                          <div className="text-sm text-gray-500">{school.student_count} students</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {childSchoolName && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Selected: {childSchoolName}
                  </div>
                )}
              </div>
            </div>

            {/* Physical & Health Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Physical & Health Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={childHeight}
                    onChange={(e) => setChildHeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={childWeight}
                    onChange={(e) => setChildWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 45"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    value={childEmergencyContact}
                    onChange={(e) => setChildEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+977-9XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions / Allergies
                </label>
                <textarea
                  value={childMedicalConditions}
                  onChange={(e) => setChildMedicalConditions(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List any medical conditions, allergies, or special requirements"
                />
              </div>
            </div>

            {/* Sports & Achievements */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sports & Achievements</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sports Interests
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {['Football', 'Basketball', 'Cricket', 'Volleyball', 'Badminton', 'Table Tennis', 'Athletics', 'Swimming', 'Martial Arts', 'Others'].map(sport => (
                      <label key={sport} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={childSportsInterests.includes(sport)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setChildSportsInterests([...childSportsInterests, sport]);
                            } else {
                              setChildSportsInterests(childSportsInterests.filter(s => s !== sport));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{sport}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achievements & Awards
                  </label>
                  <textarea
                    value={childAchievements}
                    onChange={(e) => setChildAchievements(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="List any sports achievements, awards, or recognitions"
                  />
                </div>
              </div>
            </div>

            {/* Status Information */}
            {editingChild && (
              <div className={`rounded-lg p-6 border-2 ${
                editingChild.verification_status === 'verified' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <svg className={`w-6 h-6 ${
                    editingChild.verification_status === 'verified' ? 'text-green-600' : 'text-orange-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {editingChild.verification_status === 'verified' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                  <h3 className={`text-xl font-semibold ${
                    editingChild.verification_status === 'verified' ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    {editingChild.verification_status === 'verified' ? 'Verified Athlete' : 'Pending School Approval'}
                  </h3>
                </div>
                
                <p className={`text-sm mb-4 ${
                  editingChild.verification_status === 'verified' ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {editingChild.verification_status === 'verified' 
                    ? 'This athlete has been verified by the school and can participate in activities.'
                    : 'This athlete is waiting for approval from the school. Complete profile information to speed up the approval process.'
                  }
                </p>
                
                {editingChild.athlete_id && (
                  <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Nepal Athlete ID: {editingChild.athlete_id}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || documentsUploading}
                className="flex-2 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {loading || documentsUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {documentsUploading ? 'Uploading...' : 'Updating...'}
                  </>
                ) : (
                  'Save Athlete Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Add Child Form
  if (view === 'add-child') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <button 
              onClick={() => setView('dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Add Child to Your Account</h2>
            <p className="text-gray-600">Add your child's information to start managing their athletic activities</p>
          </div>

          <form onSubmit={handleAddChild} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child's Full Name *
                </label>
                <input
                  type="text"
                  value={childFullName}
                  onChange={(e) => setChildFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter child's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={childDateOfBirth}
                  onChange={(e) => setChildDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={childGender}
                  onChange={(e) => setChildGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade/Class *
                </label>
                <select
                  value={childGrade}
                  onChange={(e) => setChildGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select grade</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => handleChildSchoolSearch(e.target.value)}
                  onFocus={() => setShowSchoolDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search and select school"
                  required
                />
                
                {showSchoolDropdown && schools.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {schools.map((school) => (
                      <div
                        key={school.school_id}
                        onClick={() => selectChildSchool(school)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="font-medium">{school.school_name}</div>
                        <div className="text-sm text-gray-500">{school.student_count} students</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {childSchoolName && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Selected: {childSchoolName}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800">What happens next?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    After adding your child, we'll check if they're already registered in the school system. 
                    If found, we'll link their records. If not, we'll submit a registration request to the school for approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding Child...' : 'Add Child'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  if (view === 'dashboard') {
    const guardianInfo = JSON.parse(localStorage.getItem('guardianInfo') || '{}');
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Guardian Dashboard</h1>
                <p className="text-gray-600">Welcome back, {guardianInfo.fullName || 'Guardian'}!</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('guardianToken');
                  localStorage.removeItem('guardianInfo');
                  setView('welcome');
                  setLoginEmail('');
                  setLoginPassword('');
                  toast.success('Logged out successfully');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Profile Summary Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Profile Summary</h2>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit Profile</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-800">{guardianInfo.fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-800">{guardianInfo.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-800">{guardianInfo.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Account Status</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {guardianInfo.accountStatus || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Children Management */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">My Children</h2>
                  <button 
                    onClick={() => setView('add-child')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Child
                  </button>
                </div>
                
                <div className="space-y-4">
                  {children.length > 0 ? (
                    children.map((child) => (
                      <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">{child.full_name}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                child.verification_status === 'verified' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {child.verification_status === 'verified' ? 'Approved' : 'Pending Approval'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Date of Birth:</span>
                                <p className="text-gray-800">{child.date_of_birth || 'Not provided'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Gender:</span>
                                <p className="text-gray-800">{child.gender || 'Not provided'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Grade:</span>
                                <p className="text-gray-800">{child.grade || 'Not provided'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">School:</span>
                                <p className="text-gray-800">{child.school_name}</p>
                              </div>
                            </div>
                            
                            {child.athlete_id && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-medium text-green-800">Nepal Athlete ID: {child.athlete_id}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditChild(child)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No children added yet</h3>
                      <p className="text-gray-500 mb-4">Start by adding your children to manage their athletic activities</p>
                      <button 
                        onClick={() => setView('add-child')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                      >
                        Add Your First Child
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Children</span>
                    <span className="font-semibold text-blue-600">{children.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Athletes</span>
                    <span className="font-semibold text-green-600">
                      {children.filter(child => child.verification_status === 'verified' && child.athlete_id).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Approvals</span>
                    <span className="font-semibold text-orange-600">
                      {children.filter(child => child.verification_status !== 'verified').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setView('add-child')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Add Child</p>
                      <p className="text-sm text-gray-500">Register a new child</p>
                    </div>
                  </button>
                  
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">View Reports</p>
                      <p className="text-sm text-gray-500">Performance reports</p>
                    </div>
                  </button>
                  
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Events Calendar</p>
                      <p className="text-sm text-gray-500">Upcoming events</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="text-center py-4">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                  </svg>
                  <p className="text-gray-600 text-sm">No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
