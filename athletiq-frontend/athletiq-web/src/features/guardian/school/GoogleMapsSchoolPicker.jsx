import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaSchool, 
  FaCheck,
  FaSpinner,
  FaGlobe
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';

const GoogleMapsSchoolPicker = ({ 
  onSchoolSelected, 
  preSelectedSchool = null,
  district = null 
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [verifiedSchools, setVerifiedSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(preSelectedSchool);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      initializeMap();
    } else {
      // Load Google Maps API if not already loaded
      loadGoogleMapsAPI();
    }
  }, []);

  // Load verified schools when component mounts
  useEffect(() => {
    loadVerifiedSchools();
  }, [district]);

  const loadGoogleMapsAPI = () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.onload = initializeMap;
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    // Default to Nepal center
    const defaultCenter = { lat: 28.3949, lng: 84.1240 };
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 7,
      styles: [
        {
          featureType: "poi.school",
          elementType: "geometry",
          stylers: [{ color: "#3b82f6" }]
        }
      ]
    });

    const places = new window.google.maps.places.PlacesService(map);
    
    setMapInstance(map);
    setPlacesService(places);

    // If we have a pre-selected school, center the map on it
    if (preSelectedSchool?.location) {
      map.setCenter(preSelectedSchool.location);
      map.setZoom(15);
      addSchoolMarker(map, preSelectedSchool);
    }
  };

  const loadVerifiedSchools = async () => {
    try {
      const params = new URLSearchParams();
      if (district) params.append('district', district);
      
      const response = await fetch(`/api/schools/verified?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVerifiedSchools(data.schools || []);
      }
    } catch (error) {
      console.error('Error loading verified schools:', error);
    }
  };

  const searchSchools = async (query) => {
    if (!placesService || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    const request = {
      query: `${query} school Nepal`,
      type: ['school'],
      fields: [
        'place_id', 
        'name', 
        'formatted_address', 
        'geometry', 
        'rating',
        'user_ratings_total',
        'photos'
      ]
    };

    placesService.textSearch(request, (results, status) => {
      setIsLoading(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        // Filter results for Nepal and enhance with verified status
        const nepaliSchools = results
          .filter(school => 
            school.formatted_address?.toLowerCase().includes('nepal') ||
            school.name?.toLowerCase().includes('nepal')
          )
          .map(school => {
            // Check if this is a verified school
            const verifiedMatch = verifiedSchools.find(verified => 
              verified.google_place_id === school.place_id ||
              verified.name.toLowerCase().includes(school.name.toLowerCase()) ||
              school.name.toLowerCase().includes(verified.name.toLowerCase())
            );

            return {
              ...school,
              is_verified: !!verifiedMatch,
              verified_id: verifiedMatch?.id,
              district: verifiedMatch?.district || extractDistrict(school.formatted_address),
              local_data: verifiedMatch
            };
          });

        setSearchResults(nepaliSchools);
        
        // Update map to show results
        if (mapInstance && nepaliSchools.length > 0) {
          showSchoolsOnMap(nepaliSchools);
        }
      } else {
        setSearchResults([]);
      }
    });
  };

  const extractDistrict = (address) => {
    // Simple district extraction from address
    const nepaliDistricts = [
      'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Pokhara', 'Kaski',
      'Morang', 'Jhapa', 'Sunsari', 'Dhanusha', 'Bara', 'Parsa', 'Rautahat'
      // Add more districts as needed
    ];
    
    for (const district of nepaliDistricts) {
      if (address?.toLowerCase().includes(district.toLowerCase())) {
        return district;
      }
    }
    return 'Unknown';
  };

  const showSchoolsOnMap = (schools) => {
    if (!mapInstance) return;

    // Clear existing markers
    // (In a production app, you'd manage markers in state)

    const bounds = new window.google.maps.LatLngBounds();

    schools.forEach(school => {
      if (school.geometry?.location) {
        addSchoolMarker(mapInstance, school);
        bounds.extend(school.geometry.location);
      }
    });

    if (schools.length > 1) {
      mapInstance.fitBounds(bounds);
    } else if (schools.length === 1) {
      mapInstance.setCenter(schools[0].geometry.location);
      mapInstance.setZoom(15);
    }
  };

  const addSchoolMarker = (map, school) => {
    const marker = new window.google.maps.Marker({
      position: school.geometry?.location || school.location,
      map: map,
      title: school.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: school.is_verified ? '#10b981' : '#6b7280',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-2">
          <h3 class="font-semibold">${school.name}</h3>
          <p class="text-sm text-gray-600">${school.formatted_address || school.address}</p>
          ${school.is_verified ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Verified</span>' : ''}
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    return marker;
  };

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    
    // Center map on selected school
    if (mapInstance && school.geometry?.location) {
      mapInstance.setCenter(school.geometry.location);
      mapInstance.setZoom(16);
    }

    // Prepare school data for parent component
    const schoolData = {
      google_place_id: school.place_id,
      name: school.name,
      address: school.formatted_address,
      district: school.district,
      location: school.geometry?.location,
      is_verified: school.is_verified,
      verified_id: school.verified_id,
      rating: school.rating,
      local_data: school.local_data
    };

    onSchoolSelected(schoolData);
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout(window.schoolSearchTimeout);
    window.schoolSearchTimeout = setTimeout(() => {
      searchSchools(query);
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchInputChange}
          placeholder={t('school.searchPlaceholder')}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <FaSpinner className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Verified Schools First (if no search) */}
      {!searchQuery && verifiedSchools.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {t('school.verifiedSchools')} {district && `in ${district}`}
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {verifiedSchools.slice(0, 5).map(school => (
              <motion.div
                key={school.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSchoolSelect({
                  ...school,
                  place_id: school.google_place_id,
                  formatted_address: school.address,
                  is_verified: true,
                  verified_id: school.id,
                  geometry: school.location ? { location: school.location } : null
                })}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSchool?.verified_id === school.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FaSchool className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">{school.name}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ {t('school.verified')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{school.address}</p>
                    <p className="text-xs text-gray-500">{school.district}</p>
                  </div>
                  {selectedSchool?.verified_id === school.id && (
                    <FaCheck className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {t('school.searchResults')} ({searchResults.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map(school => (
              <motion.div
                key={school.place_id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSchoolSelect(school)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSchool?.place_id === school.place_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FaSchool className={`w-4 h-4 ${school.is_verified ? 'text-green-600' : 'text-gray-600'}`} />
                      <h4 className="font-medium text-gray-900">{school.name}</h4>
                      {school.is_verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✓ {t('school.verified')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                      <FaMapMarkerAlt className="w-3 h-3" />
                      <span>{school.formatted_address}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{school.district}</span>
                      {school.rating && (
                        <span>★ {school.rating} ({school.user_ratings_total || 0})</span>
                      )}
                    </div>
                  </div>
                  {selectedSchool?.place_id === school.place_id && (
                    <FaCheck className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Mini Map */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FaGlobe className="w-4 h-4" />
            <span>{selectedSchool ? `Location: ${selectedSchool.name}` : 'Select a school to view location'}</span>
          </div>
        </div>
        <div ref={mapRef} className="w-full h-48 bg-gray-100">
          {/* Google Map will be rendered here */}
        </div>
      </div>

      {/* Selected School Summary */}
      {selectedSchool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 text-blue-800 mb-2">
            <FaCheck className="w-4 h-4" />
            <span className="font-medium">{t('school.selectedSchool')}</span>
          </div>
          <h4 className="font-semibold text-gray-900">{selectedSchool.name}</h4>
          <p className="text-sm text-gray-600">{selectedSchool.formatted_address || selectedSchool.address}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
            <span>{selectedSchool.district}</span>
            {selectedSchool.is_verified && (
              <span className="text-green-600">✓ Verified School</span>
            )}
            {selectedSchool.rating && (
              <span>★ {selectedSchool.rating}</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GoogleMapsSchoolPicker;
