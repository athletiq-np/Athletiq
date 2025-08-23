import logging
import time
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.db import transaction
from .base import BaseGoogleService
from ..models import TranslationCache

logger = logging.getLogger(__name__)

# Optional imports for Google Translate API
try:
    from google.cloud import translate_v2 as translate
    HAS_GOOGLE_TRANSLATE = True
except ImportError:
    HAS_GOOGLE_TRANSLATE = False
    logger.warning("Google Cloud Translate not available. Install google-cloud-translate package.")


class TranslateService(BaseGoogleService):
    """Google Translate API service with caching"""
    
    def __init__(self):
        super().__init__()
        self.client = None
        if HAS_GOOGLE_TRANSLATE:
            try:
                if self.credentials_path:
                    self.client = translate.Client.from_service_account_json(
                        self.credentials_path
                    )
                else:
                    # Use default credentials
                    self.client = translate.Client()
                logger.info("Google Translate client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Google Translate client: {e}")
                self.client = None
    
    def is_available(self) -> bool:
        """Check if Google Translate service is available"""
        return HAS_GOOGLE_TRANSLATE and self.client is not None   
 
    def translate_text(self, text: str, target_language: str, 
                      source_language: str = None, use_cache: bool = True) -> Dict[str, Any]:
        """
        Translate text using Google Translate API with caching
        
        Args:
            text: Text to translate
            target_language: Target language code (e.g., 'es', 'fr')
            source_language: Source language code (auto-detect if None)
            use_cache: Whether to use cached translations
            
        Returns:
            Dict containing translated text and metadata
        """
        if not self.is_available():
            raise Exception("Google Translate API is not available")
        
        if not text or not text.strip():
            return {
                'translated_text': text,
                'source_language': source_language or 'unknown',
                'target_language': target_language,
                'confidence': 1.0,
                'cached': False
            }
        
        # Check cache first
        if use_cache:
            cached_result = self._get_cached_translation(text, source_language, target_language)
            if cached_result:
                return {
                    'translated_text': cached_result.translated_text,
                    'source_language': cached_result.source_language,
                    'target_language': cached_result.target_language,
                    'confidence': cached_result.confidence or 1.0,
                    'cached': True
                }
        
        start_time = time.time()
        
        try:
            # Perform translation
            result = self.client.translate(
                text,
                target_language=target_language,
                source_language=source_language
            )
            
            processing_time = time.time() - start_time
            
            translated_text = result['translatedText']
            detected_source = result.get('detectedSourceLanguage', source_language or 'unknown')
            
            translation_result = {
                'translated_text': translated_text,
                'source_language': detected_source,
                'target_language': target_language,
                'confidence': 1.0,  # Google Translate doesn't provide confidence scores
                'cached': False,
                'metadata': {
                    'processing_time': processing_time,
                    'method': 'google_translate'
                }
            }
            
            # Cache the result
            if use_cache:
                self._cache_translation(text, detected_source, target_language, 
                                      translated_text, 1.0)
            
            # Log usage
            self._log_usage(
                'translate', 
                'translate_text', 
                True, 
                processing_time=processing_time,
                response_size=len(translated_text)
            )
            
            return translation_result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('translate', 'translate_text', False, str(e), processing_time)
            raise Exception(f"Translation failed: {str(e)}")
    
    def translate_batch(self, texts: List[str], target_language: str, 
                       source_language: str = None, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Translate multiple texts in batch
        
        Args:
            texts: List of texts to translate
            target_language: Target language code
            source_language: Source language code (auto-detect if None)
            use_cache: Whether to use cached translations
            
        Returns:
            List of translation results
        """
        if not self.is_available():
            raise Exception("Google Translate API is not available")
        
        results = []
        uncached_texts = []
        uncached_indices = []
        
        # Check cache for each text
        for i, text in enumerate(texts):
            if use_cache:
                cached_result = self._get_cached_translation(text, source_language, target_language)
                if cached_result:
                    results.append({
                        'translated_text': cached_result.translated_text,
                        'source_language': cached_result.source_language,
                        'target_language': cached_result.target_language,
                        'confidence': cached_result.confidence or 1.0,
                        'cached': True
                    })
                    continue
            
            # Add to uncached list
            uncached_texts.append(text)
            uncached_indices.append(i)
            results.append(None)  # Placeholder
        
        # Translate uncached texts
        if uncached_texts:
            start_time = time.time()
            
            try:
                batch_results = self.client.translate(
                    uncached_texts,
                    target_language=target_language,
                    source_language=source_language
                )
                
                processing_time = time.time() - start_time
                
                # Process batch results
                for i, (text, result) in enumerate(zip(uncached_texts, batch_results)):
                    translated_text = result['translatedText']
                    detected_source = result.get('detectedSourceLanguage', source_language or 'unknown')
                    
                    translation_result = {
                        'translated_text': translated_text,
                        'source_language': detected_source,
                        'target_language': target_language,
                        'confidence': 1.0,
                        'cached': False
                    }
                    
                    # Update results at correct index
                    original_index = uncached_indices[i]
                    results[original_index] = translation_result
                    
                    # Cache the result
                    if use_cache:
                        self._cache_translation(text, detected_source, target_language, 
                                              translated_text, 1.0)
                
                # Log batch usage
                self._log_usage(
                    'translate', 
                    'translate_batch', 
                    True, 
                    processing_time=processing_time,
                    response_size=sum(len(r['translated_text']) for r in results if r)
                )
                
            except Exception as e:
                processing_time = time.time() - start_time
                self._log_usage('translate', 'translate_batch', False, str(e), processing_time)
                raise Exception(f"Batch translation failed: {str(e)}")
        
        return results
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detect the language of given text
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict containing detected language and confidence
        """
        if not self.is_available():
            raise Exception("Google Translate API is not available")
        
        start_time = time.time()
        
        try:
            result = self.client.detect_language(text)
            
            processing_time = time.time() - start_time
            
            detection_result = {
                'language': result['language'],
                'confidence': result['confidence'],
                'metadata': {
                    'processing_time': processing_time,
                    'method': 'google_translate'
                }
            }
            
            self._log_usage('translate', 'detect_language', True, processing_time=processing_time)
            
            return detection_result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._log_usage('translate', 'detect_language', False, str(e), processing_time)
            raise Exception(f"Language detection failed: {str(e)}")
    
    def get_supported_languages(self, target_language: str = 'en') -> List[Dict[str, str]]:
        """
        Get list of supported languages
        
        Args:
            target_language: Language for language names (default: 'en')
            
        Returns:
            List of supported languages with codes and names
        """
        if not self.is_available():
            raise Exception("Google Translate API is not available")
        
        cache_key = f"supported_languages_{target_language}"
        cached_result = self._get_cached_result(cache_key)
        if cached_result:
            return cached_result
        
        try:
            languages = self.client.get_languages(target_language=target_language)
            
            result = [
                {
                    'language': lang['language'],
                    'name': lang['name']
                }
                for lang in languages
            ]
            
            # Cache for 24 hours
            self._cache_result(cache_key, result, timeout=86400)
            
            self._log_usage('translate', 'get_supported_languages', True)
            
            return result
            
        except Exception as e:
            self._log_usage('translate', 'get_supported_languages', False, str(e))
            raise Exception(f"Failed to get supported languages: {str(e)}")
    
    def _get_cached_translation(self, text: str, source_language: str, 
                               target_language: str) -> Optional[TranslationCache]:
        """Get cached translation if available"""
        try:
            return TranslationCache.objects.get(
                source_text=text,
                source_language=source_language or 'auto',
                target_language=target_language
            )
        except TranslationCache.DoesNotExist:
            return None
        except Exception as e:
            logger.warning(f"Failed to get cached translation: {e}")
            return None
    
    def _cache_translation(self, text: str, source_language: str, target_language: str,
                          translated_text: str, confidence: float):
        """Cache translation result"""
        try:
            with transaction.atomic():
                TranslationCache.objects.update_or_create(
                    source_text=text,
                    source_language=source_language,
                    target_language=target_language,
                    defaults={
                        'translated_text': translated_text,
                        'confidence': confidence
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to cache translation: {e}")