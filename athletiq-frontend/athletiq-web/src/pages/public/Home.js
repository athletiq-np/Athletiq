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
import { FaArrowRight, FaShieldAlt, FaTrophy, FaUsers } from 'react-icons/fa';

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
          <div>
            <Link to="/login" className="px-6 py-2 font-semibold text-white bg-athletiq-green rounded-lg hover:bg-green-700">
              Login
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
        <Link
          to="/register"
          className="mt-8 inline-block px-8 py-4 text-lg font-bold text-white bg-athletiq-green rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-transform"
        >
          Register Your School Today <FaArrowRight className="inline ml-2" />
        </Link>
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
    </div>
  );
}