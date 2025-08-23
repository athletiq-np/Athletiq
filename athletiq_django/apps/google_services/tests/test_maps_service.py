import pytest
from unittest.mock import Mock, patch
from django.test import TestCase
from apps.google_services.services.maps_service import MapsService
from apps.google_services.models import LocationCache


class MapsServiceTest(TestCase):
    """Test MapsService functionality"""
    
    def setUp(self):
        self.service = MapsService()
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    @patch('apps.google_services.services.maps_service.googlemaps')
    def test_maps_service_initialization(self, mock_googlemaps):
        """Test Maps service initialization"""
        mock_client = Mock()
        mock_googlemaps.Client.return_value = mock_client
        
        with patch('django.conf.settings.GOOGLE_MAPS_API_KEY', 'test_api_key'):
            service = MapsService()
            self.assertIsNotNone(service.client)
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', False)
    def test_maps_service_unavailable(self):
        """Test Maps service when library is not available"""
        service = MapsService()
        self.assertFalse(service.is_available())
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_geocode_address_success(self):
        """Test successful address geocoding"""
        mock_client = Mock()
        mock_client.geocode.return_value = [{
            'place_id': 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA',
            'formatted_address': '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
            'geometry': {
                'location': {'lat': 37.4224764, 'lng': -122.0842499}
            },
            'types': ['street_address']
        }]
        
        service = MapsService()
        service.client = mock_client
        service.api_key = 'test_key'
        
        result = service.geocode_address('1600 Amphitheatre Parkway', use_cache=False)
        
        self.assertEqual(result['place_id'], 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA')
        self.assertEqual(result['latitude'], 37.4224764)
        self.assertEqual(result['longitude'], -122.0842499)
        self.assertFalse(result['cached'])
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_geocode_address_with_cache(self):
        """Test address geocoding with caching"""
        # Create cached location
        LocationCache.objects.create(
            query='Google HQ',
            place_id='test_place_id',
            formatted_address='1600 Amphitheatre Pkwy, Mountain View, CA',
            latitude=37.4224764,
            longitude=-122.0842499,
            location_data={'types': ['establishment']}
        )
        
        service = MapsService()
        service.client = Mock()  # Should not be called due to cache
        service.api_key = 'test_key'
        
        result = service.geocode_address('Google HQ')
        
        self.assertEqual(result['place_id'], 'test_place_id')
        self.assertTrue(result['cached'])
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_geocode_address_no_results(self):
        """Test geocoding with no results"""
        mock_client = Mock()
        mock_client.geocode.return_value = []
        
        service = MapsService()
        service.client = mock_client
        service.api_key = 'test_key'
        
        with self.assertRaises(Exception) as context:
            service.geocode_address('Invalid Address', use_cache=False)
        
        self.assertIn('No results found', str(context.exception))
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_reverse_geocode_success(self):
        """Test successful reverse geocoding"""
        mock_client = Mock()
        mock_client.reverse_geocode.return_value = [{
            'place_id': 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA',
            'formatted_address': '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
            'address_components': [
                {'long_name': '1600', 'short_name': '1600', 'types': ['street_number']},
                {'long_name': 'Amphitheatre Parkway', 'short_name': 'Amphitheatre Pkwy', 'types': ['route']}
            ]
        }]
        
        service = MapsService()
        service.client = mock_client
        service.api_key = 'test_key'
        
        result = service.reverse_geocode(37.4224764, -122.0842499)
        
        self.assertEqual(result['place_id'], 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA')
        self.assertEqual(result['latitude'], 37.4224764)
        self.assertEqual(result['longitude'], -122.0842499)
        self.assertIn('address_components', result)
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_search_places_success(self):
        """Test successful places search"""
        mock_client = Mock()
        mock_client.places.return_value = {
            'results': [{
                'place_id': 'ChIJ_____restaurant_id',
                'name': 'Test Restaurant',
                'formatted_address': '123 Main St, City, State',
                'geometry': {
                    'location': {'lat': 37.4224764, 'lng': -122.0842499}
                },
                'rating': 4.5,
                'types': ['restaurant', 'food'],
                'price_level': 2
            }]
        }
        
        service = MapsService()
        service.client = mock_client
        service.api_key = 'test_key'
        
        results = service.search_places('restaurants', location=(37.4224764, -122.0842499))
        
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Test Restaurant')
        self.assertEqual(results[0]['rating'], 4.5)
        self.assertEqual(results[0]['price_level'], 2)
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_get_place_details_success(self):
        """Test successful place details lookup"""
        mock_client = Mock()
        mock_client.place.return_value = {
            'result': {
                'place_id': 'ChIJ_____place_id',
                'name': 'Test Place',
                'formatted_address': '123 Main St, City, State',
                'geometry': {
                    'location': {'lat': 37.4224764, 'lng': -122.0842499}
                },
                'formatted_phone_number': '+1 555-123-4567',
                'website': 'https://example.com',
                'rating': 4.2,
                'types': ['establishment']
            }
        }
        
        service = MapsService()
        service.client = mock_client
        service.api_key = 'test_key'
        
        result = service.get_place_details('ChIJ_____place_id')
        
        self.assertEqual(result['name'], 'Test Place')
        self.assertEqual(result['phone'], '+1 555-123-4567')
        self.assertEqual(result['website'], 'https://example.com')
        self.assertEqual(result['rating'], 4.2)
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_calculate_distance_success(self):
        """Test successful distance calculation"""
        mock_client = Mock()
        mock_client.distance_matrix.return_value = {
            'rows': [{
                'elements': [{
                    'status': 'OK',
                    'distance': {'text': '10.5 km', 'value': 10500},
                    'duration': {'text': '15 mins', 'value': 900}
                }]
            }]
        }
        
        service = MapsService()
        service.client = mock_client
        service.api_key = 'test_key'
        
        result = service.calculate_distance('Origin', 'Destination')
        
        self.assertEqual(result['distance']['text'], '10.5 km')
        self.assertEqual(result['distance']['value'], 10500)
        self.assertEqual(result['duration']['text'], '15 mins')
        self.assertEqual(result['duration']['value'], 900)
        self.assertEqual(result['mode'], 'driving')
    
    def test_maps_service_unavailable(self):
        """Test Maps service when unavailable"""
        service = MapsService()
        service.client = None
        
        with self.assertRaises(Exception) as context:
            service.geocode_address('Test Address')
        
        self.assertIn('Google Maps API is not available', str(context.exception))
    
    @patch('apps.google_services.services.maps_service.HAS_GOOGLE_MAPS', True)
    def test_geocode_api_error(self):
        """Test geocoding with API error"""
        mock_client = Mock()
        mock_client.geocode.side_effect = Exception('API Error')
        
        service = MapsService()
        service.client = mock_client
        service.api_key = 'test_key'
        
        with self.assertRaises(Exception) as context:
            service.geocode_address('Test Address', use_cache=False)
        
        self.assertIn('Geocoding failed', str(context.exception))