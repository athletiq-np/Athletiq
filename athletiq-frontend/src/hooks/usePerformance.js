import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

// Debounced search hook
export const useDebounceSearch = (initialValue = '', delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetValue = useCallback(
    debounce((newValue) => {
      setDebouncedValue(newValue);
    }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSetValue(value);
    return () => {
      debouncedSetValue.cancel();
    };
  }, [value, debouncedSetValue]);

  return [debouncedValue, setValue, value];
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, scrollTop, containerHeight, itemHeight]);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e) => setScrollTop(e.target.scrollTop)
  };
};

// Memoized sports list component
export const VirtualizedSportsList = React.memo(({ 
  sports, 
  selectedSports, 
  onSportToggle, 
  searchTerm,
  containerHeight = 400 
}) => {
  const itemHeight = 60;
  
  const filteredSports = useMemo(() => {
    if (!searchTerm) return sports;
    return sports.filter(sport =>
      sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sport.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sports, searchTerm]);

  const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualScroll(
    filteredSports,
    containerHeight,
    itemHeight
  );

  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={onScroll}
      className="border rounded-lg"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((sport) => (
            <div
              key={sport.id}
              style={{ height: itemHeight }}
              className="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onSportToggle(sport.id)}
            >
              <input
                type="checkbox"
                checked={selectedSports.includes(sport.id)}
                onChange={() => onSportToggle(sport.id)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">{sport.name}</div>
                <div className="text-sm text-gray-600">{sport.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Lazy loading image component
export const LazyImage = ({ src, alt, className, placeholder }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || <div className="w-8 h-8 bg-gray-300 rounded"></div>}
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
    </div>
  );
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [ref, setRef] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return [setRef, isIntersecting];
};

// Memoized card component
export const TournamentCard = React.memo(({ tournament, onSelect }) => {
  const [cardRef, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(tournament)}
    >
      {isVisible ? (
        <>
          <LazyImage
            src={tournament.image}
            alt={tournament.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{tournament.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{tournament.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{tournament.startDate}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tournament.format}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
      )}
    </div>
  );
});

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) { // Log slow renders
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
};

// Memoized tournament list with search and filter
export const OptimizedTournamentList = React.memo(({ 
  tournaments, 
  onTournamentSelect,
  searchTerm = '',
  filterCategory = 'all'
}) => {
  usePerformanceMonitor('OptimizedTournamentList');

  const filteredTournaments = useMemo(() => {
    let filtered = tournaments;
    
    if (searchTerm) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(tournament => 
        tournament.category === filterCategory
      );
    }
    
    return filtered;
  }, [tournaments, searchTerm, filterCategory]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTournaments.map(tournament => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onSelect={onTournamentSelect}
        />
      ))}
    </div>
  );
});

// Local storage hook with performance optimization
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// Debounced auto-save hook
export const useAutoSave = (data, saveFunction, delay = 2000) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useCallback(
    debounce(async (dataToSave) => {
      setIsSaving(true);
      try {
        await saveFunction(dataToSave);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay),
    [saveFunction, delay]
  );

  useEffect(() => {
    if (data) {
      debouncedSave(data);
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [data, debouncedSave]);

  return { lastSaved, isSaving };
};
