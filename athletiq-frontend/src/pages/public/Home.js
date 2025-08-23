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
            <Link to="/login" className="px-8 py-3 font-semibold text-white bg-athletiq-green rounded-lg hover:bg-green-700 transition-colors shadow-lg">
              Login Portal
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-athletiq-navy leading-tight">
          Welcome to ATHLETIQ
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Your unified platform for youth sports management. Schools, administrators, parents, and guardians can all access their personalized dashboards through our single login portal.
        </p>
        
        {/* Single CTA button */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/login"
            className="px-12 py-4 text-xl font-bold text-white bg-athletiq-green rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-transform flex items-center"
          >
            <FaUsers className="mr-3" />
            Access Login Portal
            <FaArrowRight className="ml-3" />
          </Link>
        </div>
        
        <p className="mt-6 text-sm text-gray-500 max-w-lg mx-auto">
          Single portal for all users • Schools • Administrators • Parents • Guardians
        </p>
      </main>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-athletiq-navy mb-12">One Platform, Every User Type</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <FaUserTie className="text-4xl text-athletiq-green mb-4" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-2">School Admins</h3>
              <p className="text-gray-600">Manage athletes, tournaments, and school sports programs.</p>
            </div>
            <div className="flex flex-col items-center">
              <FaShieldAlt className="text-4xl text-athletiq-green mb-4" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-2">Super Admins</h3>
              <p className="text-gray-600">Oversee the entire platform and monitor all activities.</p>
            </div>
            <div className="flex flex-col items-center">
              <FaUserGraduate className="text-4xl text-athletiq-green mb-4" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-2">Parents</h3>
              <p className="text-gray-600">Register children and track their sports participation.</p>
            </div>
            <div className="flex flex-col items-center">
              <FaUsers className="text-4xl text-athletiq-green mb-4" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-2">Guardians</h3>
              <p className="text-gray-600">Manage multiple children and their school enrollments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-athletiq-navy mb-12">Why Choose ATHLETIQ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <FaTrophy className="text-4xl text-athletiq-green mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-3">Tournament Management</h3>
              <p className="text-gray-600">
                Effortlessly create and manage multi-sport tournaments with automated fixtures and live results.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <FaUsers className="text-4xl text-athletiq-green mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-3">Digital Identity</h3>
              <p className="text-gray-600">
                Provide every athlete with a permanent, verified digital profile to track their entire career.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <FaShieldAlt className="text-4xl text-athletiq-green mb-4 mx-auto" />
              <h3 className="text-xl font-bold text-athletiq-navy mb-3">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with Nepal-compliant data protection and AI-powered verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}