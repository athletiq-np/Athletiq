// src/components/tournament-steps/TournamentInfoStep.jsx

import React from "react";

/**
 * STEP 1: Tournament Basic Info
 * - Name
 * - Logo URL
 * - Level (national/provincial/district)
 * - Start Date
 * - Duration (days)
 */
export default function TournamentInfoStep({ formData, onChange }) {
  return (
    <div className="grid gap-4">
      <div>
        <label className="block font-semibold">Tournament Name</label>
        <input
          type="text"
          className="border rounded w-full p-2"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block font-semibold">Logo URL</label>
        <input
          type="url"
          className="border rounded w-full p-2"
          value={formData.logo_url}
          onChange={(e) => onChange("logo_url", e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block font-semibold">Level</label>
        <select
          className="border rounded w-full p-2"
          value={formData.level}
          onChange={(e) => onChange("level", e.target.value)}
        >
          <option value="national">National</option>
          <option value="provincial">Provincial</option>
          <option value="district">District</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold">Start Date</label>
        <input
          type="date"
          className="border rounded w-full p-2"
          value={formData.start_date}
          onChange={(e) => onChange("start_date", e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">Duration (Days)</label>
        <input
          type="number"
          min="1"
          className="border rounded w-full p-2"
          value={formData.duration_days}
          onChange={(e) => onChange("duration_days", e.target.value)}
        />
      </div>
    </div>
  );
}
