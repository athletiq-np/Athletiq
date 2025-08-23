import logging
from typing import Dict, Any, Optional
from .vision_service import VisionService
from .translate_service import TranslateService
from .maps_service import MapsService

logger = logging.getLogger(__name__)


class GoogleServiceManager:
    """
    Unified manager for all Google services
    Provides a single interface to access Vision, Translate, and Maps APIs
    """
    
    def __init__(self):
        self._vision_service = None
        self._translate_service = None
        self._maps_service = None
    
    @property
    def vision(self) -> VisionService:
        """Get Vision service instance (lazy loading)"""
        if self._vision_service is None:
            self._vision_service = VisionService()
        return self._vision_service
    
    @property
    def translate(self) -> TranslateService:
        """Get Translate service instance (lazy loading)"""
        if self._translate_service is None:
            self._translate_service = TranslateService()
        return self._translate_service
    
    @property
    def maps(self) -> MapsService:
        """Get Maps service instance (lazy loading)"""
        if self._maps_service is None:
            self._maps_service = MapsService()
        return self._maps_service
    
    def get_service_status(self) -> Dict[str, bool]:
        """
        Get availability status of all Google services
        
        Returns:
            Dict with service availability status
        """
        return {
            'vision': self.vision.is_available(),
            'translate': self.translate.is_available(),
            'maps': self.maps.is_available()
        }
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on all Google services
        
        Returns:
            Dict with detailed health status
        """
        status = {
            'overall_status': 'healthy',
            'services': {}
        }
        
        # Check Vision API
        try:
            vision_available = self.vision.is_available()
            status['services']['vision'] = {
                'available': vision_available,
                'status': 'healthy' if vision_available else 'unavailable',
                'error': None
            }
        except Exception as e:
            status['services']['vision'] = {
                'available': False,
                'status': 'error',
                'error': str(e)
            }
            status['overall_status'] = 'degraded'
        
        # Check Translate API
        try:
            translate_available = self.translate.is_available()
            status['services']['translate'] = {
                'available': translate_available,
                'status': 'healthy' if translate_available else 'unavailable',
                'error': None
            }
        except Exception as e:
            status['services']['translate'] = {
                'available': False,
                'status': 'error',
                'error': str(e)
            }
            status['overall_status'] = 'degraded'
        
        # Check Maps API
        try:
            maps_available = self.maps.is_available()
            status['services']['maps'] = {
                'available': maps_available,
                'status': 'healthy' if maps_available else 'unavailable',
                'error': None
            }
        except Exception as e:
            status['services']['maps'] = {
                'available': False,
                'status': 'error',
                'error': str(e)
            }
            status['overall_status'] = 'degraded'
        
        # Determine overall status
        if all(service['available'] for service in status['services'].values()):
            status['overall_status'] = 'healthy'
        elif any(service['available'] for service in status['services'].values()):
            status['overall_status'] = 'degraded'
        else:
            status['overall_status'] = 'unhealthy'
        
        return status


# Global instance
google_services = GoogleServiceManager()