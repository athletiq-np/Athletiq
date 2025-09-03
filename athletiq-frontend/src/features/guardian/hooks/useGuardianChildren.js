import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { guardianAPI } from '@/utils/apiClient';

export const useGuardianChildren = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch children data
  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await guardianAPI.getChildren();
      setChildren(response || []);
    } catch (error) {
      console.error('Fetch children error:', error);
      setError(error.message);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new child
  const addChild = async (childData) => {
    try {
      const response = await guardianAPI.addChild(childData);
      const newChild = response;
      setChildren(prev => [...prev, newChild]);
      toast.success('Child added successfully!');
      return { success: true, data: newChild };
    } catch (error) {
      console.error('Add child error:', error);
      toast.error(error.message);
      return { success: false, message: error.message };
    }
  };

  // Update child information
  const updateChild = async (childId, updates) => {
    try {
      const response = await guardianAPI.updateChild(childId, updates);
      const updatedChild = response;
      setChildren(prev => 
        prev.map(child => child.id === childId ? updatedChild : child)
      );
      toast.success('Child information updated successfully!');
      return { success: true, data: updatedChild };
    } catch (error) {
      console.error('Update child error:', error);
      toast.error(error.message);
      return { success: false, message: error.message };
    }
  };

  // Get child by ID
  const getChildById = (childId) => {
    return children.find(child => child.id === childId) || null;
  };

  // Get children statistics
  const getChildrenStats = () => {
    return {
      total: children.length,
      active: children.filter(child => child.isActive !== false).length,
      byGender: {
        male: children.filter(child => child.gender?.toLowerCase() === 'male').length,
        female: children.filter(child => child.gender?.toLowerCase() === 'female').length,
        other: children.filter(child => !['male', 'female'].includes(child.gender?.toLowerCase())).length
      },
      byGrade: children.reduce((acc, child) => {
        const grade = child.grade || 'Unknown';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {}),
      schools: [...new Set(children.map(child => child.schoolName || child.school).filter(Boolean))]
    };
  };

  // Initialize data fetch
  useEffect(() => {
    fetchChildren();
  }, []);

  return {
    children,
    loading,
    error,
    fetchChildren,
    addChild,
    updateChild,
    getChildById,
    getChildrenStats,
    refresh: fetchChildren
  };
};
