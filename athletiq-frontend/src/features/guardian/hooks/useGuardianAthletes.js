import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { guardianAPI } from '@/utils/apiClient';

export const useGuardianAthletes = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch athletes data using new endpoint
  const fetchAthletes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use new getAthletes method (with deprecation warning fallback)
      const response = await guardianAPI.getAthletes();
      setAthletes(response || []);
    } catch (error) {
      console.error('Fetch athletes error:', error);
      setError(error.message);
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new athlete using new endpoint
  const addAthlete = async (athleteData) => {
    try {
      // Use new addAthlete method (with deprecation warning fallback)
      const response = await guardianAPI.addAthlete(athleteData);
      const newAthlete = response;
      setAthletes(prev => [...prev, newAthlete]);
      toast.success('Athlete added successfully!');
      return { success: true, data: newAthlete };
    } catch (error) {
      console.error('Add athlete error:', error);
      toast.error(error.message);
      return { success: false, message: error.message };
    }
  };

  // Update athlete information
  const updateAthlete = async (athleteId, updates) => {
    try {
      const response = await guardianAPI.updateChild(athleteId, updates); // Keep existing update method for now
      const updatedAthlete = response;
      setAthletes(prev => 
        prev.map(athlete => athlete.id === athleteId ? updatedAthlete : athlete)
      );
      toast.success('Athlete information updated successfully!');
      return { success: true, data: updatedAthlete };
    } catch (error) {
      console.error('Update athlete error:', error);
      toast.error(error.message);
      return { success: false, message: error.message };
    }
  };

  // Get athlete by ID
  const getAthleteById = (athleteId) => {
    return athletes.find(athlete => athlete.id === athleteId) || null;
  };

  // Get athlete status using new endpoint
  const getAthleteStatus = async (athleteId) => {
    try {
      const response = await guardianAPI.getAthleteStatus(athleteId);
      return { success: true, data: response };
    } catch (error) {
      console.error('Get athlete status error:', error);
      return { success: false, message: error.message };
    }
  };

  // Get athletes statistics (updated terminology)
  const getAthletesStats = () => {
    return {
      total: athletes.length,
      active: athletes.filter(athlete => athlete.isActive !== false).length,
      byGender: {
        male: athletes.filter(athlete => athlete.gender?.toLowerCase() === 'male').length,
        female: athletes.filter(athlete => athlete.gender?.toLowerCase() === 'female').length,
        other: athletes.filter(athlete => !['male', 'female'].includes(athlete.gender?.toLowerCase())).length
      },
      byGrade: athletes.reduce((acc, athlete) => {
        const grade = athlete.grade || 'Unknown';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {}),
      schools: [...new Set(athletes.map(athlete => athlete.schoolName || athlete.school).filter(Boolean))]
    };
  };

  // Initialize data fetch
  useEffect(() => {
    fetchAthletes();
  }, []);

  return {
    athletes,
    loading,
    error,
    fetchAthletes,
    addAthlete,
    updateAthlete,
    getAthleteById,
    getAthleteStatus,
    getAthletesStats,
    refresh: fetchAthletes,
    
    // Backward compatibility aliases with deprecation warnings
    children: athletes,
    getChildren: () => {
      console.warn('⚠️ getChildren is deprecated. Use fetchAthletes instead.');
      return fetchAthletes();
    },
    addChild: (childData) => {
      console.warn('⚠️ addChild is deprecated. Use addAthlete instead.');
      return addAthlete(childData);
    },
    getChildrenStats: () => {
      console.warn('⚠️ getChildrenStats is deprecated. Use getAthletesStats instead.');
      return getAthletesStats();
    }
  };
};
