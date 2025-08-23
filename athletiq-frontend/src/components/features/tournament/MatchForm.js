// src/components/MatchForm.js

import React, { useState } from "react";

const initialState = {
  home_team_id: "",
  away_team_id: "",
  scheduled_at: "",
  venue: "",
};

const MatchForm = ({ onSubmit, loading, teams }) => {
  const [form, setForm] = useState(initialState);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
    setForm(initialState);
  }

  return (
    <form className="p-4 bg-white rounded shadow mb-4" onSubmit={handleSubmit}>
      <h2 className="font-bold mb-2">Create Match</h2>
      <select
        className="w-full border p-2 mb-2"
        name="home_team_id"
        value={form.home_team_id}
        onChange={handleChange}
        required
      >
        <option value="">Select Home Team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      <select
        className="w-full border p-2 mb-2"
        name="away_team_id"
        value={form.away_team_id}
        onChange={handleChange}
        required
      >
        <option value="">Select Away Team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      <input
        className="w-full border p-2 mb-2"
        name="scheduled_at"
        type="datetime-local"
        value={form.scheduled_at}
        onChange={handleChange}
        required
      />
      <input
        className="w-full border p-2 mb-2"
        name="venue"
        placeholder="Venue"
        value={form.venue}
        onChange={handleChange}
        required
      />
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        type="submit"
        disabled={loading}
      >
        {loading ? "Saving..." : "Create Match"}
      </button>
    </form>
  );
};

export default MatchForm;
