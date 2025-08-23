import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.uploadedfile import InMemoryUploadedFile
from .services.google_service_manager import google_services
from .serializers import (
    TranslateTextSerializer, TranslateBatchSerializer,
    GeocodeSerializer, PlaceSearchSerializer, VisionOCRSerializer
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def translate_text(request):
    """
    Translate text using Google Translate API
    
    POST /api/google/translate/text
    {
        "text": "Hello world",
        "target_language": "es",
        "source_language": "en"  // optional
    }
    """
    serializer = TranslateTextSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = google_services.translate.translate_text(
            text=serializer.validated_data['text'],
            target_language=serializer.validated_data['target_language'],
            source_language=serializer.validated_data.get('source_language')
        )
        
        return Response({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def translate_batch(request):
    """
    Translate multiple texts in batch
    
    POST /api/google/translate/batch
    {
        "texts": ["Hello", "World"],
        "target_language": "es",
        "source_language": "en"  // optional
    }
    """
    serializer = TranslateBatchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        results = google_services.translate.translate_batch(
            texts=serializer.validated_data['texts'],
            target_language=serializer.validated_data['target_language'],
            source_language=serializer.validated_data.get('source_language')
        )
        
        return Response({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        logger.error(f"Batch translation failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_language(request):
    """
    Detect language of text
    
    POST /api/google/translate/detect
    {
        "text": "Hola mundo"
    }
    """
    text = request.data.get('text')
    if not text:
        return Response({
            'success': False,
            'message': 'Text is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = google_services.translate.detect_language(text)
        
        return Response({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Language detection failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def supported_languages(request):
    """
    Get supported languages for translation
    
    GET /api/google/translate/languages?target_language=en
    """
    target_language = request.GET.get('target_language', 'en')
    
    try:
        languages = google_services.translate.get_supported_languages(target_language)
        
        return Response({
            'success': True,
            'data': languages
        })
        
    except Exception as e:
        logger.error(f"Failed to get supported languages: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vision_ocr(request):
    """
    Extract text from image using Google Vision API
    
    POST /api/google/vision/ocr
    Content-Type: multipart/form-data
    image: <image file>
    language_hints: ["en", "es"]  // optional
    """
    serializer = VisionOCRSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        image_file = serializer.validated_data['image']
        language_hints = serializer.validated_data.get('language_hints', [])
        
        # Read image content
        image_content = image_file.read()
        
        result = google_services.vision.extract_text(
            image_content=image_content,
            language_hints=language_hints
        )
        
        return Response({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Vision OCR failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vision_document_properties(request):
    """
    Detect document properties using Google Vision API
    
    POST /api/google/vision/document-properties
    Content-Type: multipart/form-data
    image: <image file>
    """
    image_file = request.FILES.get('image')
    if not image_file:
        return Response({
            'success': False,
            'message': 'Image file is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        image_content = image_file.read()
        
        result = google_services.vision.detect_document_properties(image_content)
        
        return Response({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Document properties detection failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def geocode_address(request):
    """
    Geocode an address using Google Maps API
    
    POST /api/google/maps/geocode
    {
        "address": "1600 Amphitheatre Parkway, Mountain View, CA"
    }
    """
    serializer = GeocodeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = google_services.maps.geocode_address(
            address=serializer.validated_data['address']
        )
        
        return Response({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Geocoding failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reverse_geocode(request):
    """
    Reverse geocode coordinates using Google Maps API
    
    POST /api/google/maps/reverse-geocode
    {
        "latitude": 37.4224764,
        "longitude": -122.0842499
    }
    """
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if latitude is None or longitude is None:
        return Response({
            'success': False,
            'message': 'Latitude and longitude are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = google_services.maps.reverse_geocode(
            latitude=float(latitude),
            longitude=float(longitude)
        )
        
        return Response({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Reverse geocoding failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_places(request):
    """
    Search places using Google Maps API
    
    POST /api/google/maps/places/search
    {
        "query": "restaurants near me",
        "latitude": 37.4224764,  // optional
        "longitude": -122.0842499,  // optional
        "radius": 5000,  // optional, meters
        "type": "restaurant"  // optional
    }
    """
    serializer = PlaceSearchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        location = None
        if serializer.validated_data.get('latitude') and serializer.validated_data.get('longitude'):
            location = (
                serializer.validated_data['latitude'],
                serializer.validated_data['longitude']
            )
        
        results = google_services.maps.search_places(
            query=serializer.validated_data['query'],
            location=location,
            radius=serializer.validated_data.get('radius', 50000),
            place_type=serializer.validated_data.get('type')
        )
        
        return Response({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        logger.error(f"Places search failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def place_details(request, place_id):
    """
    Get place details using Google Maps API
    
    GET /api/google/maps/places/{place_id}
    """
    try:
        result = google_services.maps.get_place_details(place_id)
        
        return Response({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Place details lookup failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def service_status(request):
    """
    Get Google services status
    
    GET /api/google/status
    """
    try:
        status_info = google_services.health_check()
        
        return Response({
            'success': True,
            'data': status_info
        })
        
    except Exception as e:
        logger.error(f"Service status check failed: {e}")
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)