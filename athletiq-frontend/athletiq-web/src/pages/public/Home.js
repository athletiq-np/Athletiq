//
// 🧠 ATHLETIQ - Smart Homepage
//
// This component serves as the main landing page for new users.
// It also intelligently redirects already logged-in users to their
// appropriate dashboard by checking the central user store.
//

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useUserStore from '@/store/userStore'; // Import our global user store
import { FaArrowRight, FaShieldAlt, FaTrophy, FaUsers, FaUserGraduate, FaUserTie } from 'react-icons/fa';

export default function Home() {
  // Get the user object from our Zustand store
  const { user } = useUserStore();
  const navigate = useNavigate();

  // This effect runs whenever the 'user' object changes.
  useEffect(() => {
    // If a user is logged in, redirect them to their dashboard.
    if (user) {
      switch (user.role) {
        case 'SuperAdmin':
          navigate('/admin/dashboard');
          break;
        case 'SchoolAdmin':
          navigate('/school/dashboard');
          break;
        // Add cases for other roles as they are built
        // case 'Player':
        //   navigate('/player/dashboard');
        //   break;
        default:
          // Default redirect for any other logged-in role
          navigate('/dashboard'); 
      }
    }
    // The dependency array [user, navigate] ensures this effect re-runs
    // if the user logs in or out.
  }, [user, navigate]);

  // If no user is logged in, we render the public landing page.
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-athletiq-navy">ATHLETIQ</div>
          <div className="flex space-x-4">
            <Link to="/login" className="px-4 py-2 font-semibold text-athletiq-navy hover:text-athletiq-green transition-colors">
              Login
            </Link>
            <Link to="/guardian/register" className="px-6 py-2 font-semibold text-white bg-athletiq-green rounded-lg hover:bg-green-700 transition-colors flex items-center">
              <FaUserGraduate className="mr-2" />
              Guardian Portal
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-athletiq-navy leading-tight">
          The Future of Youth Sports is Here.
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Athletiq provides a unified platform to give every young athlete a verified digital identity, track their performance, and manage tournaments with ease.
        </p>
        
        {/* Dual CTA buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/register"
            className="px-8 py-4 text-lg font-bold text-white bg-athletiq-green rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-transform flex items-center"
          >
            <FaUserTie className="mr-3" />
            Register Your School
            <FaArrowRight className="ml-2" />
          </Link>
          
          <Link
            to="/guardian/register"
            className="px-8 py-4 text-lg font-bold text-athletiq-green border-2 border-athletiq-green rounded-lg shadow-lg hover:bg-athletiq-green hover:text-white transform hover:scale-105 transition-all flex items-center"
          >
            <FaUserGraduate className="mr-3" />
            Parent/Guardian Registration
          </Link>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          Parents: Register your child for school sports • Schools: Manage tournaments and athletes
        </p>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <FaUsers className="text-4xl text-athletiq-green mb-4" />
            <h3 className="text-xl font-bold text-athletiq-navy mb-2">Digital Identity</h3>
            <p className="text-gray-600">Provide every athlete with a permanent, verified digital profile to track their entire career.</p>
          </div>
          <div className="flex flex-col items-center">
            <FaTrophy className="text-4xl text-athletiq-green mb-4" />
            <h3 className="text-xl font-bold text-athletiq-navy mb-2">Tournament Management</h3>
            <p className="text-gray-600">Effortlessly create, manage, and share multi-sport tournaments with automated fixtures and live results.</p>
          </div>
          <div className="flex flex-col items-center">
            <FaShieldAlt className="text-4xl text-athletiq-green mb-4" />
            <h3 className="text-xl font-bold text-athletiq-navy mb-2">Verified Data</h3>
            <p className="text-gray-600">Ensure data integrity with AI-powered document verification for age and identity validation.</p>
          </div>
        </div>
      </section>

      {/* Guardian Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-athletiq-navy mb-8">For Parents & Guardians</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <FaUserGraduate className="text-4xl text-athletiq-green mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-3">Easy Registration</h3>
              <p className="text-gray-600 mb-4">
                Register your child for school sports in minutes. Support for both Nepali and English calendars, 
                with automatic school verification.
              </p>
              <Link
                to="/guardian/register"
                className="inline-block bg-athletiq-green text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Registration
              </Link>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <FaShieldAlt className="text-4xl text-athletiq-green mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-3">Safe & Secure</h3>
              <p className="text-gray-600 mb-4">
                Your child's data is protected with enterprise-grade security. Schools review all registrations 
                before approval.
              </p>
              <div className="text-sm text-gray-500">
                🔒 Nepal-compliant data protection
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}