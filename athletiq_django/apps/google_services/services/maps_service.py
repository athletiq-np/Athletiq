import logging
import time
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.db import transaction
from .base import BaseGoogleService
from ..models import LocationCache

logger = logging.getLogger(__name__)

# Optional imports for Google Maps API
try:
    import googlemaps
    HAS_GOOGLE_MAPS = True
except ImportError:
    HAS_GOOGLE_MAPS = False
    logger.warning("Google Maps not available. Install googlemaps package.")


class MapsService(BaseGoogleService):
    """Google Maps API service for location and geocoding"""
    
    def __init__(self):
        super().__init__()
        self.client = None
        self.api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
        
        if HAS_GOOGLE_MAPS and self.api_key:
            try:
                self.client = googlemaps.Client(key=self.api_key)
                logger.info("Google Maps client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Google Maps client: {e}")
                self.client = None
    
    def is_available(self) -> bool:
        """Check if Google Maps service is available"""
        return HAS_GOOGLE_MAPS and self.client is not None and self.api_key    

    def geocode_address(self, address: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Geocode an address to get coordinates and place information
        
        Args:
            address: Address string to geocode
            use_cache: Whether to use cached results
            
        Returns:
            Dict containing geocoding results
        """
        if not self.is_available():
            raise Exception("Google Maps API is not available")
        
        # Check cache first
        if use_cache:
            cached_result = self._get_cached_location(address)
            if cached_result:
                return {
                    'place_id': cached_result.place_id,
                    'formatted_address': cached_result.formatted_address,
                    'latitude': float(cached_result.latitude),
                    'longitude': float(cached_result.longitude),
                    'location_data': cached_result.location_data,
                    'cached': True
                }
        
        start_time = time.time()
        
        try:
            # Perform geocoding
            geocode_result = self.client.geocode(address)
            
            processing_time = time.time() - start_time
            
            if not geocode_result:
                raise Exception(f"No results found for address: {address}")
            
            # Get the first (best) result
            result = geocode_result[0]
            
            place_id = result['place_id']
            formatted_address = result['formatted_address']
            location = result['geometry']['location']
            latitude = location['lat']
            longitude = location['lng']
            
            geocoding_result = {
                'place_id': place_id,
                'formatted_address': formatted_address,
                'latitude': latitude,
                'longitude': longitude,
                'location_data': result,
                'cached': False,
                'metadata': {
                    'processing_time': processing_time,
                    'method': 'google_maps_geocoding'
                }
            }
            
            # Cache the result
            if use_cache:
                self._cache_location(address, place_id, formatted_address, 
                                   latitude, longitude, result)
            
            # Log usage
            self._log_usage(
                'maps', 
                'geocode', 
                True, 
                processing_time=processing_time,
                response_size=len(str(result))
            )
            
            return geocoding_result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('maps', 'geocode', False, str(e), processing_time)
            raise Exception(f"Geocoding failed: {str(e)}")
    
    def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Reverse geocode coordinates to get address information
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Dict containing reverse geocoding results
        """
        if not self.is_available():
            raise Exception("Google Maps API is not available")
        
        start_time = time.time()
        
        try:
            # Perform reverse geocoding
            reverse_geocode_result = self.client.reverse_geocode((latitude, longitude))
            
            processing_time = time.time() - start_time
            
            if not reverse_geocode_result:
                raise Exception(f"No results found for coordinates: {latitude}, {longitude}")
            
            # Get the first (most specific) result
            result = reverse_geocode_result[0]
            
            geocoding_result = {
                'place_id': result['place_id'],
                'formatted_address': result['formatted_address'],
                'latitude': latitude,
                'longitude': longitude,
                'address_components': result['address_components'],
                'location_data': result,
                'metadata': {
                    'processing_time': processing_time,
                    'method': 'google_maps_reverse_geocoding'
                }
            }
            
            # Log usage
            self._log_usage(
                'maps', 
                'reverse_geocode', 
                True, 
                processing_time=processing_time,
                response_size=len(str(result))
            )
            
            return geocoding_result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('maps', 'reverse_geocode', False, str(e), processing_time)
            raise Exception(f"Reverse geocoding failed: {str(e)}")
    
    def search_places(self, query: str, location: tuple = None, radius: int = 50000,
                     place_type: str = None) -> List[Dict[str, Any]]:
        """
        Search for places using Google Places API
        
        Args:
            query: Search query
            location: (latitude, longitude) tuple for location bias
            radius: Search radius in meters
            place_type: Type of place to search for
            
        Returns:
            List of place results
        """
        if not self.is_available():
            raise Exception("Google Maps API is not available")
        
        start_time = time.time()
        
        try:
            # Perform places search
            places_result = self.client.places(
                query=query,
                location=location,
                radius=radius,
                type=place_type
            )
            
            processing_time = time.time() - start_time
            
            results = []
            for place in places_result.get('results', []):
                place_data = {
                    'place_id': place['place_id'],
                    'name': place['name'],
                    'formatted_address': place.get('formatted_address', ''),
                    'latitude': place['geometry']['location']['lat'],
                    'longitude': place['geometry']['location']['lng'],
                    'rating': place.get('rating'),
                    'types': place.get('types', []),
                    'price_level': place.get('price_level'),
                    'location_data': place
                }
                results.append(place_data)
            
            # Log usage
            self._log_usage(
                'maps', 
                'places_search', 
                True, 
                processing_time=processing_time,
                response_size=len(str(places_result))
            )
            
            return results
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('maps', 'places_search', False, str(e), processing_time)
            raise Exception(f"Places search failed: {str(e)}")
    
    def get_place_details(self, place_id: str, fields: List[str] = None) -> Dict[str, Any]:
        """
        Get detailed information about a specific place
        
        Args:
            place_id: Google Place ID
            fields: List of fields to retrieve
            
        Returns:
            Dict containing place details
        """
        if not self.is_available():
            raise Exception("Google Maps API is not available")
        
        start_time = time.time()
        
        try:
            # Default fields if none specified
            if not fields:
                fields = [
                    'place_id', 'name', 'formatted_address', 'geometry',
                    'formatted_phone_number', 'website', 'rating', 'types'
                ]
            
            # Get place details
            place_result = self.client.place(place_id=place_id, fields=fields)
            
            processing_time = time.time() - start_time
            
            if 'result' not in place_result:
                raise Exception(f"No details found for place ID: {place_id}")
            
            place = place_result['result']
            
            place_details = {
                'place_id': place['place_id'],
                'name': place.get('name', ''),
                'formatted_address': place.get('formatted_address', ''),
                'latitude': place['geometry']['location']['lat'],
                'longitude': place['geometry']['location']['lng'],
                'phone': place.get('formatted_phone_number'),
                'website': place.get('website'),
                'rating': place.get('rating'),
                'types': place.get('types', []),
                'location_data': place,
                'metadata': {
                    'processing_time': processing_time,
                    'method': 'google_maps_place_details'
                }
            }
            
            # Log usage
            self._log_usage(
                'maps', 
                'place_details', 
                True, 
                processing_time=processing_time,
                response_size=len(str(place_result))
            )
            
            return place_details
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('maps', 'place_details', False, str(e), processing_time)
            raise Exception(f"Place details lookup failed: {str(e)}")
    
    def calculate_distance(self, origin: str, destination: str, 
                          mode: str = 'driving') -> Dict[str, Any]:
        """
        Calculate distance and travel time between two locations
        
        Args:
            origin: Origin address or coordinates
            destination: Destination address or coordinates
            mode: Travel mode ('driving', 'walking', 'bicycling', 'transit')
            
        Returns:
            Dict containing distance and duration information
        """
        if not self.is_available():
            raise Exception("Google Maps API is not available")
        
        start_time = time.time()
        
        try:
            # Calculate distance matrix
            matrix_result = self.client.distance_matrix(
                origins=[origin],
                destinations=[destination],
                mode=mode
            )
            
            processing_time = time.time() - start_time
            
            if (not matrix_result.get('rows') or 
                not matrix_result['rows'][0].get('elements') or
                matrix_result['rows'][0]['elements'][0]['status'] != 'OK'):
                raise Exception("Could not calculate distance between locations")
            
            element = matrix_result['rows'][0]['elements'][0]
            
            distance_result = {
                'distance': {
                    'text': element['distance']['text'],
                    'value': element['distance']['value']  # meters
                },
                'duration': {
                    'text': element['duration']['text'],
                    'value': element['duration']['value']  # seconds
                },
                'mode': mode,
                'metadata': {
                    'processing_time': processing_time,
                    'method': 'google_maps_distance_matrix'
                }
            }
            
            # Log usage
            self._log_usage(
                'maps', 
                'distance_matrix', 
                True, 
                processing_time=processing_time,
                response_size=len(str(matrix_result))
            )
            
            return distance_result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('maps', 'distance_matrix', False, str(e), processing_time)
            raise Exception(f"Distance calculation failed: {str(e)}")
    
    def _get_cached_location(self, query: str) -> Optional[LocationCache]:
        """Get cached location if available"""
        try:
            return LocationCache.objects.get(query=query)
        except LocationCache.DoesNotExist:
            return None
        except Exception as e:
            logger.warning(f"Failed to get cached location: {e}")
            return None
    
    def _cache_location(self, query: str, place_id: str, formatted_address: str,
                       latitude: float, longitude: float, location_data: dict):
        """Cache location result"""
        try:
            with transaction.atomic():
                LocationCache.objects.update_or_create(
                    query=query,
                    defaults={
                        'place_id': place_id,
                        'formatted_address': formatted_address,
                        'latitude': latitude,
                        'longitude': longitude,
                        'location_data': location_data
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to cache location: {e}")