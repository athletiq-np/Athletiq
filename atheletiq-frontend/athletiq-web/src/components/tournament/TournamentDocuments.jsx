// src/components/tournament/TournamentDocuments.jsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFileAlt, FaPlus, FaDownload, FaTrash, FaEye, FaUpload, 
  FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile,
  FaCalendarAlt, FaUser, FaFolder, FaSearch, FaFilter,
  FaShare, FaEdit, FaCopy, FaLock, FaUnlock, FaTag
} from 'react-icons/fa';

const TournamentDocuments = ({ tournament, onUpdate, currentUser }) => {
  const [documents, setDocuments] = useState(tournament?.documents || []);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const fileInputRef = useRef(null);

  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    category: 'general',
    tags: [],
    isPrivate: false,
    file: null
  });

  const categories = [
    { id: 'all', label: 'All Documents', icon: FaFileAlt },
    { id: 'rules', label: 'Rules & Regulations', icon: FaFileAlt },
    { id: 'schedules', label: 'Schedules', icon: FaCalendarAlt },
    { id: 'results', label: 'Results', icon: FaFileExcel },
    { id: 'forms', label: 'Forms', icon: FaFileWord },
    { id: 'media', label: 'Media', icon: FaFileImage },
    { id: 'certificates', label: 'Certificates', icon: FaFilePdf },
    { id: 'general', label: 'General', icon: FaFile }
  ];

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return FaFilePdf;
      case 'doc':
      case 'docx': return FaFileWord;
      case 'xls':
      case 'xlsx': return FaFileExcel;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return FaFileImage;
      default: return FaFile;
    }
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewDocument(prev => ({ ...prev, file }));
      if (!newDocument.title) {
        setNewDocument(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleAddDocument = () => {
    if (newDocument.file && newDocument.title) {
      const document = {
        id: Date.now().toString(),
        title: newDocument.title,
        description: newDocument.description,
        category: newDocument.category,
        tags: newDocument.tags,
        isPrivate: newDocument.isPrivate,
        filename: newDocument.file.name,
        fileSize: newDocument.file.size,
        fileType: newDocument.file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.id,
        downloads: 0,
        url: URL.createObjectURL(newDocument.file) // In real app, this would be a server URL
      };
      
      const updatedDocuments = [...documents, document];
      setDocuments(updatedDocuments);
      
      if (onUpdate) {
        onUpdate({ documents: updatedDocuments });
      }
      
      setNewDocument({
        title: '',
        description: '',
        category: 'general',
        tags: [],
        isPrivate: false,
        file: null
      });
      setShowUpload(false);
    }
  };

  const handleDeleteDocument = (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const updatedDocuments = documents.filter(d => d.id !== documentId);
      setDocuments(updatedDocuments);
      
      if (onUpdate) {
        onUpdate({ documents: updatedDocuments });
      }
    }
  };

  const handleDownload = (document) => {
    // In a real app, this would trigger a download from the server
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.filename;
    link.click();
    
    // Update download count
    const updatedDocuments = documents.map(d => 
      d.id === document.id ? { ...d, downloads: d.downloads + 1 } : d
    );
    setDocuments(updatedDocuments);
    
    if (onUpdate) {
      onUpdate({ documents: updatedDocuments });
    }
  };

  const filteredDocuments = documents
    .filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'size':
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case 'downloads':
          aValue = a.downloads;
          bValue = b.downloads;
          break;
        default: // date
          aValue = new Date(a.uploadedAt);
          bValue = new Date(b.uploadedAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleTagAdd = (tag) => {
    if (tag && !newDocument.tags.includes(tag)) {
      setNewDocument(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setNewDocument(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FaFileAlt className="text-2xl text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tournament Documents</h2>
            <p className="text-gray-600">Manage tournament files and documents</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FaPlus />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              setSortBy(sort);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">Largest First</option>
            <option value="size-asc">Smallest First</option>
            <option value="downloads-desc">Most Downloaded</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => {
          const FileIcon = getFileIcon(document.filename);
          return (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileIcon className="text-2xl text-blue-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {document.title}
                      </h3>
                      <p className="text-sm text-gray-500">{document.filename}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {document.isPrivate && (
                      <FaLock className="text-red-500 text-sm" />
                    )}
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {document.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {document.description}
                  </p>
                )}

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {document.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{getFileSize(document.fileSize)}</span>
                  <span>{document.downloads} downloads</span>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {categories.find(c => c.id === document.category)?.label}
                  </span>
                </div>

                {/* Upload Info */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FaUser />
                      <span>Uploaded by {document.uploadedBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaCalendarAlt />
                      <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleDownload(document)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <FaDownload />
                    <span>Download</span>
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(document.url, '_blank')}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Preview"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Share"
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'No documents found' : 'No Documents Uploaded'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Upload your first document to get started'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Document
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Upload Document
              </h3>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                    <FaUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      {newDocument.file ? newDocument.file.name : 'Click to upload a file'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF
                    </p>
                  </div>
                </div>

                {/* Document Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter document title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter document description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newDocument.category}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.filter(c => c.id !== 'all').map(category => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Privacy
                    </label>
                    <div className="flex items-center space-x-4 pt-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={!newDocument.isPrivate}
                          onChange={() => setNewDocument(prev => ({ ...prev, isPrivate: false }))}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Public</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={newDocument.isPrivate}
                          onChange={() => setNewDocument(prev => ({ ...prev, isPrivate: true }))}
                          className="text-blue-600"
                        />
                        <span className="text-sm">Private</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newDocument.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleTagRemove(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tag and press Enter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setNewDocument({
                      title: '',
                      description: '',
                      category: 'general',
                      tags: [],
                      isPrivate: false,
                      file: null
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDocument}
                  disabled={!newDocument.file || !newDocument.title}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Document
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TournamentDocuments;
