import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTournament } from "../../api/tournamentApi";

const TournamentReviewStep = ({ tournamentData = {}, token }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const cleanedData = {
        ...tournamentData,
        sports_config: Array.isArray(tournamentData?.sports_config)
          ? tournamentData.sports_config
          : [],
      };

      console.log("📤 Submitting:", cleanedData);
      await createTournament(cleanedData, token);
      navigate("/admin/tournaments");
    } catch (err) {
      console.error("❌ Submit error:", err);
      setError("Failed to create tournament. Please check your form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Review & Submit</h2>

      <pre className="bg-gray-100 p-2 rounded text-sm mb-4 overflow-auto">
        {JSON.stringify(tournamentData, null, 2)}
      </pre>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Submitting..." : "Submit Tournament"}
      </button>
    </div>
  );
};

export default TournamentReviewStep;
