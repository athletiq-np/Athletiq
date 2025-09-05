import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes, FaCheck, FaExclamationTriangle, FaDownload, FaEye, FaUser,
  FaFileImage, FaFilePdf, FaFileWord, FaFile, FaCalendarAlt, FaIdCard,
  FaClipboardCheck, FaCommentAlt, FaSave, FaUndo
} from 'react-icons/fa';
import { adminApi } from '@/api/adminApi';
import { toast } from 'react-toastify';

const DocumentReviewModal = ({ isOpen, onClose, athlete, onDocumentUpdated }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});
  const [documentStatuses, setDocumentStatuses] = useState({});

  useEffect(() => {
    if (isOpen && athlete) {
      fetchAthleteDocuments();
    }
  }, [isOpen, athlete]);

  const fetchAthleteDocuments = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAthleteDocuments(athlete.id);
      const athleteDocuments = response.data || [];
      
      setDocuments(athleteDocuments);
      
      // Initialize status and notes
      const initialStatuses = {};
      const initialNotes = {};
      athleteDocuments.forEach(doc => {
        initialStatuses[doc.id] = doc.verification_status;
        initialNotes[doc.id] = doc.review_notes || '';
      });
      setDocumentStatuses(initialStatuses);
      setReviewNotes(initialNotes);

    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load athlete documents');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type, name) => {
    if (type === 'image' || name?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return <FaFileImage className="text-blue-500" />;
    } else if (name?.match(/\.pdf$/i)) {
      return <FaFilePdf className="text-red-500" />;
    } else if (name?.match(/\.(doc|docx)$/i)) {
      return <FaFileWord className="text-blue-600" />;
    }
    return <FaFile className="text-gray-500" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <FaClipboardCheck className="mr-1" />,
        text: 'Pending Review'
      },
      verified: {
        bg: 'bg-green-100 text-green-800 border-green-200',
        icon: <FaCheck className="mr-1" />,
        text: 'Verified'
      },
      rejected: {
        bg: 'bg-red-100 text-red-800 border-red-200',
        icon: <FaExclamationTriangle className="mr-1" />,
        text: 'Rejected'
      },
      requires_review: {
        bg: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <FaCommentAlt className="mr-1" />,
        text: 'Needs Review'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const handleStatusChange = (documentId, newStatus) => {
    setDocumentStatuses(prev => ({
      ...prev,
      [documentId]: newStatus
    }));
  };

  const handleNotesChange = (documentId, notes) => {
    setReviewNotes(prev => ({
      ...prev,
      [documentId]: notes
    }));
  };

  const handleSaveReview = async () => {
    setUpdating(true);
    try {
      const reviewData = {
        athlete_id: athlete.id,
        document_reviews: documents.map(doc => ({
          document_id: doc.id,
          verification_status: documentStatuses[doc.id],
          review_notes: reviewNotes[doc.id],
          reviewed_by: 'current_user', // This would be the current user ID
          reviewed_at: new Date().toISOString()
        }))
      };

      const response = await adminApi.updateDocumentVerification(athlete.id, reviewData);
      
      toast.success('Document verification updated successfully!');
      
      if (onDocumentUpdated) {
        onDocumentUpdated(athlete.id, response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating document verification:', error);
      toast.error(`Failed to update document verification: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handlePreviewDocument = (document) => {
    if (document.url) {
      window.open(document.url, '_blank');
    } else {
      toast.info('Document preview not available');
    }
  };

  const handleDownloadDocument = (document) => {
    if (document.url) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.info('Document download not available');
    }
  };

  const resetChanges = () => {
    // Reset to original statuses
    const originalStatuses = {};
    const originalNotes = {};
    documents.forEach(doc => {
      originalStatuses[doc.id] = doc.verification_status;
      originalNotes[doc.id] = doc.review_notes || '';
    });
    setDocumentStatuses(originalStatuses);
    setReviewNotes(originalNotes);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FaClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Document Review</h2>
                  <p className="text-purple-100">
                    Review and verify documents for {athlete?.full_name || athlete?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Athlete Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {athlete?.profile_photo_url ? (
                    <img
                      src={`/uploads/${athlete.profile_photo_url}`}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <FaUser className="text-white text-lg" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {athlete?.full_name || athlete?.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center">
                      <FaIdCard className="mr-1" />
                      ID: {athlete?.athlete_id || athlete?.id}
                    </span>
                    <span className="flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      Registered: {athlete?.created_at ? new Date(athlete.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FaFile className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Documents Found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This athlete hasn't uploaded any documents yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Documents for Review ({documents.length})
                </h3>

                {documents.map((document) => (
                  <div key={document.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                          {getFileIcon(document.type, document.name)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {document.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Uploaded: {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : 'N/A'}
                          </p>
                          {document.certificate_no && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Certificate No: {document.certificate_no}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {document.url && (
                          <>
                            <button
                              onClick={() => handlePreviewDocument(document)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Preview Document"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(document)}
                              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors"
                              title="Download Document"
                            >
                              <FaDownload />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    {document.additional_info && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Additional Information</h5>
                        {document.additional_info.certificate_date && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Issue Date: {new Date(document.additional_info.certificate_date).toLocaleDateString()}
                          </p>
                        )}
                        {document.additional_info.issuing_office && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Issuing Office: {document.additional_info.issuing_office}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Current Status */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Status
                      </label>
                      {getStatusBadge(documentStatuses[document.id])}
                    </div>

                    {/* Status Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Update Verification Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'verified', 'rejected', 'requires_review'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(document.id, status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              documentStatuses[document.id] === status
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                            }`}
                          >
                            {status === 'pending' && 'Pending Review'}
                            {status === 'verified' && 'Verified'}
                            {status === 'rejected' && 'Rejected'}
                            {status === 'requires_review' && 'Needs Review'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Review Notes
                      </label>
                      <textarea
                        value={reviewNotes[document.id] || ''}
                        onChange={(e) => handleNotesChange(document.id, e.target.value)}
                        placeholder="Add notes about this document review..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                        rows="3"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {documents.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <button
                  onClick={resetChanges}
                  className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  <FaUndo className="mr-2" />
                  Reset Changes
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReview}
                    disabled={updating}
                    className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Save Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentReviewModal;