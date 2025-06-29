// src/pages/admin/tournaments/TournamentCreate.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

// Step Components
import TournamentInfoStep from "@/components/tournament-steps/TournamentInfoStep";
import TournamentSportsStep from "@/components/tournament-steps/TournamentSportsStep";
import TournamentReviewStep from "@/components/tournament-steps/TournamentReviewStep";

const steps = ["Tournament Info", "Sports & Format", "Review"];

export default function TournamentCreate() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    start_date: "",
    duration_days: "",
    level: "district",
    sports: []
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  function updateForm(update) {
    setForm(prev => ({ ...prev, ...update }));
  }

  async function handleSubmit() {
    try {
      const res = await axios.post("http://localhost:5000/api/tournaments", form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tournamentId = res.data.id;
      navigate(`/admin/tournaments/${tournamentId}/setup`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create tournament.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Tournament</h1>

      {/* Stepper */}
      <div className="flex items-center gap-4 mb-6">
        {steps.map((label, idx) => (
          <div
            key={idx}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              idx === step ? "bg-athletiq-blue text-white" : "bg-gray-200"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
      >
        {step === 0 && <TournamentInfoStep form={form} updateForm={updateForm} />}
        {step === 1 && <TournamentSportsStep form={form} updateForm={updateForm} />}
        {step === 2 && <TournamentReviewStep form={form} onConfirm={handleSubmit} />}
      </motion.div>

      <div className="mt-6 flex justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            Back
          </button>
        ) : <div />}

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="bg-athletiq-green text-white px-4 py-2 rounded"
          >
            Next
          </button>
        ) : null}
      </div>
    </div>
  );
}
