"""
Authentication middleware for JWT token handling.
"""
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class JWTAuthenticationMiddleware:
    """
    Middleware to handle JWT authentication for compatibility with existing frontend.
    This middleware extracts JWT tokens from Authorization header and sets request.user.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process JWT token if present
        self.process_jwt_token(request)
        
        response = self.get_response(request)
        return response

    def process_jwt_token(self, request):
        """
        Extract and validate JWT token from Authorization header.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return
        
        try:
            # Extract token
            token = auth_header.split(' ')[1]
            
            # Validate token using SimpleJWT
            UntypedToken(token)
            
            # Decode token to get user info
            decoded_token = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256']
            )
            
            # Get user from token - try both user_id and id fields
            user_id = decoded_token.get('user_id') or decoded_token.get('id')
            if user_id:
                try:
                    # Try to find user by user_id field first, then by pk
                    try:
                        user = User.objects.get(user_id=user_id)
                    except User.DoesNotExist:
                        user = User.objects.get(pk=user_id)
                    
                    if user.is_active:
                        request.user = user
                        # Add token payload to request for additional info
                        request.token_payload = decoded_token
                        logger.debug(f"JWT auth successful for user {user_id}")
                except User.DoesNotExist:
                    logger.warning(f"User {user_id} from token not found")
                    
        except (InvalidToken, TokenError, jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            logger.warning(f"Invalid JWT token: {e}")
        except Exception as e:
            logger.error(f"Error processing JWT token: {e}")
            logger.error(f"Token payload: {decoded_token if 'decoded_token' in locals() else 'Could not decode'}")


class RateLimitByUserMiddleware:
    """
    Middleware to implement user-specific rate limiting.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Add user info to rate limiting key
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.rate_limit_key = f"user:{request.user.user_id}"
        else:
            # Use IP for anonymous users
            request.rate_limit_key = f"ip:{self.get_client_ip(request)}"
        
        response = self.get_response(request)
        return response
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to responses.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add CORS headers for API endpoints
        if request.path.startswith('/api/'):
            response['Access-Control-Allow-Credentials'] = 'true'
        
        return response


class APIResponseMiddleware:
    """
    Middleware to ensure consistent API response format.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only process API endpoints
        if not request.path.startswith('/api/'):
            return response
        
        # Add request ID to response if available
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id
        
        return response

    def process_exception(self, request, exception):
        """
        Handle exceptions for API endpoints with consistent format.
        """
        if not request.path.startswith('/api/'):
            return None
        
        logger.error(f"API Exception: {exception}", exc_info=True)
        
        return JsonResponse({
            'success': False,
            'message': 'Internal server error',
            'status': 500
        }, status=500)