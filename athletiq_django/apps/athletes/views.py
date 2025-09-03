"""
Enhanced views for athlete management system with comprehensive functionality.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Avg
from django.http import HttpResponse
from django.core.exceptions import ValidationError
import csv
import json
from datetime import datetime

from .models import Athlete
from .serializers import (
    AthleteListSerializer, AthleteDetailSerializer, 
    AthleteCreateSerializer, AthleteUpdateSerializer,
    AthleteBulkCreateSerializer, AthleteExportSerializer
)
from core.pagination import StandardResultsSetPagination
from core.utils.responses import success_response, error_response
from core.permissions.base import IsSchoolAdminOrSuperAdmin


class AthleteListCreateView(generics.ListCreateAPIView):
    """
    List athletes with advanced filtering and create new athletes.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter athletes based on user role and permissions with advanced filtering."""
        user = self.request.user
        queryset = Athlete.objects.select_related('school').filter(is_active=True)
        
        # Role-based filtering
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        # Search functionality
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(full_name_nepali__icontains=search) |
                Q(athlete_id__icontains=search) |
                Q(citizenship_no__icontains=search) |
                Q(guardian_name__icontains=search) |
                Q(school__name__icontains=search)
            )
        
        # Filter by school
        school_id = self.request.query_params.get('school_id')
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by registration status
        registration_status = self.request.query_params.get('registration_status')
        if registration_status:
            queryset = queryset.filter(registration_status=registration_status)
        
        # Filter by verification status
        verification_status = self.request.query_params.get('verification_status')
        if verification_status:
            queryset = queryset.filter(verification_status=verification_status)
        
        # Filter by gender
        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)
        
        # Filter by grade
        grade = self.request.query_params.get('grade')
        if grade:
            queryset = queryset.filter(grade=grade)
        
        # Filter by age range
        min_age = self.request.query_params.get('min_age')
        max_age = self.request.query_params.get('max_age')
        if min_age or max_age:
            from datetime import date, timedelta
            today = date.today()
            
            if max_age:
                min_birth_date = today - timedelta(days=int(max_age) * 365.25)
                queryset = queryset.filter(date_of_birth__gte=min_birth_date)
            
            if min_age:
                max_birth_date = today - timedelta(days=int(min_age) * 365.25)
                queryset = queryset.filter(date_of_birth__lte=max_birth_date)
        
        # Filter by sport
        sport = self.request.query_params.get('sport')
        if sport:
            queryset = queryset.filter(
                Q(primary_sport__icontains=sport) |
                Q(registered_sports__contains=[sport])
            )
        
        # Filter by profile completion
        min_completion = self.request.query_params.get('min_completion')
        if min_completion:
            queryset = queryset.filter(profile_completion__gte=int(min_completion))
        
        # Sorting
        ordering = self.request.query_params.get('ordering', '-created_at')
        valid_orderings = [
            'full_name', '-full_name', 'athlete_id', '-athlete_id',
            'date_of_birth', '-date_of_birth', 'created_at', '-created_at',
            'profile_completion', '-profile_completion', 'verification_status'
        ]
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.request.method == 'POST':
            return AthleteCreateSerializer
        return AthleteListSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new athlete."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set created_by to current user
        serializer.validated_data['created_by'] = request.user
        
        athlete = serializer.save()
        
        response_serializer = AthleteDetailSerializer(athlete)
        return Response(
            success_response(
                data=response_serializer.data,
                message="Athlete registered successfully."
            ),
            status=status.HTTP_201_CREATED
        )


class AthleteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete an athlete.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter athletes based on user permissions."""
        user = self.request.user
        queryset = Athlete.objects.select_related('school', 'guardian')
        
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.request.method in ['PUT', 'PATCH']:
            return AthleteUpdateSerializer
        return AthleteDetailSerializer
    
    def update(self, request, *args, **kwargs):
        """Update athlete information."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        athlete = serializer.save()
        
        response_serializer = AthleteDetailSerializer(athlete)
        return Response(
            success_response(
                data=response_serializer.data,
                message="Athlete updated successfully."
            )
        )
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete an athlete."""
        instance = self.get_object()
        instance.soft_delete()
        
        return Response(
            success_response(message="Athlete deleted successfully."),
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['POST'])
@permission_classes([IsSchoolAdminOrSuperAdmin])
def bulk_create_athletes(request):
    """
    Bulk create athletes from uploaded data.
    """
    try:
        serializer = AthleteBulkCreateSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            
            return Response(
                success_response(
                    data=result,
                    message=f"Bulk operation completed. {result['success_count']} athletes created, {result['error_count']} errors."
                ),
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                error_response(
                    message="Invalid data provided.",
                    errors=serializer.errors
                ),
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            error_response(message=f"Bulk creation failed: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_athletes(request):
    """
    Export athletes data to CSV format.
    """
    try:
        user = request.user
        queryset = Athlete.objects.select_related('school', 'guardian').filter(is_active=True)
        
        # Apply same filtering as list view
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        # Apply filters from query parameters
        school_id = request.GET.get('school_id')
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        registration_status = request.GET.get('registration_status')
        if registration_status:
            queryset = queryset.filter(registration_status=registration_status)
        
        verification_status = request.GET.get('verification_status')
        if verification_status:
            queryset = queryset.filter(verification_status=verification_status)
        
        # Serialize data
        serializer = AthleteExportSerializer(queryset, many=True)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="athletes_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        if serializer.data:
            writer = csv.DictWriter(response, fieldnames=serializer.data[0].keys())
            writer.writeheader()
            for row in serializer.data:
                writer.writerow(row)
        
        return response
        
    except Exception as e:
        return Response(
            error_response(message=f"Export failed: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def athlete_statistics(request):
    """
    Get athlete statistics and analytics.
    """
    try:
        user = request.user
        queryset = Athlete.objects.filter(is_active=True)
        
        # Apply role-based filtering
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        # Basic counts
        total_athletes = queryset.count()
        verified_athletes = queryset.filter(verification_status='verified').count()
        pending_athletes = queryset.filter(verification_status='pending').count()
        active_athletes = queryset.filter(registration_status='active').count()
        
        # Gender distribution
        gender_stats = queryset.values('gender').annotate(count=Count('id'))
        
        # Grade distribution
        grade_stats = queryset.exclude(grade__isnull=True).values('grade').annotate(count=Count('id'))
        
        # School distribution (for SuperAdmin)
        school_stats = []
        if user.role == 'SuperAdmin':
            school_stats = queryset.values('school__name').annotate(count=Count('id')).order_by('-count')[:10]
        
        # Profile completion stats
        avg_completion = queryset.aggregate(avg_completion=Avg('profile_completion'))['avg_completion'] or 0
        completion_ranges = {
            'incomplete': queryset.filter(profile_completion__lt=50).count(),
            'partial': queryset.filter(profile_completion__gte=50, profile_completion__lt=80).count(),
            'complete': queryset.filter(profile_completion__gte=80).count(),
        }
        
        # Age distribution
        from datetime import date
        today = date.today()
        age_stats = []
        for athlete in queryset.filter(date_of_birth__isnull=False):
            age = today.year - athlete.date_of_birth.year - (
                (today.month, today.day) < (athlete.date_of_birth.month, athlete.date_of_birth.day)
            )
            age_stats.append(age)
        
        age_ranges = {
            '5-10': len([age for age in age_stats if 5 <= age <= 10]),
            '11-15': len([age for age in age_stats if 11 <= age <= 15]),
            '16-20': len([age for age in age_stats if 16 <= age <= 20]),
            '21-25': len([age for age in age_stats if 21 <= age <= 25]),
        }
        
        statistics = {
            'total_athletes': total_athletes,
            'verified_athletes': verified_athletes,
            'pending_athletes': pending_athletes,
            'active_athletes': active_athletes,
            'verification_rate': round((verified_athletes / total_athletes * 100) if total_athletes > 0 else 0, 2),
            'average_profile_completion': round(avg_completion, 2),
            'gender_distribution': {item['gender']: item['count'] for item in gender_stats},
            'grade_distribution': {item['grade']: item['count'] for item in grade_stats},
            'school_distribution': [{'school': item['school__name'], 'count': item['count']} for item in school_stats],
            'completion_ranges': completion_ranges,
            'age_ranges': age_ranges,
        }
        
        return Response(
            success_response(
                data=statistics,
                message="Statistics retrieved successfully."
            )
        )
        
    except Exception as e:
        return Response(
            error_response(message=f"Failed to get statistics: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def recalculate_profile_completion(request, athlete_id):
    """
    Recalculate profile completion for a specific athlete.
    """
    try:
        user = request.user
        queryset = Athlete.objects.all()
        
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        athlete = queryset.get(id=athlete_id)
        old_completion = athlete.profile_completion
        new_completion = athlete.calculate_profile_completion()
        
        return Response(
            success_response(
                data={
                    'athlete_id': athlete.athlete_id,
                    'old_completion': old_completion,
                    'new_completion': new_completion
                },
                message="Profile completion recalculated successfully."
            )
        )
        
    except Athlete.DoesNotExist:
        return Response(
            error_response(message="Athlete not found."),
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            error_response(message=f"Failed to recalculate: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==========================================
# ADDITIONAL ATHLETE MANAGEMENT ENDPOINTS
# ==========================================

@api_view(['POST'])
@permission_classes([IsSchoolAdminOrSuperAdmin])
def bulk_update_athletes(request):
    """
    Bulk update athlete information.
    """
    try:
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response(
                error_response(message="No updates provided."),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(updates) > 100:
            return Response(
                error_response(message="Cannot update more than 100 athletes at once."),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        updated_athletes = []
        errors = []
        
        for i, update_data in enumerate(updates):
            try:
                athlete_id = update_data.get('athlete_id')
                if not athlete_id:
                    errors.append({
                        'index': i,
                        'error': 'athlete_id is required'
                    })
                    continue
                
                # Get athlete with permission check
                queryset = Athlete.objects.all()
                if user.role == 'SchoolAdmin':
                    queryset = queryset.filter(school=user.school)
                
                athlete = queryset.get(id=athlete_id)
                
                # Update fields
                update_fields = update_data.copy()
                update_fields.pop('athlete_id', None)
                
                serializer = AthleteUpdateSerializer(athlete, data=update_fields, partial=True)
                if serializer.is_valid():
                    updated_athlete = serializer.save()
                    updated_athletes.append(updated_athlete.id)
                else:
                    errors.append({
                        'index': i,
                        'athlete_id': athlete_id,
                        'errors': serializer.errors
                    })
                    
            except Athlete.DoesNotExist:
                errors.append({
                    'index': i,
                    'athlete_id': update_data.get('athlete_id'),
                    'error': 'Athlete not found'
                })
            except Exception as e:
                errors.append({
                    'index': i,
                    'athlete_id': update_data.get('athlete_id'),
                    'error': str(e)
                })
        
        return Response(
            success_response(
                data={
                    'updated_athletes': updated_athletes,
                    'errors': errors,
                    'success_count': len(updated_athletes),
                    'error_count': len(errors)
                },
                message=f"Bulk update completed. {len(updated_athletes)} athletes updated, {len(errors)} errors."
            )
        )
        
    except Exception as e:
        return Response(
            error_response(message=f"Bulk update failed: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsSchoolAdminOrSuperAdmin])
def bulk_verify_athletes(request):
    """
    Bulk verify athlete documents and profiles.
    """
    try:
        athlete_ids = request.data.get('athlete_ids', [])
        verification_status = request.data.get('verification_status', 'verified')
        notes = request.data.get('notes', '')
        
        if not athlete_ids:
            return Response(
                error_response(message="No athlete IDs provided."),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if verification_status not in ['verified', 'rejected', 'requires_review']:
            return Response(
                error_response(message="Invalid verification status."),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        queryset = Athlete.objects.all()
        
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        athletes = queryset.filter(id__in=athlete_ids)
        updated_count = 0
        
        for athlete in athletes:
            athlete.verification_status = verification_status
            if verification_status == 'verified':
                athlete.document_verified = True
            elif verification_status == 'rejected':
                athlete.document_verified = False
                athlete.requires_manual_review = True
            
            athlete.save(update_fields=['verification_status', 'document_verified', 'requires_manual_review'])
            updated_count += 1
        
        return Response(
            success_response(
                data={
                    'updated_count': updated_count,
                    'verification_status': verification_status
                },
                message=f"Successfully updated verification status for {updated_count} athletes."
            )
        )
        
    except Exception as e:
        return Response(
            error_response(message=f"Bulk verification failed: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_athletes(request):
    """
    Advanced athlete search with multiple criteria.
    """
    try:
        user = request.user
        queryset = Athlete.objects.select_related('school', 'guardian').filter(is_active=True)
        
        # Apply role-based filtering
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        # Search query
        query = request.query_params.get('q', '').strip()
        if query:
            queryset = queryset.filter(
                Q(full_name__icontains=query) |
                Q(full_name_nepali__icontains=query) |
                Q(athlete_id__icontains=query) |
                Q(citizenship_no__icontains=query) |
                Q(guardian_name__icontains=query)
            )
        
        # Advanced filters
        filters = {}
        
        # School filter
        schools = request.query_params.getlist('schools')
        if schools:
            queryset = queryset.filter(school_id__in=schools)
        
        # Status filters
        statuses = request.query_params.getlist('registration_status')
        if statuses:
            queryset = queryset.filter(registration_status__in=statuses)
        
        verification_statuses = request.query_params.getlist('verification_status')
        if verification_statuses:
            queryset = queryset.filter(verification_status__in=verification_statuses)
        
        # Gender filter
        genders = request.query_params.getlist('gender')
        if genders:
            queryset = queryset.filter(gender__in=genders)
        
        # Grade filter
        grades = request.query_params.getlist('grade')
        if grades:
            queryset = queryset.filter(grade__in=grades)
        
        # Age range filter
        min_age = request.query_params.get('min_age')
        max_age = request.query_params.get('max_age')
        if min_age or max_age:
            from datetime import date, timedelta
            today = date.today()
            
            if max_age:
                min_birth_date = today - timedelta(days=int(max_age) * 365.25)
                queryset = queryset.filter(date_of_birth__gte=min_birth_date)
            
            if min_age:
                max_birth_date = today - timedelta(days=int(min_age) * 365.25)
                queryset = queryset.filter(date_of_birth__lte=max_birth_date)
        
        # Sport filter
        sports = request.query_params.getlist('sports')
        if sports:
            sport_q = Q()
            for sport in sports:
                sport_q |= Q(primary_sport__icontains=sport) | Q(registered_sports__contains=[sport])
            queryset = queryset.filter(sport_q)
        
        # Profile completion filter
        min_completion = request.query_params.get('min_completion')
        if min_completion:
            queryset = queryset.filter(profile_completion__gte=int(min_completion))
        
        # Document verification filter
        document_verified = request.query_params.get('document_verified')
        if document_verified is not None:
            queryset = queryset.filter(document_verified=document_verified.lower() == 'true')
        
        # Ordering
        order_by = request.query_params.get('order_by', '-created_at')
        valid_order_fields = [
            'full_name', '-full_name', 'athlete_id', '-athlete_id',
            'date_of_birth', '-date_of_birth', 'created_at', '-created_at',
            'profile_completion', '-profile_completion'
        ]
        if order_by in valid_order_fields:
            queryset = queryset.order_by(order_by)
        else:
            queryset = queryset.order_by('-created_at')
        
        # Pagination
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = AthleteListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = AthleteListSerializer(queryset, many=True)
        return Response(
            success_response(
                data=serializer.data,
                message="Athlete search completed successfully."
            )
        )
        
    except Exception as e:
        return Response(
            error_response(message=f"Search failed: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_athlete_documents(request, athlete_id):
    """
    Get athlete document information and verification status.
    """
    try:
        user = request.user
        queryset = Athlete.objects.all()
        
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        athlete = queryset.get(id=athlete_id)
        
        documents = {
            'profile_photo': {
                'url': athlete.profile_photo_url,
                'uploaded': bool(athlete.profile_photo_url),
                'verified': athlete.document_verified
            },
            'birth_certificate': {
                'url': athlete.birth_certificate_url,
                'uploaded': bool(athlete.birth_certificate_url),
                'verified': athlete.birth_certificate_verified,
                'certificate_no': athlete.birth_certificate_no,
                'certificate_date': athlete.birth_certificate_date,
                'certificate_office': athlete.birth_certificate_office
            },
            'verification_status': athlete.verification_status,
            'document_verified': athlete.document_verified,
            'requires_manual_review': athlete.requires_manual_review
        }
        
        return Response(
            success_response(
                data=documents,
                message="Athlete documents retrieved successfully."
            )
        )
        
    except Athlete.DoesNotExist:
        return Response(
            error_response(message="Athlete not found."),
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            error_response(message=f"Failed to get documents: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_athlete_document(request, athlete_id):
    """
    Upload athlete document (profile photo or birth certificate).
    """
    try:
        user = request.user
        queryset = Athlete.objects.all()
        
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        athlete = queryset.get(id=athlete_id)
        
        document_type = request.data.get('document_type')
        document_url = request.data.get('document_url')
        
        if not document_type or not document_url:
            return Response(
                error_response(message="document_type and document_url are required."),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if document_type == 'profile_photo':
            athlete.profile_photo_url = document_url
        elif document_type == 'birth_certificate':
            athlete.birth_certificate_url = document_url
            athlete.birth_certificate_no = request.data.get('certificate_no', '')
            athlete.birth_certificate_date = request.data.get('certificate_date')
            athlete.birth_certificate_office = request.data.get('certificate_office', '')
        else:
            return Response(
                error_response(message="Invalid document type. Must be 'profile_photo' or 'birth_certificate'."),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset verification status when new documents are uploaded
        athlete.verification_status = 'pending'
        athlete.document_verified = False
        
        athlete.save()
        athlete.calculate_profile_completion()
        
        return Response(
            success_response(
                data={
                    'athlete_id': athlete.athlete_id,
                    'document_type': document_type,
                    'document_url': document_url,
                    'verification_status': athlete.verification_status
                },
                message="Document uploaded successfully."
            )
        )
        
    except Athlete.DoesNotExist:
        return Response(
            error_response(message="Athlete not found."),
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            error_response(message=f"Document upload failed: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsSchoolAdminOrSuperAdmin])
def verify_athlete_document(request, athlete_id):
    """
    Verify or reject athlete documents.
    """
    try:
        user = request.user
        queryset = Athlete.objects.all()
        
        if user.role == 'SchoolAdmin':
            queryset = queryset.filter(school=user.school)
        
        athlete = queryset.get(id=athlete_id)
        
        verification_status = request.data.get('verification_status')
        document_type = request.data.get('document_type', 'all')
        notes = request.data.get('notes', '')
        
        if verification_status not in ['verified', 'rejected', 'requires_review']:
            return Response(
                error_response(message="Invalid verification status."),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update verification status
        athlete.verification_status = verification_status
        
        if verification_status == 'verified':
            athlete.document_verified = True
            athlete.requires_manual_review = False
            if document_type == 'birth_certificate' or document_type == 'all':
                athlete.birth_certificate_verified = True
        elif verification_status == 'rejected':
            athlete.document_verified = False
            athlete.requires_manual_review = True
            if document_type == 'birth_certificate' or document_type == 'all':
                athlete.birth_certificate_verified = False
        else:  # requires_review
            athlete.requires_manual_review = True
        
        athlete.save()
        
        return Response(
            success_response(
                data={
                    'athlete_id': athlete.athlete_id,
                    'verification_status': athlete.verification_status,
                    'document_verified': athlete.document_verified,
                    'requires_manual_review': athlete.requires_manual_review
                },
                message="Document verification updated successfully."
            )
        )
        
    except Athlete.DoesNotExist:
        return Response(
            error_response(message="Athlete not found."),
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            error_response(message=f"Document verification failed: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_athletes_by_school(request, school_id):
    """
    Get all athletes for a specific school.
    """
    try:
        user = request.user
        
        # Permission check
        if user.role == 'SchoolAdmin' and user.school.school_id != school_id:
            return Response(
                error_response(message="Permission denied."),
                status=status.HTTP_403_FORBIDDEN
            )
        
        athletes = Athlete.objects.filter(
            school_id=school_id,
            is_active=True
        ).select_related('school', 'guardian')
        
        # Apply filters
        registration_status = request.query_params.get('registration_status')
        if registration_status:
            athletes = athletes.filter(registration_status=registration_status)
        
        verification_status = request.query_params.get('verification_status')
        if verification_status:
            athletes = athletes.filter(verification_status=verification_status)
        
        # Pagination
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(athletes, request)
        
        if page is not None:
            serializer = AthleteListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = AthleteListSerializer(athletes, many=True)
        return Response(
            success_response(
                data=serializer.data,
                message="School athletes retrieved successfully."
            )
        )
        
    except Exception as e:
        return Response(
            error_response(message=f"Failed to get school athletes: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_athletes_list_view(request):
    """
    SuperAdmin view to list all athletes with advanced filtering.
    """
    from core.permissions import IsSuperAdmin
    
    # Check if user is SuperAdmin
    if not IsSuperAdmin().has_permission(request, None):
        return Response(
            error_response(message="Permission denied. SuperAdmin access required."),
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        athletes = Athlete.objects.select_related('school').all().order_by('-created_at')
        
        # Apply filters
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        verification_filter = request.GET.get('verification', '')
        school_filter = request.GET.get('school', '')
        gender_filter = request.GET.get('gender', '')
        
        if search:
            athletes = athletes.filter(
                Q(full_name__icontains=search) |
                Q(full_name_nepali__icontains=search) |
                Q(athlete_id__icontains=search) |
                Q(citizenship_no__icontains=search) |
                Q(guardian_name__icontains=search) |
                Q(school__name__icontains=search)
            )
        
        if status_filter:
            is_active = status_filter.lower() == 'active'
            athletes = athletes.filter(is_active=is_active)
            
        if verification_filter:
            athletes = athletes.filter(verification_status=verification_filter)
            
        if school_filter:
            athletes = athletes.filter(school_id=school_filter)
            
        if gender_filter:
            athletes = athletes.filter(gender=gender_filter)
        
        # Serialize athletes data
        athletes_data = []
        for athlete in athletes:
            athletes_data.append({
                'id': athlete.id,
                'athlete_id': athlete.athlete_id,
                'full_name': athlete.full_name,
                'full_name_nepali': athlete.full_name_nepali,
                'gender': athlete.gender,
                'date_of_birth': athlete.date_of_birth.isoformat() if athlete.date_of_birth else None,
                'school': {
                    'id': athlete.school.school_id if athlete.school else None,
                    'name': athlete.school.name if athlete.school else None,
                } if athlete.school else None,
                'guardian_name': athlete.guardian_name,
                'guardian_phone': athlete.guardian_phone,
                'verification_status': athlete.verification_status,
                'profile_completion': athlete.profile_completion,
                'is_active': athlete.is_active,
                'created_at': athlete.created_at.isoformat() if athlete.created_at else None,
                'updated_at': athlete.updated_at.isoformat() if athlete.updated_at else None,
            })
        
        return Response({
            'success': True,
            'data': athletes_data,
            'message': f'Retrieved {len(athletes_data)} athletes'
        })
        
    except Exception as e:
        return Response(
            error_response(message=f"Failed to get athletes: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_delete_athletes(request):
    """
    Bulk delete athletes (soft delete).
    """
    from core.permissions import IsSuperAdmin
    
    # Check if user is SuperAdmin or SchoolAdmin
    if not (IsSuperAdmin().has_permission(request, None) or 
            getattr(request.user, 'role', None) == 'SchoolAdmin'):
        return Response(
            error_response(message="Permission denied. Admin access required."),
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        athlete_ids = request.data.get('athlete_ids', [])
        
        if not athlete_ids:
            return Response(
                error_response(message="No athlete IDs provided"),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get athletes to delete
        queryset = Athlete.objects.filter(id__in=athlete_ids)
        
        # If SchoolAdmin, restrict to their school
        if getattr(request.user, 'role', None) == 'SchoolAdmin':
            queryset = queryset.filter(school=request.user.school)
        
        deleted_count = 0
        for athlete in queryset:
            athlete.soft_delete()
            deleted_count += 1
        
        return Response({
            'success': True,
            'data': {
                'deleted_count': deleted_count,
                'requested_count': len(athlete_ids)
            },
            'message': f'Successfully deleted {deleted_count} athletes'
        })
        
    except Exception as e:
        return Response(
            error_response(message=f"Failed to delete athletes: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )