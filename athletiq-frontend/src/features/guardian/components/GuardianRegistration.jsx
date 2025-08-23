import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, FaPhone, FaEnvelope, FaLock, FaMapMarkerAlt, 
  FaUserFriends, FaGraduationCap, FaChild, FaCalendarAlt,
  FaEye, FaEyeSlash, FaArrowRight, FaCheck 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGuardianAuth } from '../hooks/useGuardianAuth';

export default function GuardianRegistration({ onSuccess, onSwitchToLogin }) {
  const { register, loading } = useGuardianAuth();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Guardian Info
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    relationship: 'parent',
    
    // Optional Child Info
    includeChild: false,
    childFullName: '',
    dateOfBirth: '',
    gender: '',
    schoolName: '',
    grade: ''
  });

  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const stepErrors = {};
    
    if (!formData.fullName.trim()) stepErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) stepErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) stepErrors.email = 'Please enter a valid email';
    if (!formData.phone.trim()) stepErrors.phone = 'Phone number is required';
    if (!formData.password) stepErrors.password = 'Password is required';
    else if (formData.password.length < 6) stepErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      stepErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep2 = () => {
    if (!formData.includeChild) return true;
    
    const stepErrors = {};
    if (!formData.childFullName.trim()) stepErrors.childFullName = 'Child name is required';
    if (!formData.dateOfBirth) stepErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) stepErrors.gender = 'Gender is required';
    if (!formData.schoolName.trim()) stepErrors.schoolName = 'School name is required';

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    try {
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: formData.address,
        relationship: formData.relationship
      };

      // Include child data if provided
      if (formData.includeChild) {
        registrationData.studentName = formData.childFullName;
        registrationData.dateOfBirth = formData.dateOfBirth;
        registrationData.schoolName = formData.schoolName;
      }

      const result = await register(registrationData);
      
      if (result.success) {
        setStep(4); // Success step
        if (onSuccess) {
          setTimeout(() => onSuccess(result.data), 2000);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const inputClasses = (fieldName) => `
    w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    transition-colors ${errors[fieldName] ? 'border-red-500' : 'border-gray-300'}
  `;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Guardian Registration</h2>
        <p className="text-gray-600">Create your guardian account to manage your children's activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaUser className="inline mr-2" />Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className={inputClasses('fullName')}
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaEnvelope className="inline mr-2" />Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={inputClasses('email')}
            placeholder="Enter your email address"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaPhone className="inline mr-2" />Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={inputClasses('phone')}
            placeholder="Enter your phone number"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaUserFriends className="inline mr-2" />Relationship
          </label>
          <select
            name="relationship"
            value={formData.relationship}
            onChange={handleInputChange}
            className={inputClasses('relationship')}
          >
            <option value="parent">Parent</option>
            <option value="guardian">Guardian</option>
            <option value="relative">Relative</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaLock className="inline mr-2" />Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={inputClasses('password')}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaLock className="inline mr-2" />Confirm Password *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={inputClasses('confirmPassword')}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaMapMarkerAlt className="inline mr-2" />Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className={inputClasses('address')}
          placeholder="Enter your complete address"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Child Information (Optional)</h2>
        <p className="text-gray-600">You can add your child's information now or later from the dashboard</p>
      </div>

      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="includeChild"
            checked={formData.includeChild}
            onChange={handleInputChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-3 text-sm font-medium text-gray-700">
            Add my child's information during registration
          </span>
        </label>
      </div>

      {formData.includeChild && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaChild className="inline mr-2" />Child's Full Name *
            </label>
            <input
              type="text"
              name="childFullName"
              value={formData.childFullName}
              onChange={handleInputChange}
              className={inputClasses('childFullName')}
              placeholder="Enter child's full name"
            />
            {errors.childFullName && <p className="text-red-500 text-sm mt-1">{errors.childFullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendarAlt className="inline mr-2" />Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={inputClasses('dateOfBirth')}
            />
            {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className={inputClasses('gender')}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <input
              type="text"
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className={inputClasses('grade')}
              placeholder="Enter grade (e.g., Grade 5)"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaGraduationCap className="inline mr-2" />School Name *
            </label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleInputChange}
              className={inputClasses('schoolName')}
              placeholder="Enter school name"
            />
            {errors.schoolName && <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
        <p className="text-gray-600">Please review your information before submitting</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium text-gray-700">Full Name:</span>
            <p className="text-gray-900">{formData.fullName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <p className="text-gray-900">{formData.email}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone:</span>
            <p className="text-gray-900">{formData.phone}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Relationship:</span>
            <p className="text-gray-900 capitalize">{formData.relationship}</p>
          </div>
        </div>

        {formData.address && (
          <div>
            <span className="font-medium text-gray-700">Address:</span>
            <p className="text-gray-900">{formData.address}</p>
          </div>
        )}

        {formData.includeChild && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Child Information:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <p className="text-gray-900">{formData.childFullName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date of Birth:</span>
                <p className="text-gray-900">{formData.dateOfBirth}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Gender:</span>
                <p className="text-gray-900 capitalize">{formData.gender}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">School:</span>
                <p className="text-gray-900">{formData.schoolName}</p>
              </div>
              {formData.grade && (
                <div>
                  <span className="font-medium text-gray-700">Grade:</span>
                  <p className="text-gray-900">{formData.grade}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
      >
        <FaCheck className="text-2xl text-green-600" />
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
      <p className="text-gray-600">
        Your guardian account has been created successfully. You will be redirected to your dashboard shortly.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {/* Progress Steps */}
          {step < 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                {[1, 2, 3].map((stepNum) => (
                  <React.Fragment key={stepNum}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      stepNum === step 
                        ? 'bg-blue-600 text-white' 
                        : stepNum < step 
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stepNum < step ? <FaCheck /> : stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-16 h-1 mx-2 ${
                        stepNum < step ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-center text-sm text-gray-600">
                <span className={step === 1 ? 'font-medium' : ''}>Guardian Info</span>
                <span className="mx-4">→</span>
                <span className={step === 2 ? 'font-medium' : ''}>Child Info</span>
                <span className="mx-4">→</span>
                <span className={step === 3 ? 'font-medium' : ''}>Review</span>
              </div>
            </div>
          )}

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex justify-between mt-8">
              <div>
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ← Previous
                  </button>
                )}
              </div>
              
              <div className="space-x-4">
                {onSwitchToLogin && (
                  <button
                    onClick={onSwitchToLogin}
                    className="px-6 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Already have an account? Login
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    Next <FaArrowRight className="ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
