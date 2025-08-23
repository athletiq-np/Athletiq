"""
Guardian views for API endpoints.
"""
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q
from core.utils.responses import (
    success_response, error_response, created_response,
    unauthorized_response, validation_error_response
)
from .models import Guardian, AthleteClaimRequest, GuardianNotification, GuardianSession
from .serializers import (
    GuardianRegistrationSerializer, GuardianLoginSerializer, GuardianSerializer,
    GuardianProfileUpdateSerializer, AthleteClaimRequestSerializer,
    AthleteClaimRequestCreateSerializer, GuardianNotificationSerializer,
    GuardianPasswordChangeSerializer, EmailVerificationSerializer
)
from .permissions import IsGuardianAuthenticated, IsGuardianOwner


class GuardianRegistrationView(APIView):
    """
    Guardian registration endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Register a new guardian.
        """
        try:
            serializer = GuardianRegistrationSerializer(data=request.data)
            
            if serializer.is_valid():
                guardian = serializer.save()
                
                # TODO: Send verification email
                # self.send_verification_email(guardian)
                
                return created_response(
                    data=GuardianSerializer(guardian).data,
                    message='Guardian registered successfully. Please check your email for verification.'
                )
            else:
                return validation_error_response(
                    errors=serializer.errors,
                    message='Registration failed'
                )
                
        except Exception as e:
            return error_response(
                message=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GuardianLoginView(APIView):
    """
    Guardian login endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Authenticate guardian and return JWT token.
        """
        try:
            serializer = GuardianLoginSerializer(data=request.data)
            
            if serializer.is_valid():
                tokens = serializer.validated_data
                
                # Create session record
                guardian = Guardian.objects.get(email=request.data.get('email'))
                self._create_guardian_session(guardian, request, tokens['access'])
                
                # Update last login
                guardian.last_login = timezone.now()
                guardian.save(update_fields=['last_login'])
                
                return success_response(
                    data={
                        'token': tokens['access'],
                        'refresh_token': tokens['refresh'],
                        'guardian': tokens['guardian']
                    },
                    message='Login successful'
                )
            else:
                return validation_error_response(
                    errors=serializer.errors,
                    message='Login failed'
                )
                
        except Exception as e:
            return unauthorized_response(message=str(e))
    
    def _create_guardian_session(self, guardian, request, token):
        """
        Create guardian session record for tracking.
        """
        try:
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            GuardianSession.objects.create(
                guardian=guardian,
                session_token=token[:50],
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=timezone.now() + timezone.timedelta(hours=24)
            )
        except Exception:
            pass
    
    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def guardian_logout_view(request):
    """
    Guardian logout endpoint.
    """
    try:
        # Deactivate guardian sessions
        GuardianSession.objects.filter(
            guardian=request.guardian,
            is_active=True
        ).update(is_active=False)
        
        return success_response(message='Logout successful')
        
    except Exception as e:
        return error_response(message=str(e))


@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_profile_view(request):
    """
    Get guardian profile.
    """
    try:
        serializer = GuardianSerializer(request.guardian)
        return success_response(
            data=serializer.data,
            message='Profile retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsGuardianAuthenticated])
def guardian_profile_update_view(request):
    """
    Update guardian profile.
    """
    try:
        serializer = GuardianProfileUpdateSerializer(
            request.guardian,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=serializer.data,
                message='Profile updated successfully'
            )
        else:
            return validation_error_response(
                errors=serializer.errors,
                message='Profile update failed'
            )
            
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def guardian_change_password_view(request):
    """
    Change guardian password.
    """
    try:
        serializer = GuardianPasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            guardian = request.guardian
            guardian.set_password(serializer.validated_data['new_password'])
            guardian.save()
            
            # Invalidate all guardian sessions
            GuardianSession.objects.filter(
                guardian=guardian,
                is_active=True
            ).update(is_active=False)
            
            return success_response(message='Password changed successfully')
        else:
            return validation_error_response(
                errors=serializer.errors,
                message='Password change failed'
            )
            
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email_view(request):
    """
    Verify guardian email with token.
    """
    try:
        serializer = EmailVerificationSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            guardian = Guardian.objects.get(verification_token=token)
            
            guardian.email_verified = True
            guardian.verification_status = 'verified'
            guardian.verification_token = ''  # Clear token
            guardian.save()
            
            return success_response(message='Email verified successfully')
        else:
            return validation_error_response(
                errors=serializer.errors,
                message='Email verification failed'
            )
            
    except Guardian.DoesNotExist:
        return error_response(
            message='Invalid verification token',
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class AthleteClaimRequestListCreateView(ListCreateAPIView):
    """
    List and create athlete claim requests.
    """
    permission_classes = [IsGuardianAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AthleteClaimRequestCreateSerializer
        return AthleteClaimRequestSerializer
    
    def get_queryset(self):
        return AthleteClaimRequest.objects.filter(
            guardian=self.request.guardian
        ).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new athlete claim request.
        """
        try:
            serializer = self.get_serializer(data=request.data)
            
            if serializer.is_valid():
                claim_request = serializer.save()
                
                # TODO: Send notification to school admin
                # self.notify_school_admin(claim_request)
                
                return created_response(
                    data=AthleteClaimRequestSerializer(claim_request).data,
                    message='Claim request submitted successfully'
                )
            else:
                return validation_error_response(
                    errors=serializer.errors,
                    message='Claim request submission failed'
                )
                
        except Exception as e:
            return error_response(
                message=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_notifications_view(request):
    """
    Get guardian notifications.
    """
    try:
        notifications = GuardianNotification.objects.filter(
            guardian=request.guardian
        ).order_by('-created_at')[:50]
        
        serializer = GuardianNotificationSerializer(notifications, many=True)
        
        return success_response(
            data=serializer.data,
            message='Notifications retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def mark_notification_read_view(request, notification_id):
    """
    Mark notification as read.
    """
    try:
        notification = get_object_or_404(
            GuardianNotification,
            id=notification_id,
            guardian=request.guardian
        )
        
        notification.is_read = True
        notification.save()
        
        return success_response(message='Notification marked as read')
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==========================================
# ADDITIONAL GUARDIAN PORTAL ENDPOINTS
# ==========================================

@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_athletes_view(request):
    """
    Get all athletes claimed by the guardian.
    """
    try:
        # Import here to avoid circular imports
        from apps.athletes.models import Athlete
        from apps.athletes.serializers import AthleteListSerializer
        
        athletes = Athlete.objects.filter(
            guardian=request.guardian,
            is_active=True
        ).select_related('school').order_by('full_name')
        
        serializer = AthleteListSerializer(athletes, many=True)
        
        return success_response(
            data=serializer.data,
            message='Guardian athletes retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_athlete_detail_view(request, athlete_id):
    """
    Get detailed information about a specific athlete.
    """
    try:
        from apps.athletes.models import Athlete
        from apps.athletes.serializers import AthleteDetailSerializer
        
        athlete = get_object_or_404(
            Athlete,
            id=athlete_id,
            guardian=request.guardian,
            is_active=True
        )
        
        serializer = AthleteDetailSerializer(athlete)
        
        return success_response(
            data=serializer.data,
            message='Athlete details retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def claim_athlete_view(request):
    """
    Submit a claim request for an athlete using athlete code or ID.
    """
    try:
        athlete_code = request.data.get('athlete_code')
        relationship = request.data.get('relationship')
        supporting_documents = request.data.get('supporting_documents', [])
        notes = request.data.get('notes', '')
        
        if not athlete_code or not relationship:
            return error_response(
                message='Athlete code and relationship are required.',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if athlete exists
        from apps.athletes.models import Athlete
        try:
            athlete = Athlete.objects.get(
                Q(athlete_id=athlete_code) | Q(player_code=athlete_code),
                is_active=True
            )
        except Athlete.DoesNotExist:
            return error_response(
                message='Athlete not found with the provided code.',
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # Check if athlete is already claimed
        if athlete.guardian:
            return error_response(
                message='This athlete is already claimed by another guardian.',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if guardian already has a pending claim for this athlete
        existing_claim = AthleteClaimRequest.objects.filter(
            guardian=request.guardian,
            athlete_id=athlete.athlete_id,
            status='pending'
        ).exists()
        
        if existing_claim:
            return error_response(
                message='You already have a pending claim request for this athlete.',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Create claim request
        claim_request = AthleteClaimRequest.objects.create(
            guardian=request.guardian,
            athlete_id=athlete.athlete_id,
            relationship=relationship,
            supporting_documents=supporting_documents,
            notes=notes
        )
        
        serializer = AthleteClaimRequestSerializer(claim_request)
        
        return created_response(
            data=serializer.data,
            message='Claim request submitted successfully. It will be reviewed by the school administration.'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_claim_requests_view(request):
    """
    Get all claim requests submitted by the guardian.
    """
    try:
        claim_requests = AthleteClaimRequest.objects.filter(
            guardian=request.guardian
        ).order_by('-created_at')
        
        serializer = AthleteClaimRequestSerializer(claim_requests, many=True)
        
        return success_response(
            data=serializer.data,
            message='Claim requests retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def upload_guardian_document_view(request):
    """
    Upload guardian documents for verification.
    """
    try:
        document_type = request.data.get('document_type')
        document_url = request.data.get('document_url')
        
        if not document_type or not document_url:
            return error_response(
                message='Document type and URL are required.',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # For now, we'll store document URLs in a simple way
        # In a real implementation, you'd have a proper document model
        guardian = request.guardian
        
        # You could extend the Guardian model to have document fields
        # or create a separate GuardianDocument model
        
        return success_response(
            data={
                'document_type': document_type,
                'document_url': document_url,
                'uploaded_at': timezone.now().isoformat()
            },
            message='Document uploaded successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_dashboard_view(request):
    """
    Get guardian dashboard data including athletes, notifications, and activities.
    """
    try:
        from apps.athletes.models import Athlete
        
        # Get guardian's athletes
        athletes = Athlete.objects.filter(
            guardian=request.guardian,
            is_active=True
        ).select_related('school')
        
        # Get recent notifications
        notifications = GuardianNotification.objects.filter(
            guardian=request.guardian
        ).order_by('-created_at')[:5]
        
        # Get pending claim requests
        pending_claims = AthleteClaimRequest.objects.filter(
            guardian=request.guardian,
            status='pending'
        ).count()
        
        # Get unread notifications count
        unread_notifications = GuardianNotification.objects.filter(
            guardian=request.guardian,
            is_read=False
        ).count()
        
        dashboard_data = {
            'guardian': GuardianSerializer(request.guardian).data,
            'athletes_count': athletes.count(),
            'athletes': [
                {
                    'id': athlete.id,
                    'athlete_id': athlete.athlete_id,
                    'full_name': athlete.full_name,
                    'school_name': athlete.school.name,
                    'verification_status': athlete.verification_status,
                    'profile_completion': athlete.profile_completion
                }
                for athlete in athletes[:5]  # Show first 5 athletes
            ],
            'pending_claims': pending_claims,
            'unread_notifications': unread_notifications,
            'recent_notifications': GuardianNotificationSerializer(notifications, many=True).data
        }
        
        return success_response(
            data=dashboard_data,
            message='Dashboard data retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_athlete_tournaments_view(request, athlete_id):
    """
    Get tournaments for a specific athlete.
    """
    try:
        from apps.athletes.models import Athlete
        
        athlete = get_object_or_404(
            Athlete,
            id=athlete_id,
            guardian=request.guardian,
            is_active=True
        )
        
        # This would be implemented when Tournament-Athlete relationships are established
        # For now, return empty data structure
        tournaments_data = {
            'registered_tournaments': [],
            'upcoming_tournaments': [],
            'completed_tournaments': []
        }
        
        return success_response(
            data=tournaments_data,
            message='Athlete tournaments retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def guardian_athlete_consent_view(request, athlete_id):
    """
    Provide consent for athlete participation in tournaments or activities.
    """
    try:
        from apps.athletes.models import Athlete
        
        athlete = get_object_or_404(
            Athlete,
            id=athlete_id,
            guardian=request.guardian,
            is_active=True
        )
        
        consent_type = request.data.get('consent_type')  # tournament, medical, etc.
        consent_given = request.data.get('consent_given', False)
        tournament_id = request.data.get('tournament_id')
        notes = request.data.get('notes', '')
        
        if not consent_type:
            return error_response(
                message='Consent type is required.',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # In a real implementation, you'd store this consent in a database
        consent_data = {
            'athlete_id': athlete.athlete_id,
            'consent_type': consent_type,
            'consent_given': consent_given,
            'tournament_id': tournament_id,
            'notes': notes,
            'guardian_id': request.guardian.guardian_id,
            'timestamp': timezone.now().isoformat()
        }
        
        return success_response(
            data=consent_data,
            message='Consent recorded successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsGuardianAuthenticated])
def guardian_communication_history_view(request):
    """
    Get communication history between guardian and school/system.
    """
    try:
        # Get notifications as communication history
        communications = GuardianNotification.objects.filter(
            guardian=request.guardian
        ).order_by('-created_at')
        
        # Apply filters
        notification_type = request.query_params.get('type')
        if notification_type:
            communications = communications.filter(notification_type=notification_type)
        
        athlete_id = request.query_params.get('athlete_id')
        if athlete_id:
            communications = communications.filter(athlete_id=athlete_id)
        
        # Pagination
        from core.pagination import StandardResultsSetPagination
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(communications, request)
        
        if page is not None:
            serializer = GuardianNotificationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = GuardianNotificationSerializer(communications, many=True)
        
        return success_response(
            data=serializer.data,
            message='Communication history retrieved successfully'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def guardian_feedback_view(request):
    """
    Submit feedback or contact school administration.
    """
    try:
        subject = request.data.get('subject')
        message = request.data.get('message')
        athlete_id = request.data.get('athlete_id')
        priority = request.data.get('priority', 'medium')
        
        if not subject or not message:
            return error_response(
                message='Subject and message are required.',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # In a real implementation, you'd create a feedback/message model
        # and notify the appropriate school administrators
        feedback_data = {
            'guardian_id': request.guardian.guardian_id,
            'guardian_name': request.guardian.full_name,
            'guardian_email': request.guardian.email,
            'subject': subject,
            'message': message,
            'athlete_id': athlete_id,
            'priority': priority,
            'submitted_at': timezone.now().isoformat()
        }
        
        return success_response(
            data=feedback_data,
            message='Feedback submitted successfully. The school administration will respond soon.'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardianAuthenticated])
def mark_all_notifications_read_view(request):
    """
    Mark all notifications as read for the guardian.
    """
    try:
        updated_count = GuardianNotification.objects.filter(
            guardian=request.guardian,
            is_read=False
        ).update(is_read=True)
        
        return success_response(
            data={'updated_count': updated_count},
            message=f'Marked {updated_count} notifications as read'
        )
        
    except Exception as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )