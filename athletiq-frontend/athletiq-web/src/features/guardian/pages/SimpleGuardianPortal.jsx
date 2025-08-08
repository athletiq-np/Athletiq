import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';
import GuardianRegistrationNew from '../components/GuardianRegistrationNew';
import GuardianLoginForm from '../components/GuardianLoginForm';
import GuardianDashboard from '../components/GuardianDashboard';

export default function SimpleGuardianPortal() {
  const [view, setView] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [guardian, setGuardian] = useState(null);

  // On mount, check for existing login
  useEffect(() => {
    const token = localStorage.getItem('guardianToken');
    const guardianInfo = localStorage.getItem('guardianInfo');
    if (token && guardianInfo) {
      setGuardian(JSON.parse(guardianInfo));
      setView('dashboard');
    }
  }, []);

  // Registration handler
  const handleRegister = async (formData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/guardian/register', {
        fullName: formData.guardianName,
        email: formData.email,
        phone: formData.countryCode + formData.phone,
        password: formData.password,
        address: '',
        relationship: formData.relationship,
        schoolName: formData.schoolName,
        schoolId: formData.selectedSchoolId,
        studentName: formData.studentName,
        dateOfBirth: formData.dateOfBirth,
      });
      if (response.data.success) {
        toast.success('Registration successful! Welcome to your dashboard!');
        if (response.data.data && response.data.data.token) {
          localStorage.setItem('guardianToken', response.data.data.token);
          localStorage.setItem('guardianInfo', JSON.stringify(response.data.data.guardian));
          setGuardian(response.data.data.guardian);
        }
        setView('dashboard');
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (formData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/guardian/login', {
        email: formData.email,
        password: formData.password,
      });
      if (response.data.success) {
        toast.success('Login successful!');
        if (response.data.data && response.data.data.token) {
          localStorage.setItem('guardianToken', response.data.data.token);
          localStorage.setItem('guardianInfo', JSON.stringify(response.data.data.guardian));
          setGuardian(response.data.data.guardian);
        }
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

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('guardianToken');
    localStorage.removeItem('guardianInfo');
    setGuardian(null);
    setView('welcome');
    toast.info('Logged out successfully');
  };

  // View rendering
  if (view === 'dashboard' && guardian) {
    return <GuardianDashboard guardian={guardian} onLogout={handleLogout} />;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      {view === 'welcome' && (
        <>
          <h2 className="text-xl font-bold mb-4">Guardian Portal</h2>
          <div className="space-x-2 mb-4">
            <button className="btn btn-primary" onClick={() => setView('register')}>Register</button>
            <button className="btn btn-secondary" onClick={() => setView('login')}>Login</button>
          </div>
        </>
      )}
      {view === 'register' && (
        <>
          <h2 className="text-lg font-bold mb-2">Guardian Registration</h2>
          <GuardianRegistrationNew 
            onSuccess={() => {
              setView('dashboard');
              toast.success('Registration successful!');
            }}
            onSwitchToLogin={() => setView('login')}
          />
          <button className="btn btn-link mt-2" onClick={() => setView('welcome')}>Back</button>
        </>
      )}
      {view === 'login' && (
        <>
          <h2 className="text-lg font-bold mb-2">Guardian Login</h2>
          <GuardianLoginForm onLogin={handleLogin} loading={loading} />
          <button className="btn btn-link mt-2" onClick={() => setView('welcome')}>Back</button>
        </>
      )}
    </div>
  );
}
