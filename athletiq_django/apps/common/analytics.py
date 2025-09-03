"""
Global analytics module for SuperAdmin dashboard.
Provides comprehensive system-wide statistics and insights.
"""
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.tournaments.models import Tournament
from apps.organizations.models import Organization
from apps.guardians.models import Guardian


def get_global_analytics():
    """
    Get comprehensive global analytics for SuperAdmin dashboard.
    Returns detailed statistics across all entities.
    """
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # Athletes analytics
    total_athletes = Athlete.objects.count()
    active_athletes = Athlete.objects.filter(is_active=True).count()
    recent_athletes = Athlete.objects.filter(created_at__gte=thirty_days_ago).count()
    verified_athletes = Athlete.objects.filter(status='verified').count()
    pending_athletes = Athlete.objects.filter(status='pending').count()
    
    # Schools analytics
    total_schools = School.objects.count()
    active_schools = School.objects.filter(is_active=True).count()
    recent_schools = School.objects.filter(created_at__gte=thirty_days_ago).count()
    verified_schools = School.objects.filter(verification_status='verified').count()
    
    # Organizations analytics
    total_organizations = Organization.objects.count()
    active_organizations = Organization.objects.filter(is_active=True).count()
    recent_organizations = Organization.objects.filter(created_at__gte=thirty_days_ago).count()
    verified_organizations = Organization.objects.filter(verification_status='verified').count()
    
    # Guardians analytics
    total_guardians = Guardian.objects.count()
    active_guardians = Guardian.objects.filter(is_active=True).count()
    recent_guardians = Guardian.objects.filter(created_at__gte=thirty_days_ago).count()
    verified_guardians = Guardian.objects.filter(verification_status='verified').count()
    
    # Tournaments analytics
    total_tournaments = Tournament.objects.count()
    active_tournaments = Tournament.objects.filter(
        status__in=['scheduled', 'ongoing']
    ).count()
    recent_tournaments = Tournament.objects.filter(created_at__gte=thirty_days_ago).count()
    completed_tournaments = Tournament.objects.filter(status='completed').count()
    
    # Growth metrics
    previous_period_start = thirty_days_ago - timedelta(days=30)
    prev_athletes = Athlete.objects.filter(
        created_at__gte=previous_period_start,
        created_at__lt=thirty_days_ago
    ).count()
    
    athlete_growth_rate = 0
    if prev_athletes > 0:
        athlete_growth_rate = ((recent_athletes - prev_athletes) / prev_athletes) * 100
    
    # Activity metrics
    activity_metrics = {
        'athletes_registered_this_week': Athlete.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count(),
        'tournaments_created_this_week': Tournament.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count(),
        'schools_joined_this_week': School.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count(),
    }
    
    # Regional distribution (top 10 cities)
    city_distribution = list(
        Athlete.objects.values('city')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    
    # Age group distribution
    age_groups = {
        'under_12': Athlete.objects.filter(date_of_birth__gte=now.date() - timedelta(days=12*365)).count(),
        'age_12_15': Athlete.objects.filter(
            date_of_birth__gte=now.date() - timedelta(days=15*365),
            date_of_birth__lt=now.date() - timedelta(days=12*365)
        ).count(),
        'age_16_18': Athlete.objects.filter(
            date_of_birth__gte=now.date() - timedelta(days=18*365),
            date_of_birth__lt=now.date() - timedelta(days=16*365)
        ).count(),
        'over_18': Athlete.objects.filter(date_of_birth__lt=now.date() - timedelta(days=18*365)).count(),
    }
    
    return {
        'overview': {
            'total_athletes': total_athletes,
            'total_schools': total_schools,
            'total_organizations': total_organizations,
            'total_guardians': total_guardians,
            'total_tournaments': total_tournaments,
        },
        'athletes': {
            'total': total_athletes,
            'active': active_athletes,
            'recent': recent_athletes,
            'verified': verified_athletes,
            'pending': pending_athletes,
            'growth_rate': round(athlete_growth_rate, 2),
            'activity_rate': round((active_athletes / total_athletes * 100), 2) if total_athletes > 0 else 0,
        },
        'schools': {
            'total': total_schools,
            'active': active_schools,
            'recent': recent_schools,
            'verified': verified_schools,
            'verification_rate': round((verified_schools / total_schools * 100), 2) if total_schools > 0 else 0,
        },
        'organizations': {
            'total': total_organizations,
            'active': active_organizations,
            'recent': recent_organizations,
            'verified': verified_organizations,
            'verification_rate': round((verified_organizations / total_organizations * 100), 2) if total_organizations > 0 else 0,
        },
        'guardians': {
            'total': total_guardians,
            'active': active_guardians,
            'recent': recent_guardians,
            'verified': verified_guardians,
            'verification_rate': round((verified_guardians / total_guardians * 100), 2) if total_guardians > 0 else 0,
        },
        'tournaments': {
            'total': total_tournaments,
            'active': active_tournaments,
            'recent': recent_tournaments,
            'completed': completed_tournaments,
            'completion_rate': round((completed_tournaments / total_tournaments * 100), 2) if total_tournaments > 0 else 0,
        },
        'activity': activity_metrics,
        'demographics': {
            'city_distribution': city_distribution,
            'age_groups': age_groups,
        },
        'generated_at': now.isoformat(),
    }


def get_system_health():
    """
    Get system health metrics for monitoring.
    """
    now = timezone.now()
    
    # Check for any critical issues
    issues = []
    
    # Check for inactive entities
    inactive_schools = School.objects.filter(is_active=False).count()
    if inactive_schools > 0:
        issues.append(f"{inactive_schools} inactive schools")
    
    pending_verifications = (
        School.objects.filter(verification_status='pending').count() +
        Organization.objects.filter(verification_status='pending').count() +
        Guardian.objects.filter(verification_status='pending').count()
    )
    
    if pending_verifications > 10:
        issues.append(f"{pending_verifications} pending verifications")
    
    # Recent activity check
    recent_activity = Athlete.objects.filter(
        created_at__gte=now - timedelta(hours=24)
    ).count()
    
    return {
        'status': 'healthy' if len(issues) == 0 else 'warning' if len(issues) < 3 else 'critical',
        'issues': issues,
        'recent_activity': recent_activity,
        'pending_verifications': pending_verifications,
        'last_checked': now.isoformat(),
    }