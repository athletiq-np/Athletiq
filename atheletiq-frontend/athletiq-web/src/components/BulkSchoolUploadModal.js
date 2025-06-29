import React, { useState } from "react";
import Papa from "papaparse";
import axios from "axios";

export default function BulkSchoolUploadModal({ open, onClose, onUploaded }) {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const handleFile = (e) => {
    setResult(null);
    setErr("");
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setCsvData(res.data);
      },
      error: () => setErr("Failed to parse CSV."),
    });
  };

  const handleUpload = async () => {
    if (!csvData.length) return;
    setLoading(true);
    setErr("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/schools/bulk-import",
        { schools: csvData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data.results);
      if (onUploaded) onUploaded();
    } catch (e) {
      setErr(e?.response?.data?.message || "Bulk upload failed.");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
        <button className="absolute top-2 right-3 text-xl" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-4 text-athletiq-blue">Bulk Upload Schools</h2>
        <input type="file" accept=".csv" onChange={handleFile} className="mb-4" />
        {csvData.length > 0 && (
          <div className="mb-3">
            <strong>Preview ({csvData.length} rows):</strong>
            <div className="overflow-x-auto max-h-32 bg-gray-100 rounded p-2 text-xs">
              <pre>{JSON.stringify(csvData.slice(0, 5), null, 2)}{csvData.length > 5 ? `\n...` : ""}</pre>
            </div>
            <button
              className="mt-2 px-4 py-2 bg-athletiq-green text-white rounded hover:bg-green-700"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}
        {err && <div className="text-red-600 mt-2">{err}</div>}
        {result && (
          <div className="mt-4 max-h-40 overflow-y-auto text-xs">
            <strong>Results:</strong>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        <div className="mt-4 text-gray-600 text-xs">
          Download <a href="/sample_bulk_schools.csv" className="underline text-athletiq-blue" download>sample CSV</a> format.
        </div>
      </div>
    </div>
  );
}
