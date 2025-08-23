"""
Authentication views for API endpoints.
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout
from django.utils import timezone
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    PasswordChangeSerializer
)
from .models import User, UserSession


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns response in format expected by frontend.
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """
        Handle login request and return formatted response.
        """
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            tokens = serializer.validated_data
            
            # Create session record
            user = User.objects.get(email=request.data.get('email'))
            self._create_user_session(user, request, tokens['access'])
            
            # Return response in expected format
            return Response({
                'success': True,
                'message': 'Login successful',
                'data': {
                    'token': tokens['access'],
                    'refresh_token': tokens['refresh'],
                    'user': tokens['user']
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'status': status.HTTP_401_UNAUTHORIZED
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    def _create_user_session(self, user, request, token):
        """
        Create user session record for tracking.
        """
        try:
            # Get client IP
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Create session
            UserSession.objects.create(
                user=user,
                session_token=token[:50],  # Store partial token for identification
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=timezone.now() + timezone.timedelta(hours=24)
            )
        except Exception:
            # Don't fail login if session creation fails
            pass
    
    def _get_client_ip(self, request):
        """
        Get client IP address from request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view with formatted response.
    """
    
    def post(self, request, *args, **kwargs):
        """
        Handle token refresh request.
        """
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                return Response({
                    'success': True,
                    'message': 'Token refreshed successfully',
                    'data': {
                        'token': response.data['access']
                    }
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Token refresh failed',
                    'status': response.status_code
                }, status=response.status_code)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'status': status.HTTP_401_UNAUTHORIZED
            }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout view that blacklists the refresh token.
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Deactivate user sessions
        UserSession.objects.filter(
            user=request.user,
            is_active=True
        ).update(is_active=False)
        
        logout(request)
        
        return Response({
            'success': True,
            'message': 'Logout successful'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e),
            'status': status.HTTP_400_BAD_REQUEST
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    Get current user profile.
    """
    try:
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'message': 'Profile retrieved successfully',
            'data': serializer.data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e),
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """
    Update current user profile.
    """
    try:
        serializer = UserSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'data': serializer.data
            })
        else:
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors,
                'status': status.HTTP_400_BAD_REQUEST
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e),
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    Change user password.
    """
    try:
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Change password
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Invalidate all user sessions
            UserSession.objects.filter(
                user=user,
                is_active=True
            ).update(is_active=False)
            
            return Response({
                'success': True,
                'message': 'Password changed successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors,
                'status': status.HTTP_400_BAD_REQUEST
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e),
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verify_token_view(request):
    """
    Verify if the current token is valid.
    """
    try:
        return Response({
            'success': True,
            'message': 'Token is valid',
            'data': {
                'user': UserSerializer(request.user).data,
                'expires_at': request.auth.payload.get('exp')
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e),
            'status': status.HTTP_401_UNAUTHORIZED
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Get CSRF token for the current session.
    This endpoint is used by the frontend to get a valid CSRF token.
    """
    try:
        # This will set the CSRF cookie if not already set
        token = get_token(request)
        
        if not token:
            logger.warning('Failed to generate CSRF token')
            return Response(
                {'success': False, 'message': 'Failed to generate CSRF token'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response = Response(
            {'success': True, 'csrfToken': token},
            status=status.HTTP_200_OK
        )
        
        # Explicitly set CSRF cookie with secure settings
        response.set_cookie(
            'csrftoken',
            token,
            httponly=False,  # Must be accessible via JS
            samesite='Lax',  # Lax is more secure than None
            secure=request.is_secure(),  # True if using HTTPS
            path='/',  # Make cookie available on all paths
        )
        
        # Add security headers
        response['X-CSRFToken'] = token
        response['Access-Control-Allow-Credentials'] = 'true'
        
        return response
        
    except Exception as e:
        logger.error(f'Error in get_csrf_token: {str(e)}', exc_info=True)
        return Response(
            {'success': False, 'message': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )