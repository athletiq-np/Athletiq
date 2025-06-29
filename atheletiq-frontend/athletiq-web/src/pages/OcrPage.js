// src/pages/OcrPage.js
import React, { useState } from 'react';
import OcrUpload from '../components/OcrUpload';

export default function OcrPage() {
  const [extracted, setExtracted] = useState(null);

  return (
    <div style={{ padding: 32 }}>
      <h1>OCR Birth Certificate Upload</h1>
      <OcrUpload onExtracted={setExtracted} />
      {extracted && (
        <div style={{ marginTop: 24 }}>
          <h3>Ready to Use Data:</h3>
          <pre>{JSON.stringify(extracted, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
