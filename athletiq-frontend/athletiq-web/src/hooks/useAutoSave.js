// src/hooks/useAutoSave.js

// 🧠 ATHLETIQ - Auto-save Hook
// Automatic data persistence for forms and user input

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebounce } from './useDebounce';

const useAutoSave = (data, saveFunction, options = {}) => {
  const {
    delay = 2000,
    enabled = true,
    storageKey = null,
    onSaveStart = null,
    onSaveSuccess = null,
    onSaveError = null
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  
  const debouncedData = useDebounce(data, delay);
  const initialDataRef = useRef(null);
  const hasChangesRef = useRef(false);

  // Store initial data to compare against
  useEffect(() => {
    if (initialDataRef.current === null) {
      initialDataRef.current = JSON.stringify(data);
    }
  }, []);

  // Check if data has changed
  useEffect(() => {
    if (initialDataRef.current !== null) {
      const currentData = JSON.stringify(data);
      hasChangesRef.current = currentData !== initialDataRef.current;
    }
  }, [data]);

  // Save to localStorage if storageKey is provided
  const saveToLocalStorage = useCallback((dataToSave) => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }, [storageKey]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : null;
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return null;
      }
    }
    return null;
  }, [storageKey]);

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }, [storageKey]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !hasChangesRef.current || !saveFunction) {
      return;
    }

    const performSave = async () => {
      setIsSaving(true);
      setSaveStatus('saving');
      
      if (onSaveStart) {
        onSaveStart();
      }

      try {
        // Save to localStorage first
        saveToLocalStorage(debouncedData);
        
        // Call the save function
        await saveFunction(debouncedData);
        
        setLastSaved(new Date());
        setSaveStatus('success');
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } catch (error) {
        setSaveStatus('error');
        
        if (onSaveError) {
          onSaveError(error);
        }
        
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    };

    performSave();
  }, [debouncedData, enabled, saveFunction, onSaveStart, onSaveSuccess, onSaveError, saveToLocalStorage]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!saveFunction) return;

    setIsSaving(true);
    setSaveStatus('saving');
    
    if (onSaveStart) {
      onSaveStart();
    }

    try {
      saveToLocalStorage(data);
      await saveFunction(data);
      
      setLastSaved(new Date());
      setSaveStatus('success');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      setSaveStatus('error');
      
      if (onSaveError) {
        onSaveError(error);
      }
      
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [data, saveFunction, onSaveStart, onSaveSuccess, onSaveError, saveToLocalStorage]);

  return {
    isSaving,
    lastSaved,
    saveStatus,
    manualSave,
    loadFromLocalStorage,
    clearLocalStorage,
    hasChanges: hasChangesRef.current
  };
};

export { useAutoSave };
