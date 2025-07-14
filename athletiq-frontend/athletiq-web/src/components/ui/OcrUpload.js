// src/components/OcrUpload.js
import React, { useState } from 'react';
import { uploadBirthCertificate } from '@api/ocrApi';

export default function OcrUpload({ onExtracted }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = e => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : '');
    setResult(null);
    setError('');
  };

  const handleExtract = async () => {
    if (!file) return setError('Choose an image first');
    setExtracting(true); setError('');
    try {
      // Get token from localStorage (adjust as needed)
      const token = localStorage.getItem('token');
      const data = await uploadBirthCertificate(file, token);
      setResult(data.extracted || data); // backend returns .extracted
      onExtracted && onExtracted(data.extracted || data);
    } catch (e) {
      setError('OCR failed: ' + (e?.response?.data?.message || e.message));
    }
    setExtracting(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Birth Certificate OCR</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <div>
          <img src={preview} alt="Preview" style={{ maxWidth: 200, marginTop: 10 }} />
        </div>
      )}
      <button onClick={handleExtract} disabled={extracting || !file} style={{ marginTop: 12 }}>
        {extracting ? 'Extracting...' : 'Extract Data'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <strong>Extracted Data:</strong>
          <pre style={{ background: '#fafafa', padding: 8 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
