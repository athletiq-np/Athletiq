import logging
import time
from typing import Dict, Any, Optional, List
from django.conf import settings
from .base import BaseGoogleService

logger = logging.getLogger(__name__)

# Optional imports for Google Vision API
try:
    from google.cloud import vision
    HAS_GOOGLE_VISION = True
except ImportError:
    HAS_GOOGLE_VISION = False
    logger.warning("Google Cloud Vision not available. Install google-cloud-vision package.")


class VisionService(BaseGoogleService):
    """Enhanced Google Vision API service for OCR and image analysis"""
    
    def __init__(self):
        super().__init__()
        self.client = None
        if HAS_GOOGLE_VISION:
            try:
                if self.credentials_path:
                    self.client = vision.ImageAnnotatorClient.from_service_account_file(
                        self.credentials_path
                    )
                else:
                    # Use default credentials (environment variable or metadata server)
                    self.client = vision.ImageAnnotatorClient()
                logger.info("Google Vision client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Google Vision client: {e}")
                self.client = None
    
    def is_available(self) -> bool:
        """Check if Google Vision service is available"""
        return HAS_GOOGLE_VISION and self.client is not None    

    def extract_text(self, image_content: bytes, language_hints: List[str] = None) -> Dict[str, Any]:
        """
        Extract text from image using Google Vision API
        
        Args:
            image_content: Image file content as bytes
            language_hints: List of language codes to hint the OCR engine
            
        Returns:
            Dict containing extracted text and metadata
        """
        if not self.is_available():
            raise Exception("Google Vision API is not available")
        
        start_time = time.time()
        
        try:
            # Create image object
            image = vision.Image(content=image_content)
            
            # Configure image context
            image_context = None
            if language_hints:
                image_context = vision.ImageContext(language_hints=language_hints)
            
            # Perform text detection
            response = self.client.text_detection(
                image=image,
                image_context=image_context
            )
            
            processing_time = time.time() - start_time
            
            # Check for errors
            if response.error.message:
                error_msg = f"Google Vision API error: {response.error.message}"
                self._log_usage('vision', 'text_detection', False, error_msg, processing_time)
                raise Exception(error_msg)
            
            # Extract text annotations
            texts = response.text_annotations
            
            if not texts:
                result = {
                    'full_text': '',
                    'confidence': 0.0,
                    'language': language_hints[0] if language_hints else 'en',
                    'blocks': [],
                    'metadata': {
                        'method': 'google_vision',
                        'processing_time': processing_time,
                        'blocks_count': 0
                    }
                }
            else:
                # First annotation contains the full text
                full_text = texts[0].description
                
                # Extract individual text blocks with confidence scores
                text_blocks = []
                for text in texts[1:]:  # Skip the first one (full text)
                    vertices = [(vertex.x, vertex.y) for vertex in text.bounding_poly.vertices]
                    text_blocks.append({
                        'text': text.description,
                        'confidence': getattr(text, 'confidence', 0.9),  # Default confidence
                        'bounding_box': vertices
                    })
                
                # Detect language (simplified - use first language hint or default)
                detected_language = language_hints[0] if language_hints else 'en'
                
                # Calculate average confidence
                avg_confidence = sum(block['confidence'] for block in text_blocks) / len(text_blocks) if text_blocks else 0.9
                
                result = {
                    'full_text': full_text,
                    'confidence': avg_confidence,
                    'language': detected_language,
                    'blocks': text_blocks,
                    'metadata': {
                        'method': 'google_vision',
                        'processing_time': processing_time,
                        'blocks_count': len(text_blocks),
                        'api_response_size': len(str(response))
                    }
                }
            
            # Log successful usage
            self._log_usage(
                'vision', 
                'text_detection', 
                True, 
                processing_time=processing_time,
                response_size=len(str(response))
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('vision', 'text_detection', False, str(e), processing_time)
            raise Exception(f"Google Vision OCR failed: {str(e)}")
    
    def detect_document_properties(self, image_content: bytes) -> Dict[str, Any]:
        """
        Detect document properties like orientation, language, etc.
        
        Args:
            image_content: Image file content as bytes
            
        Returns:
            Dict containing document properties
        """
        if not self.is_available():
            raise Exception("Google Vision API is not available")
        
        start_time = time.time()
        
        try:
            image = vision.Image(content=image_content)
            
            # Perform document text detection (more detailed than text detection)
            response = self.client.document_text_detection(image=image)
            
            processing_time = time.time() - start_time
            
            if response.error.message:
                error_msg = f"Google Vision API error: {response.error.message}"
                self._log_usage('vision', 'document_properties', False, error_msg, processing_time)
                raise Exception(error_msg)
            
            document = response.full_text_annotation
            
            if not document:
                return {
                    'languages': [],
                    'orientation': 'unknown',
                    'confidence': 0.0
                }
            
            # Extract language information
            languages = []
            for page in document.pages:
                for block in page.blocks:
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            for symbol in word.symbols:
                                if hasattr(symbol.property, 'detected_languages'):
                                    for lang in symbol.property.detected_languages:
                                        languages.append({
                                            'language_code': lang.language_code,
                                            'confidence': lang.confidence
                                        })
            
            # Get unique languages with highest confidence
            unique_languages = {}
            for lang in languages:
                code = lang['language_code']
                if code not in unique_languages or lang['confidence'] > unique_languages[code]['confidence']:
                    unique_languages[code] = lang
            
            result = {
                'languages': list(unique_languages.values()),
                'orientation': 'normal',  # Simplified - could be enhanced
                'confidence': max([lang['confidence'] for lang in unique_languages.values()]) if unique_languages else 0.0,
                'metadata': {
                    'processing_time': processing_time,
                    'pages_count': len(document.pages) if document.pages else 0
                }
            }
            
            self._log_usage('vision', 'document_properties', True, processing_time=processing_time)
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('vision', 'document_properties', False, str(e), processing_time)
            raise Exception(f"Document properties detection failed: {str(e)}")
    
    def detect_objects(self, image_content: bytes) -> List[Dict[str, Any]]:
        """
        Detect objects in image
        
        Args:
            image_content: Image file content as bytes
            
        Returns:
            List of detected objects with confidence scores
        """
        if not self.is_available():
            raise Exception("Google Vision API is not available")
        
        start_time = time.time()
        
        try:
            image = vision.Image(content=image_content)
            
            response = self.client.object_localization(image=image)
            
            processing_time = time.time() - start_time
            
            if response.error.message:
                error_msg = f"Google Vision API error: {response.error.message}"
                self._log_usage('vision', 'object_detection', False, error_msg, processing_time)
                raise Exception(error_msg)
            
            objects = []
            for obj in response.localized_object_annotations:
                vertices = [(vertex.x, vertex.y) for vertex in obj.bounding_poly.normalized_vertices]
                objects.append({
                    'name': obj.name,
                    'confidence': obj.score,
                    'bounding_box': vertices
                })
            
            self._log_usage('vision', 'object_detection', True, processing_time=processing_time)
            
            return objects
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('vision', 'object_detection', False, str(e), processing_time)
            raise Exception(f"Object detection failed: {str(e)}")