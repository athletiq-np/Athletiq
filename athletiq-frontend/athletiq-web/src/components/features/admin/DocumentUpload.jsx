import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, File, X, CheckCircle, AlertCircle, Image, FileText, Zap, Clock, Star,
  CloudUpload, Folder, Camera, Smartphone, Shield, Sparkles, ArrowRight,
  BarChart3, Users, FileCheck, Layers, Plus, Trash2, Eye, Download,
  PlayCircle, PauseCircle, RotateCcw, Settings, Info, HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DocumentUpload = ({ onUploadComplete, acceptedFileTypes = ['image/*', 'application/pdf'] }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // upload, queue, completed, analytics
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [dragCounter, setDragCounter] = useState(0);
  const [stats, setStats] = useState({
    totalUploaded: 156,
    successRate: 98.7,
    avgProcessingTime: '2.3s',
    totalSize: '1.2GB'
  });

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError(`Invalid file type. Please upload ${acceptedFileTypes.join(', ')}`);
      return;
    }
    
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending', // pending, uploading, processing, completed, error
      preview: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, [acceptedFileTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);

    try {
      for (const fileItem of files) {
        if (fileItem.status === 'completed') continue;
        
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading' } : f
        ));

        const formData = new FormData();
        formData.append('document', fileItem.file);
        formData.append('documentType', 'player_id');

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
          ));
        }, 200);

        try {
          const response = await fetch('http://localhost:5000/api/documents/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include', // Include cookies for authentication
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          
          // Update to completed
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { 
              ...f, 
              progress: 100, 
              status: 'completed',
              processingId: result.processingId
            } : f
          ));

          if (onUploadComplete) {
            onUploadComplete(result);
          }

        } catch (error) {
          clearInterval(progressInterval);
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: 'error', progress: 0 } : f
          ));
          throw error;
        }
      }
    } catch (error) {
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFileTypeIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-600" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { 
        variant: 'outline', 
        className: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' 
      },
      uploading: { 
        variant: 'outline', 
        className: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' 
      },
      processing: { 
        variant: 'outline', 
        className: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100' 
      },
      completed: { 
        variant: 'outline', 
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
      },
      error: { 
        variant: 'outline', 
        className: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' 
      }
    };
    
    const config = variants[status] || { variant: 'secondary', className: '' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <Card className="w-full max-w-4xl mx-auto border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Document Upload
              </h2>
              <p className="text-gray-600 text-sm font-normal mt-1">
                Drag and drop your files or click to browse
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Enhanced Drop Zone */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group ${
              isDragActive
                ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-lg'
                : 'border-gray-300 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:scale-102 hover:shadow-md'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-6">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDragActive 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-indigo-100'
              }`}>
                <Upload className={`h-8 w-8 transition-colors duration-300 ${
                  isDragActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                }`} />
              </div>
              
              {isDragActive ? (
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-blue-600">Drop the files here!</p>
                  <p className="text-blue-500">We'll process them instantly</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-gray-700">
                    Drag & drop files here, or <span className="text-blue-600 underline">click to browse</span>
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <Image className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Images</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">PDFs</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Maximum file size: <span className="font-semibold">10MB</span> per file
                  </p>
                </div>
              )}
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
              <Star className="h-6 w-6 text-blue-500" />
            </div>
            <div className="absolute bottom-4 left-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
              <Zap className="h-6 w-6 text-indigo-500" />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Enhanced File List */}
          {files.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Files Ready for Upload</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {files.length} file{files.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {files.map((fileItem) => (
                  <Card key={fileItem.id} className="border-0 shadow-md bg-gradient-to-r from-white to-gray-50 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                          {getFileTypeIcon(fileItem.file)}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold text-gray-900 truncate">{fileItem.file.name}</p>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(fileItem.status)}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(fileItem.id)}
                                disabled={fileItem.status === 'uploading'}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="font-medium">
                              {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {fileItem.status === 'uploading' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-600 font-medium">Uploading...</span>
                                <span className="text-gray-500">{fileItem.progress}%</span>
                              </div>
                              <Progress value={fileItem.progress} className="h-2">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out" 
                                     style={{ width: `${fileItem.progress}%` }} />
                              </Progress>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                          {getStatusIcon(fileItem.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Upload Button */}
          {files.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={uploadFiles}
                disabled={uploading || files.every(f => f.status === 'completed')}
                className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading Files...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5" />
                    <span>Upload {files.length} File{files.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                className="h-14 px-8 border-gray-300 hover:bg-gray-50 transition-all duration-300"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
