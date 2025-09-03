import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner, FaExclamationCircle, FaSchool, FaSearch, FaPlus, FaUpload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import AddSchoolModal from '@/components/features/school/AddSchoolModal';
import { toast } from 'react-toastify';
import schoolApi from '@/api/schoolApi';
import { TableLoading } from './LoadingStates';
import { InlineError, EmptyState } from './ErrorStates';
import { AdvancedSearch, DataViewControls, RealTimeStatus } from './InteractiveFeatures';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchoolsTab({ schools: initialSchools = [], refetchData: externalRefetch, loading: externalLoading = false, error: externalError = null }) {
  // State management
  const [schools, setSchools] = useState(initialSchools);
  const [loading, setLoading] = useState(externalLoading);
  const [error, setError] = useState(externalError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  // Fetch schools data
  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await schoolApi.getSchools(pagination.page, pagination.pageSize);
      
      // Handle different response formats
      let schoolsData = [];
      if (Array.isArray(response)) {
        schoolsData = response;
      } else if (response.results) {
        schoolsData = response.results;
      } else if (response.data?.results) {
        schoolsData = response.data.results;
      } else if (typeof response === 'object' && response !== null) {
        schoolsData = [response];
      }
      
      setSchools(schoolsData);
      
      // Update pagination if available
      if (response.count !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: response.count,
          totalPages: Math.ceil(response.count / prev.pageSize)
        }));
      }
      
      setError(null);
      return schoolsData;
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError('Failed to load schools. Please try again.');
      toast.error('Failed to load schools');
      return [];
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);
  
  // Initial data fetch
  useEffect(() => {
    if (!externalRefetch) {
      fetchSchools();
    } else if (Array.isArray(initialSchools)) {
      setSchools(initialSchools);
    }
  }, [fetchSchools, externalRefetch, initialSchools]);
  
  // State for search and filtering
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchText, setSearchText] = useState('');
  
  // Modal and action states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [actionType, setActionType] = useState(null); // 'view', 'edit', 'delete'
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle search
  const handleSearch = useCallback(async (query) => {
    setSearchText(query);
    
    if (!query.trim()) {
      // If search is empty, reset to all schools
      if (!externalRefetch) {
        await fetchSchools();
      } else {
        setFilteredSchools(schools);
      }
      return;
    }
    
    try {
      setLoading(true);
      const response = await schoolApi.searchSchools(query, pagination.page, pagination.pageSize);
      
      // Handle different response formats
      let searchResults = [];
      if (Array.isArray(response)) {
        searchResults = response;
      } else if (response.results) {
        searchResults = response.results;
      } else if (response.data?.results) {
        searchResults = response.data.results;
      }
      
      setFilteredSchools(searchResults);
      
      // Update pagination if available
      if (response.count !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: response.count,
          totalPages: Math.ceil(response.count / prev.pageSize)
        }));
      }
    } catch (err) {
      console.error('Error searching schools:', err);
      toast.error('Failed to search schools');
    } finally {
      setLoading(false);
    }
  }, [externalRefetch, fetchSchools, pagination.page, pagination.pageSize, schools]);
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchText);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchText, handleSearch]);

  // Handle view school details
  const handleViewSchool = async (school) => {
    if (!school?.id) {
      toast.error('Invalid school data');
      return;
    }
    
    try {
      setLoading(true);
      setSelectedSchool(null);
      setActionType('view');
      
      // Fetch the latest school data
      const response = await schoolApi.getSchoolById(school.id);
      const schoolDetails = response.data || response;
      
      if (!schoolDetails) {
        throw new Error('No school data received');
      }
      
      setSelectedSchool(schoolDetails);
      setIsAddModalOpen(true);
    } catch (err) {
      console.error('Error fetching school details:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Show error but still open modal with available data
      toast.error(
        err.response?.data?.message || 
        'Failed to load school details. Showing cached data.'
      );
      
      setSelectedSchool(school);
      setActionType('view');
      setIsAddModalOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit school
  const handleEditSchool = async (school) => {
    if (!school?.id) {
      toast.error('Invalid school data');
      return;
    }
    
    try {
      setLoading(true);
      setSelectedSchool(null);
      setActionType('edit');
      
      // Fetch the latest school data
      const response = await schoolApi.getSchoolById(school.id);
      const schoolDetails = response.data || response;
      
      if (!schoolDetails) {
        throw new Error('No school data received');
      }
      
      setSelectedSchool(schoolDetails);
      setIsAddModalOpen(true);
    } catch (err) {
      console.error('Error fetching school for edit:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Show error but still open modal with available data
      toast.error(
        err.response?.data?.message || 
        'Failed to load school for editing. Using cached data.'
      );
      
      setSelectedSchool(school);
      setActionType('edit');
      setIsAddModalOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete school confirmation
  const handleDeleteSchool = (school) => {
    if (!school?.id) {
      toast.error('Invalid school data');
      return;
    }
    
    setSelectedSchool(school);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete school
  const confirmDeleteSchool = async () => {
    if (!selectedSchool?.id) {
      toast.error('Invalid school data');
      return;
    }
    
    try {
      setIsDeleting(true);
      await schoolApi.deleteSchool(selectedSchool.id);
      
      // Update UI
      const updatedSchools = schools.filter(s => s.id !== selectedSchool.id);
      setSchools(updatedSchools);
      
      // Update filtered schools if needed
      if (filteredSchools.some(s => s.id === selectedSchool.id)) {
        setFilteredSchools(prev => prev.filter(s => s.id !== selectedSchool.id));
      }
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        totalPages: Math.max(1, Math.ceil((prev.total - 1) / prev.pageSize))
      }));
      
      toast.success('School deleted successfully');
    } catch (err) {
      console.error('Error deleting school:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.message || 'Failed to delete school';
      toast.error(errorMessage);
      
      // If 404, the school might have been deleted already
      if (err.response?.status === 404) {
        setSchools(prev => prev.filter(s => s.id !== selectedSchool.id));
        setFilteredSchools(prev => prev.filter(s => s.id !== selectedSchool.id));
      }
      
      return; // Don't close modal on error
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSelectedSchool(null);
    }
  };

  // Handle form submission (add/edit)
  const handleSchoolSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      let response;
      
      // Create a clean copy of form data without undefined values
      const cleanFormData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      if (cleanFormData.id) {
        // Update existing school
        response = await schoolApi.updateSchool(formData.id, formData);
        toast.success('School updated successfully');
      } else {
        // Create new school
        response = await schoolApi.createSchool(formData);
        toast.success('School created successfully');
      }
      
      // Refresh data
      if (externalRefetch) {
        await externalRefetch();
      } else {
        await fetchSchools();
      }
      
      // Close modal
      setIsAddModalOpen(false);
      setSelectedSchool(null);
      setActionType(null);
      
      // Show success message
      toast.success(`School ${cleanFormData.id ? 'updated' : 'created'} successfully`);
    } catch (err) {
      console.error('Error saving school:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to save school. Please try again.';
      
      if (err.response?.data) {
        // Handle validation errors
        if (err.response.data.errors) {
          const errorMessages = Object.entries(err.response.data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          errorMessage = `Validation error: ${errorMessages}`;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      throw err; // Re-throw to allow form to handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add new school
  const handleAddSchool = () => {
    setSelectedSchool(null);
    setActionType('add');
    setIsAddModalOpen(true);
  };
  
  // Handle modal close with cleanup
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedSchool(null);
    setActionType(null);
    setError(null);
  };

  // Show loading state
  if (loading) {
    return <TableLoading rows={8} columns={6} />;
  }

  // Show error state
  if (error) {
    return (
      <InlineError 
        error={{ message: error }}
        onRetry={externalRefetch || fetchSchools}
        className="mb-6"
      />
    );
  }

  // Show empty state
  if (schools.length === 0) {
    return (
      <EmptyState
        icon={FaSchool}
        title="No schools found"
        message="Get started by adding a new school to the system."
        action={handleAddSchool}
        actionLabel="Add New School"
      />
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        <div className="w-full sm:flex-1 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search schools by name or code..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-4 py-2 pl-10 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleAddSchool} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-athletiq-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto justify-center whitespace-nowrap"
          >
            <FaPlus className="-ml-1 mr-2 h-4 w-4" />
            Add School
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)} 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-athletiq-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800 w-full sm:w-auto justify-center whitespace-nowrap"
          >
            <FaUpload className="-ml-1 mr-2 h-4 w-4" />
            Bulk Upload
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">School Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <tr key={school?.id || Math.random().toString(36).substr(2, 9)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {school?.name || 'Unnamed School'}
                      </div>
                      {school?.school_code && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{school.school_code}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {(() => {
                        const addressParts = [
                          school?.city,
                          school?.province
                        ].filter(Boolean);
                        
                        return addressParts.length > 0 
                          ? addressParts.join(', ')
                          : 'No address provided';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          school?.is_active === false 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {school?.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSchool(school);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                          title="View details"
                          disabled={loading}
                        >
                          {loading && actionType === 'view' && selectedSchool?.id === school.id ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSchool(school);
                          }}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 p-1.5 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors duration-200"
                          title="Edit"
                          disabled={loading}
                        >
                          {loading && actionType === 'edit' && selectedSchool?.id === school.id ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchool(school);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                          title="Delete"
                          disabled={isDeleting}
                        >
                          {isDeleting && selectedSchool?.id === school.id ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FaSchool className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <p>No schools found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modals */}
      {/* School Modal - Handles View, Edit, and Add modes */}
      {(isAddModalOpen || actionType) && (
        <AddSchoolModal
          open={isAddModalOpen || !!actionType}
          school={selectedSchool}
          viewMode={actionType === 'view'}
          onClose={handleCloseModal}
          onAdded={() => {
            // Refresh data after successful add/edit
            if (externalRefetch) {
              externalRefetch();
            } else {
              fetchSchools();
            }
          }}
          loading={isSubmitting}
          onEdit={() => {
            // Switch to edit mode
            setActionType('edit');
          }}
        />
      )}


      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{selectedSchool.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedSchool(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSchool}
                className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center justify-center min-w-[80px] ${
                  isDeleting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}