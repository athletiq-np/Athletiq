"""
Views for notifications app.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from core.permissions.base import IsSuperAdminOrSchoolAdmin
from .models import NotificationTemplate, NotificationLog, NotificationPreference, GuardianClaim
from .serializers import (
    NotificationTemplateSerializer, NotificationLogSerializer,
    NotificationPreferenceSerializer, GuardianClaimSerializer,
    SendNotificationSerializer, ClaimVerificationSerializer,
    ClaimCompletionSerializer
)
from .services.notification_service import NotificationService
from .tasks import (
    send_email_task, send_sms_task, send_guardian_registration_notification_task
)

logger = logging.getLogger(__name__)


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notification templates."""
    
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['template_type', 'category', 'is_active']
    search_fields = ['name', 'subject', 'content']
    ordering_fields = ['name', 'template_type', 'category', 'created_at']
    ordering = ['-created_at']


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing notification logs."""
    
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_type', 'status', 'template__category']
    search_fields = ['recipient_email', 'recipient_phone', 'subject', 'external_id']
    ordering_fields = ['created_at', 'sent_at', 'delivered_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter logs based on user permissions."""
        queryset = super().get_queryset()
        
        # SuperAdmin can see all logs
        if self.request.user.role == 'SuperAdmin':
            return queryset.select_related('template')
        
        # SchoolAdmin can only see logs related to their school
        if self.request.user.role == 'SchoolAdmin':
            # Filter by school-related notifications
            return queryset.filter(
                # Add school-specific filtering logic here
                # For now, return all logs for SchoolAdmin
            ).select_related('template')
        
        return queryset.none()


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notification preferences."""
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return preferences for the current user."""
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create preferences for the current user."""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user,
            defaults={
                'preferred_email': self.request.user.email,
                'preferred_phone': getattr(self.request.user, 'phone', ''),
            }
        )
        return preferences
    
    @action(detail=False, methods=['get', 'patch'])
    def my_preferences(self, request):
        """Get or update current user's notification preferences."""
        preferences = self.get_object()
        
        if request.method == 'GET':
            serializer = self.get_serializer(preferences)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(preferences, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GuardianClaimViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for managing guardian claims."""
    
    queryset = GuardianClaim.objects.all()
    serializer_class = GuardianClaimSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'requires_school_approval', 'reminder_sent']
    search_fields = ['claim_code', 'athlete__full_name', 'guardian_email', 'guardian_phone']
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter claims based on user permissions."""
        queryset = super().get_queryset()
        
        # SuperAdmin can see all claims
        if self.request.user.role == 'SuperAdmin':
            return queryset.select_related('athlete', 'athlete__school')
        
        # SchoolAdmin can only see claims for their school's athletes
        if self.request.user.role == 'SchoolAdmin':
            user_school = getattr(self.request.user, 'school', None)
            if user_school:
                return queryset.filter(
                    athlete__school=user_school
                ).select_related('athlete', 'athlete__school')
        
        return queryset.none()
    
    @action(detail=False, methods=['post'])
    def verify_claim(self, request):
        """Verify a claim code and return athlete information."""
        serializer = ClaimVerificationSerializer(data=request.data)
        if serializer.is_valid():
            claim_code = serializer.validated_data['claim_code']
            
            notification_service = NotificationService()
            result = notification_service.verify_claim_code(claim_code)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def complete_claim(self, request):
        """Complete a guardian claim."""
        serializer = ClaimCompletionSerializer(data=request.data)
        if serializer.is_valid():
            notification_service = NotificationService()
            result = notification_service.complete_claim(
                claim_code=serializer.validated_data['claim_code'],
                guardian_data=serializer.validated_data
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)c
lass NotificationViewSet(viewsets.ViewSet):
    """ViewSet for sending notifications."""
    
    permission_classes = [IsAuthenticated, IsSuperAdminOrSchoolAdmin]
    
    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        """Send a notification via email, SMS, or both."""
        serializer = SendNotificationSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            results = []
            
            try:
                # Send email notification
                if data['notification_type'] in ['email', 'both']:
                    email_result = send_email_task.delay(
                        to_email=data['recipient_email'],
                        subject=data['subject'],
                        content=data['message'],
                        template_name=data.get('template_category'),
                        context=data.get('context_data', {}),
                        recipient_name=data.get('recipient_name')
                    )
                    results.append({
                        'type': 'email',
                        'task_id': email_result.id,
                        'status': 'queued'
                    })
                
                # Send SMS notification
                if data['notification_type'] in ['sms', 'both']:
                    sms_result = send_sms_task.delay(
                        to_phone=data['recipient_phone'],
                        message=data['message'],
                        template_name=data.get('template_category'),
                        context=data.get('context_data', {}),
                        recipient_name=data.get('recipient_name')
                    )
                    results.append({
                        'type': 'sms',
                        'task_id': sms_result.id,
                        'status': 'queued'
                    })
                
                return Response({
                    'success': True,
                    'message': 'Notifications queued successfully',
                    'results': results
                }, status=status.HTTP_202_ACCEPTED)
                
            except Exception as e:
                logger.error(f"Error queuing notifications: {str(e)}")
                return Response({
                    'success': False,
                    'error': str(e),
                    'message': 'Failed to queue notifications'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def send_guardian_registration(self, request):
        """Send guardian registration notification."""
        required_fields = ['athlete_id', 'full_name', 'guardian_email', 'guardian_phone']
        
        # Validate required fields
        missing_fields = [field for field in required_fields if not request.data.get(field)]
        if missing_fields:
            return Response({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'message': 'Invalid athlete data'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Queue guardian registration notification task
            task_result = send_guardian_registration_notification_task.delay(request.data)
            
            return Response({
                'success': True,
                'message': 'Guardian registration notification queued',
                'task_id': task_result.id
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"Error queuing guardian registration notification: {str(e)}")
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to queue guardian registration notification'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def task_status(self, request):
        """Get status of a notification task."""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({
                'success': False,
                'error': 'task_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from celery.result import AsyncResult
            
            result = AsyncResult(task_id)
            
            return Response({
                'success': True,
                'task_id': task_id,
                'status': result.status,
                'result': result.result if result.ready() else None
            })
            
        except Exception as e:
            logger.error(f"Error getting task status: {str(e)}")
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to get task status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)