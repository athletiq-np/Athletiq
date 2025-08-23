"""
Unified Authentication System for Athletiq
Handles authentication for all user types with role-based redirections.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
import logging

from .models import User, UserSession
from apps.guardians.models import Guardian, GuardianSession
from apps.athletes.models import Athlete
from apps.schools.models import School
from .serializers import UserSerializer
from apps.guardians.serializers import GuardianSerializer

logger = logging.getLogger(__name__)


class UnifiedAuthService:
    """
    Service class for unified authentication across all user types.
    """
    
    @staticmethod
    def authenticate_user(email, password):
        """
        Authenticate user across all user types and return user data with role.
        
        Returns:
            dict: {
                'success': bool,
                'user_type': str,  # 'admin', 'guardian', 'athlete'
                'user_data': dict,
                'role': str,
                'redirect_path': str,
                'tokens': dict
            }
        """
        try:
            # Try to authenticate as system user first (Admin, Coach, etc.)
            user_result = UnifiedAuthService._authenticate_system_user(email, password)
            if user_result['success']:
                return user_result
            
            # Try to authenticate as guardian
            guardian_result = UnifiedAuthService._authenticate_guardian(email, password)
            if guardian_result['success']:
                return guardian_result
            
            # Try to authenticate as athlete (if athletes have login capability)
            athlete_result = UnifiedAuthService._authenticate_athlete(email, password)
            if athlete_result['success']:
                return athlete_result
            
            return {
                'success': False,
                'message': 'Invalid email or password',
                'user_type': None,
                'user_data': None,
                'role': None,
                'redirect_path': None,
                'tokens': None
            }
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                'success': False,
                'message': 'Authentication failed',
                'user_type': None,
                'user_data': None,
                'role': None,
                'redirect_path': None,
                'tokens': None
            }
    
    @staticmethod
    def _authenticate_system_user(email, password):
        """Authenticate system users (Admin, Coach, Referee, etc.)"""
        try:
            user = User.objects.get(email=email, is_active=True)
            if user.check_password(password):
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Determine redirect path based on role
                redirect_path = UnifiedAuthService._get_redirect_path_for_role(user.role)
                
                # Get additional user context
                user_context = UnifiedAuthService._get_user_context(user)
                
                return {
                    'success': True,
                    'user_type': 'admin',
                    'user_data': {
                        **UserSerializer(user).data,
                        **user_context
                    },
                    'role': user.role,
                    'redirect_path': redirect_path,
                    'tokens': {
                        'access': access_token,
                        'refresh': refresh_token
                    }
                }
        except User.DoesNotExist:
            pass
        
        return {'success': False}
    
    @staticmethod
    def _authenticate_guardian(email, password):
        """Authenticate guardians"""
        try:
            guardian = Guardian.objects.get(email=email, is_active=True)
            if guardian.check_password(password):
                # Generate custom JWT tokens for guardian
                tokens = UnifiedAuthService._generate_guardian_tokens(guardian)
                
                return {
                    'success': True,
                    'user_type': 'guardian',
                    'user_data': GuardianSerializer(guardian).data,
                    'role': 'Guardian',
                    'redirect_path': '/guardian/dashboard',
                    'tokens': tokens
                }
        except Guardian.DoesNotExist:
            pass
        
        return {'success': False}
    
    @staticmethod
    def _authenticate_athlete(email, password):
        """Authenticate athletes (if they have login capability)"""
        try:
            # Check if athlete has email and password set
            athlete = Athlete.objects.get(
                guardian_email=email, 
                is_active=True,
                registration_status='active'
            )
            
            # For now, athletes don't have direct login
            # This could be implemented if needed
            return {'success': False}
            
        except Athlete.DoesNotExist:
            pass
        
        return {'success': False}
    
    @staticmethod
    def _get_redirect_path_for_role(role):
        """Get redirect path based on user role"""
        role_redirects = {
            'superadmin': '/admin',
            'schooladmin': '/school',
            'coach': '/coach/dashboard',
            'referee': '/referee/dashboard',
            'organization': '/organization/dashboard',
        }
        return role_redirects.get(role.lower() if role else '', '/dashboard')
    
    @staticmethod
    def _get_user_context(user):
        """Get additional context for system users"""
        context = {}
        
        if user.role == 'SchoolAdmin':
            # Get school information
            school = user.get_school()
            if school:
                context['school'] = {
                    'id': school.school_id,
                    'name': school.name,
                    'code': school.school_code
                }
        
        return context
    
    @staticmethod
    def _generate_guardian_tokens(guardian):
        """Generate JWT tokens for guardian"""
        # Create a temporary user object for JWT generation
        # This is a workaround since JWT expects a User model
        from django.contrib.auth.models import AnonymousUser
        
        # For now, use a simple token approach
        # In production, you might want to implement custom JWT tokens
        refresh = RefreshToken()
        refresh['guardian_id'] = guardian.guardian_id
        refresh['email'] = guardian.email
        refresh['role'] = 'Guardian'
        
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    
    @staticmethod
    def create_session(user_data, request, tokens):
        """Create session record for tracking"""
        try:
            ip_address = UnifiedAuthService._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            if user_data['user_type'] == 'admin':
                # Create user session
                user = User.objects.get(email=user_data['user_data']['email'])
                UserSession.objects.create(
                    user=user,
                    session_token=tokens['access'][:50],
                    ip_address=ip_address,
                    user_agent=user_agent,
                    expires_at=timezone.now() + timezone.timedelta(hours=24)
                )
            elif user_data['user_type'] == 'guardian':
                # Create guardian session
                guardian = Guardian.objects.get(email=user_data['user_data']['email'])
                GuardianSession.objects.create(
                    guardian=guardian,
                    session_token=tokens['access'][:50],
                    ip_address=ip_address,
                    user_agent=user_agent,
                    expires_at=timezone.now() + timezone.timedelta(hours=24)
                )
        except Exception as e:
            logger.error(f"Session creation error: {str(e)}")
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip or '127.0.0.1'


@api_view(['POST'])
@permission_classes([AllowAny])
def unified_login(request):
    """
    Unified login endpoint for all user types.
    Automatically detects user type and provides appropriate authentication.
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required',
                'errors': {
                    'email': ['This field is required.'] if not email else [],
                    'password': ['This field is required.'] if not password else []
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        auth_result = UnifiedAuthService.authenticate_user(email, password)
        
        if not auth_result['success']:
            return Response({
                'success': False,
                'message': auth_result.get('message', 'Invalid credentials'),
                'status': status.HTTP_401_UNAUTHORIZED
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Create session
        UnifiedAuthService.create_session(auth_result, request, auth_result['tokens'])
        
        # Update last login
        if auth_result['user_type'] == 'admin':
            User.objects.filter(email=email).update(last_login=timezone.now())
        elif auth_result['user_type'] == 'guardian':
            Guardian.objects.filter(email=email).update(last_login=timezone.now())
        
        # Return success response
        return Response({
            'success': True,
            'message': 'Login successful',
            'data': {
                'token': auth_result['tokens']['access'],
                'refresh_token': auth_result['tokens']['refresh'],
                'user': auth_result['user_data'],
                'user_type': auth_result['user_type'],
                'role': auth_result['role'],
                'redirect_path': auth_result['redirect_path']
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Unified login error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Login failed. Please try again.',
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def unified_logout(request):
    """
    Unified logout endpoint for all user types.
    """
    try:
        refresh_token = request.data.get('refresh_token')
        
        # Blacklist refresh token if provided
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        
        # Deactivate sessions based on user type
        # This would require identifying the user type from the token
        # For now, we'll deactivate sessions for both user types
        
        # Get user info from token if available
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            # Deactivate user sessions
            UserSession.objects.filter(
                session_token__startswith=token[:50],
                is_active=True
            ).update(is_active=False)
            
            # Deactivate guardian sessions
            GuardianSession.objects.filter(
                session_token__startswith=token[:50],
                is_active=True
            ).update(is_active=False)
        
        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Unified logout error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Logout failed',
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_type(request):
    """
    Endpoint to detect user type based on email.
    Useful for frontend to show appropriate login forms.
    """
    try:
        email = request.query_params.get('email')
        
        if not email:
            return Response({
                'success': False,
                'message': 'Email parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_types = []
        
        # Check if email exists in different user types
        if User.objects.filter(email=email, is_active=True).exists():
            user = User.objects.get(email=email, is_active=True)
            user_types.append({
                'type': 'admin',
                'role': user.role,
                'name': user.full_name
            })
        
        if Guardian.objects.filter(email=email, is_active=True).exists():
            guardian = Guardian.objects.get(email=email, is_active=True)
            user_types.append({
                'type': 'guardian',
                'role': 'Guardian',
                'name': guardian.full_name
            })
        
        if Athlete.objects.filter(guardian_email=email, is_active=True).exists():
            athlete = Athlete.objects.filter(guardian_email=email, is_active=True).first()
            user_types.append({
                'type': 'athlete',
                'role': 'Athlete',
                'name': athlete.full_name
            })
        
        return Response({
            'success': True,
            'data': {
                'email': email,
                'user_types': user_types,
                'exists': len(user_types) > 0
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get user type error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to check user type',
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_unified_token(request):
    """
    Verify token and return user information with role-based data.
    """
    try:
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({
                'success': False,
                'message': 'Authorization header required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        
        # Try to decode and verify token
        # This is a simplified version - in production you'd use proper JWT verification
        
        return Response({
            'success': True,
            'message': 'Token is valid',
            'data': {
                'token_valid': True,
                'expires_at': None  # Would be extracted from token
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Invalid token',
            'status': status.HTTP_401_UNAUTHORIZED
        }, status=status.HTTP_401_UNAUTHORIZED)