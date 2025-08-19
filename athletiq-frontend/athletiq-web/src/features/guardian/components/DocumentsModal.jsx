import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUpload, FaTrash, FaFilePdf, FaImage } from 'react-icons/fa';
import apiClient from '@/api/apiClient';
import { toast } from 'react-toastify';

export default function DocumentsModal({ athlete, onClose }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('birth_certificate');

  const loadDocs = async () => {
    try {
      const res = await apiClient.get(`/guardian/athletes/${athlete.id}/documents`);
      if (res.data?.success) {
        setDocs(res.data.data?.documents || []);
      }
    } catch (e) {
      toast.error('Failed to load documents');
    }
  };

  useEffect(() => { loadDocs(); }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Max file size is 10MB');
      return;
    }
    setFile(f);
  };

  const upload = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    try {
      setUploading(true);
      const form = new FormData();
      form.append('document', file);
      form.append('document_type', docType);
      const res = await apiClient.post(`/guardian/athletes/${athlete.id}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.success) {
        toast.success('Uploaded');
        setFile(null);
        await loadDocs();
      } else {
        toast.error(res.data?.message || 'Upload failed');
      }
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await apiClient.delete(`/guardian/athletes/${athlete.id}/documents/${id}`);
      if (res.data?.success) {
        toast.success('Deleted');
        await loadDocs();
      } else {
        toast.error(res.data?.message || 'Delete failed');
      }
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const iconFor = (name) => {
    if (!name) return <FaFilePdf className="text-gray-500"/>;
    const lower = name.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') ?
      <FaImage className="text-blue-500"/> : <FaFilePdf className="text-red-500"/>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Documents for {athlete.full_name}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}><FaTimes/></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <select className="border rounded px-3 py-2" value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="birth_certificate">Birth Certificate</option>
              <option value="citizenship">Citizenship</option>
              <option value="school_id">School ID</option>
            </select>
            <input type="file" onChange={onFileChange} className="border rounded px-3 py-2"/>
            <button disabled={uploading} onClick={upload} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50">
              <FaUpload/>
              Upload
            </button>
          </div>

          <div className="divide-y border rounded">
            {docs.length === 0 && (
              <div className="p-4 text-gray-500">No documents uploaded yet.</div>
            )}
            {docs.map(d => (
              <div key={d.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {iconFor(d.file_name)}
                  <div>
                    <div className="font-medium">{d.document_type.replace('_',' ')}</div>
                    <div className="text-xs text-gray-500">{d.file_name} • {(d.file_size/1024).toFixed(1)} KB • {d.verification_status}</div>
                  </div>
                </div>
                <button onClick={() => remove(d.id)} className="text-red-600 hover:text-red-700 flex items-center gap-1">
                  <FaTrash/>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
