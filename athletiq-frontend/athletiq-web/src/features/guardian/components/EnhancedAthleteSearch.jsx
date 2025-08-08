import React, { useState } from 'react';
import { guardianAPI } from '@/utils/apiClient';

// Simple search component hitting new enhanced athlete search endpoint
export default function EnhancedAthleteSearch({ token }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
  const resp = await guardianAPI.searchEnhancedAthletes({ query });
  setResults(resp.data?.athletes || resp.athletes || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <form onSubmit={performSearch} className="flex gap-2 mb-3">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search athletes..." className="flex-1 border px-3 py-2 rounded" />
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">{loading ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <ul className="space-y-2 max-h-64 overflow-auto">
        {results.map(a => (
          <li key={a.athlete_id} className="border p-2 rounded text-sm flex justify-between">
            <span>{a.full_name}</span>
            <span className="text-gray-500">{a.school_name || '—'}</span>
          </li>
        ))}
        {!loading && results.length===0 && <li className="text-xs text-gray-400">No results</li>}
      </ul>
    </div>
  );
}
