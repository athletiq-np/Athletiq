"""
Token refresh handler for unified authentication system.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
import logging

from .models import User, UserSession
from apps.guardians.models import Guardian, GuardianSession

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def unified_token_refresh(request):
    """
    Unified token refresh endpoint that works for all user types.
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'success': False,
                'message': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Try to decode the refresh token
        try:
            token = RefreshToken(refresh_token)
            # Check if token is blacklisted
            if token.blacklisted():
                raise Exception("Token is blacklisted")
                
            # Get user info from token
            guardian_id = token.payload.get('guardian_id')
            
            if guardian_id:
                # This is a guardian token
                try:
                    guardian = Guardian.objects.get(guardian_id=guardian_id)
                    # Generate new tokens
                    new_refresh = RefreshToken()
                    new_refresh['guardian_id'] = guardian.guardian_id
                    new_refresh['email'] = guardian.email
                    new_refresh['role'] = 'Guardian'
                    
                    access_token = str(new_refresh.access_token)
                    refresh_token = str(new_refresh)
                    
                    # Update session record if exists
                    GuardianSession.objects.filter(
                        guardian=guardian,
                        is_active=True,
                        session_token__startswith=str(token.access_token)[:50]
                    ).update(
                        session_token=access_token[:50],
                        expires_at=timezone.now() + timezone.timedelta(hours=24)
                    )
                    
                except Guardian.DoesNotExist:
                    raise Exception("Guardian not found")
            else:
                # This is a regular user token
                new_token = token.access_token
                user_id = token.payload.get('user_id')
                
                try:
                    user = User.objects.get(id=user_id)
                    access_token = str(new_token)
                    refresh_token = str(RefreshToken.for_user(user))
                    
                    # Update session record if exists
                    UserSession.objects.filter(
                        user=user,
                        is_active=True,
                        session_token__startswith=str(token.access_token)[:50]
                    ).update(
                        session_token=access_token[:50],
                        expires_at=timezone.now() + timezone.timedelta(hours=24)
                    )
                    
                except User.DoesNotExist:
                    raise Exception("User not found")
            
            # Return new tokens
            return Response({
                'success': True,
                'message': 'Token refreshed successfully',
                'data': {
                    'token': access_token,
                    'refresh': refresh_token
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Invalid or expired refresh token',
                'status': status.HTTP_401_UNAUTHORIZED
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        logger.error(f"Unified token refresh error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Token refresh failed',
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
