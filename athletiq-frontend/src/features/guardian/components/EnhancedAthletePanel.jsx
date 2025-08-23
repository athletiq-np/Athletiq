import React, { useState } from 'react';
import EnhancedAthleteSearch from './EnhancedAthleteSearch';
import { guardianAPI } from '@/utils/apiClient'; // ensure named export exists

export default function EnhancedAthletePanel(){
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkPayload, setBulkPayload] = useState('[{"full_name":"Test Athlete","date_of_birth":"2012-04-01","gender":"Male","class":"7"}]');
  const [schoolId, setSchoolId] = useState('');
  const [autoCodes, setAutoCodes] = useState(true);
  const [loading, setLoading] = useState(false);

  const submitBulk = async () => {
    setLoading(true); setBulkResult(null);
    try {
      const parsed = JSON.parse(bulkPayload);
      const resp = await guardianAPI.bulkEnhancedUpload({ athletes: parsed, school_id: Number(schoolId), auto_generate_codes: autoCodes });
      setBulkResult(resp);
    } catch(e){
      setBulkResult({ success:false, message:e.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Enhanced Athlete Search</h3>
        <EnhancedAthleteSearch />
      </div>
      <div className="border rounded p-4 bg-white">
        <h4 className="font-semibold mb-2 text-sm">Bulk Upload (Enhanced)</h4>
        <div className="grid gap-2 mb-2 md:grid-cols-3">
          <input className="border px-2 py-1 rounded" value={schoolId} onChange={e=>setSchoolId(e.target.value)} placeholder="School ID" />
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={autoCodes} onChange={e=>setAutoCodes(e.target.checked)} /> Auto claim codes</label>
        </div>
        <textarea className="w-full border rounded p-2 text-xs h-32" value={bulkPayload} onChange={e=>setBulkPayload(e.target.value)} />
        <button disabled={loading} onClick={submitBulk} className="mt-2 bg-indigo-600 text-white text-sm px-3 py-1 rounded">{loading? 'Uploading...' : 'Upload'}</button>
        {bulkResult && <pre className="mt-3 bg-gray-50 p-2 text-[10px] max-h-48 overflow-auto">{JSON.stringify(bulkResult,null,2)}</pre>}
      </div>
    </div>
  );
}
