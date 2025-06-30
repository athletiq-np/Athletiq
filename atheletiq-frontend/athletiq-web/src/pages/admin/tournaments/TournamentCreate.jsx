// src/pages/admin/tournaments/TournamentCreate.jsx

// 🧠 ATHLETIQ - Create Tournament Page
// This is the main parent component for the multi-step tournament creation wizard.
// It manages the current step, holds the complete form state, and handles the
// final submission to the backend API.

// --- MODULE IMPORTS ---
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

// Import the child components for each step of the wizard
import TournamentInfoStep from "../../../components/features/tournament/TournamentInfoStep";
import TournamentSportsStep from "../../../components/features/tournament/TournamentSportsStep";
import TournamentConfigStep from "../../../components/features/tournament/TournamentConfigStep";
import TournamentReviewStep from "../../../components/features/tournament/TournamentReviewStep";

// --- COMPONENT DEFINITION ---
const steps = ["Tournament Info", "Sports & Format", "Configure & Fixtures", "Review & Confirm"];

export default function TournamentCreate() {
  // --- STATE MANAGEMENT ---

  // State to track the current active step in the wizard (0-indexed)
  const [step, setStep] = useState(0);

  // State to hold all data collected from the form.
  // Fixed: Removed default values for level, start_date, end_date to make them optional
  const [form, setForm] = useState({
    name: "",
    description: "", // Can be empty/null if not used
    logo_url: "",
    level: "",       // Now optional, can be empty
    hosted_by: "",   // Now optional, can be empty
    start_date: "",  // Now optional, can be empty
    end_date: "",    // Now optional, can be empty
    sports_config: [],
  });

  // State to manage loading status during API submission
  const [isLoading, setIsLoading] = useState(false);
  // State to hold any errors returned from the API
  const [error, setError] = useState("");

  // --- HOOKS ---
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- FUNCTIONS ---
  function updateForm(update) {
    setForm(prev => ({ ...prev, ...update }));
  }

  async function handleSubmit() {
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Perform client-side validation for essential fields that should remain required
      // FIXED: Only Tournament Name is required now for initial submission
      if (!form.name) {
        setError("Tournament Name is required.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post("http://localhost:5000/api/tournaments", form, config);
      const newTournamentId = response.data.id;
      navigate(`/admin/tournaments/${newTournamentId}/setup`);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error("Failed to create tournament:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // --- RENDER ---
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Tournament</h1>

      {/* Stepper UI to show progress */}
      <div className="flex items-center gap-4 mb-8">
        {steps.map((label, idx) => (
          <div
            key={idx}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
              idx === step ? "bg-athletiq-blue text-white shadow-lg" : "bg-gray-200 text-gray-600"
            }`}
          >
            {idx + 1}. {label}
          </div>
        ))}
      </div>

      {/* Display API error message if it exists */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>}

      {/* Animated container for the current step's component */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Render components based on the current step */}
        {step === 0 && <TournamentInfoStep form={form} updateForm={updateForm} />}
        {step === 1 && <TournamentSportsStep form={form} updateForm={updateForm} />}
        {step === 2 && <TournamentConfigStep form={form} updateForm={updateForm} />}
        {step === 3 && <TournamentReviewStep form={form} onConfirm={handleSubmit} isLoading={isLoading} />}
      </motion.div>

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between items-center">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-6 py-2 rounded-md transition-colors"
            >
              Back
            </button>
          )}
        </div>
        <div>
          {step < steps.length - 1 && (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-athletiq-green hover:bg-green-700 text-white font-bold px-6 py-2 rounded-md transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
