import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/apiClient';

export default function AthleteMatchesWidget({ athleteId }) {
  const [loading, setLoading] = useState(false);
  const [grouped, setGrouped] = useState({});
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [meta, setMeta] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchPage = useCallback(async (reset=false) => {
    if(!athleteId) return;
    setLoading(true); setError(null);
    try {
      const params = { page: reset?1:page, limit };
      if(statusFilter) params.status = statusFilter;
      if(dateFrom) params.from = dateFrom;
      if(dateTo) params.to = dateTo;
      const resp = await apiClient.get(`/api/matches/by-athlete/${athleteId}`, { params });
      const payload = resp.data?.data || {};
      const matches = payload.matches || [];
      const newGrouped = reset ? {} : { ...grouped };
      for(const m of matches){
        const key = m.category_id || m.sport_id || 'general';
        if(!newGrouped[key]) newGrouped[key] = [];
        newGrouped[key].push(m);
      }
      setGrouped(newGrouped);
      setMeta(payload.meta || null);
      if(reset) setPage(1);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  }, [athleteId, page, limit, statusFilter, dateFrom, dateTo, grouped]);

  useEffect(()=>{ fetchPage(true); }, [athleteId, statusFilter, dateFrom, dateTo]);

  const loadMore = () => {
    if(meta && page < meta.totalPages) {
      setPage(p => p+1);
    }
  };

  useEffect(()=>{
    if(page>1) fetchPage(false);
  }, [page]);

  if(!athleteId) return <div className="text-xs text-gray-500">Select athlete to view matches</div>;
  if(loading) return <div className="text-sm">Loading matches...</div>;
  if(error) return <div className="text-sm text-red-600">{error}</div>;

  const catIds = Object.keys(grouped);
  return (
    <div className="border rounded p-3 bg-white">
      <h4 className="font-semibold text-sm mb-2 flex justify-between items-center">Matches
        {meta && <span className="text-[10px] text-gray-400">Showing {(meta.page-1)*meta.limit + 1}-{Math.min(meta.page*meta.limit, meta.total)} of {meta.total}</span>}
      </h4>
      <div className="flex flex-wrap gap-2 mb-3 items-end">
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500">Status</label>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); setPage(1);}} className="border rounded text-xs px-1 py-1">
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500">From</label>
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value); setPage(1);}} className="border rounded text-xs px-1 py-1" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500">To</label>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value); setPage(1);}} className="border rounded text-xs px-1 py-1" />
        </div>
        <button onClick={()=>fetchPage(true)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Refresh</button>
      </div>
      {catIds.length===0 && <div className="text-xs text-gray-400">No matches</div>}
      {catIds.map(cat => (
        <div key={cat} className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Category {cat}</div>
          <ul className="space-y-1">
            {(grouped[cat]||[]).map(m => (
              <li key={m.id} className="text-xs flex justify-between border px-2 py-1 rounded">
                <span>{m.home_team_id} vs {m.away_team_id}</span>
                <span className="text-gray-400">R{m.round}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {meta && page < meta.totalPages && (
        <button disabled={loading} onClick={loadMore} className="mt-2 w-full text-xs bg-blue-600 text-white py-1 rounded disabled:opacity-50">
          {loading? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
