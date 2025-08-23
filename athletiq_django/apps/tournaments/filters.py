"""
Tournament filters for Athletiq Django backend.
"""
import django_filters
from django.db.models import Q
from .models import Tournament, TournamentTeam


class TournamentFilter(django_filters.FilterSet):
    """
    Filter class for Tournament model with comprehensive filtering options.
    """
    
    # Text search across multiple fields
    search = django_filters.CharFilter(method='filter_search', label='Search')
    
    # Date range filters
    start_date_from = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_from = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_to = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    
    # Status filters
    status = django_filters.MultipleChoiceFilter(
        choices=Tournament.STATUS_CHOICES,
        field_name='status',
        lookup_expr='in'
    )
    
    # Sport and category filters
    sport = django_filters.CharFilter(field_name='sport', lookup_expr='icontains')
    sports = django_filters.BaseInFilter(field_name='sport', lookup_expr='in')
    level = django_filters.MultipleChoiceFilter(
        choices=Tournament.LEVEL_CHOICES,
        field_name='level',
        lookup_expr='in'
    )
    
    # Location filters
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    country = django_filters.CharFilter(field_name='country', lookup_expr='icontains')
    location = django_filters.CharFilter(field_name='location', lookup_expr='icontains')
    
    # Age and gender filters
    age_group = django_filters.CharFilter(field_name='age_group', lookup_expr='icontains')
    gender = django_filters.CharFilter(field_name='gender', lookup_expr='exact')
    category = django_filters.CharFilter(field_name='category', lookup_expr='icontains')
    
    # Organizer filters
    organizer_type = django_filters.MultipleChoiceFilter(
        choices=Tournament.ORGANIZER_TYPE_CHOICES,
        field_name='organizer_type',
        lookup_expr='in'
    )
    organizer_id = django_filters.NumberFilter(field_name='organizer_id')
    created_by = django_filters.NumberFilter(field_name='created_by')
    
    # Publication and visibility filters
    is_published = django_filters.BooleanFilter(field_name='is_published')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    visibility = django_filters.CharFilter(field_name='visibility', lookup_expr='exact')
    
    # Registration status filters
    registration_open = django_filters.BooleanFilter(method='filter_registration_open')
    
    # Team capacity filters
    has_available_slots = django_filters.BooleanFilter(method='filter_available_slots')
    min_teams_gte = django_filters.NumberFilter(field_name='min_teams', lookup_expr='gte')
    max_teams_lte = django_filters.NumberFilter(field_name='max_teams', lookup_expr='lte')
    
    # Entry fee filters
    entry_fee_min = django_filters.NumberFilter(field_name='entry_fee', lookup_expr='gte')
    entry_fee_max = django_filters.NumberFilter(field_name='entry_fee', lookup_expr='lte')
    free_entry = django_filters.BooleanFilter(method='filter_free_entry')
    
    # Prize pool filters
    prize_pool_min = django_filters.NumberFilter(field_name='prize_pool', lookup_expr='gte')
    prize_pool_max = django_filters.NumberFilter(field_name='prize_pool', lookup_expr='lte')
    
    # Format filter
    format = django_filters.MultipleChoiceFilter(
        choices=Tournament.FORMAT_CHOICES,
        field_name='format',
        lookup_expr='in'
    )
    
    class Meta:
        model = Tournament
        fields = []  # We define all filters explicitly above
    
    def filter_search(self, queryset, name, value):
        """
        Search across multiple fields.
        """
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value) |
            Q(sport__icontains=value) |
            Q(location__icontains=value) |
            Q(city__icontains=value) |
            Q(tournament_code__icontains=value) |
            Q(category__icontains=value)
        )
    
    def filter_registration_open(self, queryset, name, value):
        """
        Filter tournaments by registration status.
        """
        if value is None:
            return queryset
        
        from django.utils import timezone
        today = timezone.now().date()
        
        if value:
            # Registration is open
            return queryset.filter(
                Q(registration_deadline__isnull=True, status__in=['draft', 'upcoming']) |
                Q(registration_deadline__gte=today, status__in=['draft', 'upcoming'])
            )
        else:
            # Registration is closed
            return queryset.filter(
                Q(registration_deadline__lt=today) |
                Q(status__in=['ongoing', 'completed', 'cancelled'])
            )
    
    def filter_available_slots(self, queryset, name, value):
        """
        Filter tournaments that have available team slots.
        """
        if value is None:
            return queryset
        
        if value:
            # Has available slots
            return queryset.filter(
                Q(max_teams__isnull=True) |  # No limit
                Q(max_teams__gt=models.Count('tournament_teams'))  # Has space
            )
        else:
            # No available slots (full)
            return queryset.filter(
                max_teams__isnull=False,
                max_teams__lte=models.Count('tournament_teams')
            )
    
    def filter_free_entry(self, queryset, name, value):
        """
        Filter tournaments by entry fee (free vs paid).
        """
        if value is None:
            return queryset
        
        if value:
            # Free tournaments
            return queryset.filter(entry_fee=0)
        else:
            # Paid tournaments
            return queryset.filter(entry_fee__gt=0)


class TournamentTeamFilter(django_filters.FilterSet):
    """
    Filter class for TournamentTeam model.
    """
    
    # Tournament filters
    tournament = django_filters.NumberFilter(field_name='tournament_id')
    tournament_code = django_filters.CharFilter(
        field_name='tournament__tournament_code',
        lookup_expr='iexact'
    )
    
    # Team filters
    team_id = django_filters.NumberFilter(field_name='team_id')
    team_name = django_filters.CharFilter(field_name='team_name', lookup_expr='icontains')
    school_id = django_filters.NumberFilter(field_name='school_id')
    
    # Registration status filters
    registration_status = django_filters.MultipleChoiceFilter(
        choices=TournamentTeam.STATUS_CHOICES,
        field_name='registration_status',
        lookup_expr='in'
    )
    
    # Date filters
    registration_date_from = django_filters.DateTimeFilter(
        field_name='registration_date',
        lookup_expr='gte'
    )
    registration_date_to = django_filters.DateTimeFilter(
        field_name='registration_date',
        lookup_expr='lte'
    )
    
    # Group and seed filters
    group_assignment = django_filters.CharFilter(
        field_name='group_assignment',
        lookup_expr='exact'
    )
    has_seed_order = django_filters.BooleanFilter(
        field_name='seed_order',
        lookup_expr='isnull',
        exclude=True
    )
    
    # Contact filters
    contact_person = django_filters.CharFilter(
        field_name='contact_person',
        lookup_expr='icontains'
    )
    
    class Meta:
        model = TournamentTeam
        fields = []  # We define all filters explicitly above