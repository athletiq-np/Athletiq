//
// 🧠 ATHLETIQ - Super Admin Dashboard (Upgraded for Zustand & Focused Data Fetching)
//
// This component now uses the central Zustand store for user data and has a
// simplified, more reliable data fetching strategy.
//

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore'; // Import our global user store

// Import child components (tabs)
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchoolsTab from "@/components/features/admin/SchoolsTab";
// We will add these back as we build them out
// import PlayersTab from "@/components/features/admin/PlayersTab";
// import TournamentsTab from "@/components/features/tournament/TournamentsTab";

export default function AdminDashboard() {
  // --- Global State ---
  // Get the user and the logout function from our central store
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  // --- Local Component State ---
  const [view, setView] = useState("Schools"); // Default view
  const [schools, setSchools] = useState([]);  // State for the list of schools
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Data Fetching ---
  // This useEffect hook runs once when the component mounts.
  // Its only job now is to fetch the list of all schools.
  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoading(true);
      setError("");
      try {
        // We call the dedicated endpoint for getting schools.
        // The 'protect' and 'checkRole' middleware on the backend handles security.
        const response = await apiClient.get('/schools');
        setSchools(response.data.schools || []);
      } catch (err) {
        console.error("Error fetching schools:", err);
        setError(err.response?.data?.message || "Failed to load school data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []); // Empty dependency array ensures this runs only once.


  // --- Event Handlers ---
  const handleLogout = async () => {
    try {
      await apiClient.get('/auth/logout'); // Call the backend logout endpoint
    } catch (error) {
      console.error("Logout failed, but clearing client state anyway.", error);
    } finally {
      // Clear user data from the global store and redirect to login
      clearUser();
      navigate('/login');
    }
  };

  // --- UI Rendering ---
  // This function decides which tab component to show based on the 'view' state.
  const renderActiveView = () => {
    if (isLoading) {
      return <div className="p-4 text-center">Loading schools...</div>;
    }
    if (error) {
      return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    switch (view) {
      case "Schools":
        // Pass the fetched schools data and the refetch function to the SchoolsTab
        return <SchoolsTab schools={schools} refetchSchools={() => useEffect(() => { fetchSchools() }, [])} />;
      case "Players":
        // Placeholder for when we build the Players feature
        return <div>Players tab is under construction.</div>;
      case "Tournaments":
        // Placeholder for when we build the Tournaments feature
        return <div>Tournaments tab is under construction.</div>;
      default:
        return <SchoolsTab schools={schools} refetchSchools={() => useEffect(() => { fetchSchools() }, [])} />;
    }
  };


  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="w-full">
        <h1 className="text-3xl font-bold text-athletiq-navy mb-4">
          Super Admin Dashboard
        </h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-6">
            <button onClick={() => setView("Schools")} className={`py-2 px-1 font-medium ${view === "Schools" ? 'border-b-2 border-athletiq-green text-athletiq-green' : 'text-gray-500 hover:text-gray-700'}`}>
              Schools
            </button>
            <button onClick={() => setView("Players")} className={`py-2 px-1 font-medium ${view === "Players" ? 'border-b-2 border-athletiq-green text-athletiq-green' : 'text-gray-500 hover:text-gray-700'}`}>
              Players
            </button>
            <button onClick={() => setView("Tournaments")} className={`py-2 px-1 font-medium ${view === "Tournaments" ? 'border-b-2 border-athletiq-green text-athletiq-green' : 'text-gray-500 hover:text-gray-700'}`}>
              Tournaments
            </button>
          </nav>
        </div>

        {/* Render the active tab content */}
        <div>
          {renderActiveView()}
        </div>
      </div>
    </DashboardLayout>
  );
}