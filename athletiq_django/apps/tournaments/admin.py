"""
Tournament admin configuration for Athletiq Django backend.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Tournament, TournamentTeam, TournamentPlayer, TournamentSport


class TournamentSportInline(admin.TabularInline):
    """Inline admin for tournament sports."""
    model = TournamentSport
    extra = 1
    fields = ['sport_name', 'category', 'age_group', 'gender', 'max_teams', 'min_teams', 'players_per_team']


class TournamentPlayerInline(admin.TabularInline):
    """Inline admin for tournament players."""
    model = TournamentPlayer
    extra = 0
    fields = ['player_id', 'player_name', 'jersey_number', 'position', 'is_captain', 'is_eligible']
    readonly_fields = ['player_id', 'player_name']


class TournamentTeamInline(admin.TabularInline):
    """Inline admin for tournament teams."""
    model = TournamentTeam
    extra = 0
    fields = ['team_id', 'team_name', 'registration_status', 'seed_order', 'contact_person']
    readonly_fields = ['team_id', 'team_name', 'registration_date']


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    """Admin configuration for Tournament model."""
    
    list_display = [
        'tournament_code', 'name', 'sport', 'level', 'status', 
        'start_date', 'end_date', 'registered_teams_count', 
        'is_published', 'created_at'
    ]
    
    list_filter = [
        'status', 'level', 'sport', 'organizer_type', 'format',
        'is_published', 'is_featured', 'gender', 'created_at'
    ]
    
    search_fields = [
        'name', 'tournament_code', 'description', 'sport', 
        'location', 'city', 'organizer_id__full_name'
    ]
    
    readonly_fields = [
        'tournament_id', 'tournament_code', 'created_at', 'updated_at',
        'registered_teams_count', 'pending_teams_count'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'tournament_id', 'tournament_code', 'name', 'description',
                'sport', 'level', 'status'
            )
        }),
        ('Dates', {
            'fields': (
                'start_date', 'end_date', 'registration_deadline'
            )
        }),
        ('Team Configuration', {
            'fields': (
                'max_teams', 'min_teams', 'max_players_per_team',
                'format'
            )
        }),
        ('Location', {
            'fields': (
                'location', 'address', 'city', 'country'
            )
        }),
        ('Organization', {
            'fields': (
                'organizer_id', 'organizer_type', 'created_by'
            )
        }),
        ('Competition Details', {
            'fields': (
                'rules', 'prize_details', 'entry_fee', 'prize_pool',
                'age_group', 'gender', 'category'
            )
        }),
        ('Publication', {
            'fields': (
                'is_published', 'is_featured', 'visibility', 'logo_url'
            )
        }),
        ('Configuration', {
            'fields': (
                'sports_config',
            ),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': (
                'registered_teams_count', 'pending_teams_count'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    inlines = [TournamentSportInline, TournamentTeamInline]
    
    actions = ['publish_tournaments', 'unpublish_tournaments', 'feature_tournaments']
    
    def registered_teams_count(self, obj):
        """Get count of registered teams."""
        count = obj.tournament_teams.filter(registration_status='registered').count()
        if count > 0:
            url = reverse('admin:tournaments_tournamentteam_changelist')
            return format_html(
                '<a href="{}?tournament__id={}&registration_status=registered">{}</a>',
                url, obj.id, count
            )
        return count
    registered_teams_count.short_description = 'Registered Teams'
    
    def pending_teams_count(self, obj):
        """Get count of pending teams."""
        count = obj.tournament_teams.filter(registration_status='pending').count()
        if count > 0:
            url = reverse('admin:tournaments_tournamentteam_changelist')
            return format_html(
                '<a href="{}?tournament__id={}&registration_status=pending">{}</a>',
                url, obj.id, count
            )
        return count
    pending_teams_count.short_description = 'Pending Teams'
    
    def publish_tournaments(self, request, queryset):
        """Bulk action to publish tournaments."""
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} tournaments were published.')
    publish_tournaments.short_description = 'Publish selected tournaments'
    
    def unpublish_tournaments(self, request, queryset):
        """Bulk action to unpublish tournaments."""
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} tournaments were unpublished.')
    unpublish_tournaments.short_description = 'Unpublish selected tournaments'
    
    def feature_tournaments(self, request, queryset):
        """Bulk action to feature tournaments."""
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} tournaments were featured.')
    feature_tournaments.short_description = 'Feature selected tournaments'


@admin.register(TournamentTeam)
class TournamentTeamAdmin(admin.ModelAdmin):
    """Admin configuration for TournamentTeam model."""
    
    list_display = [
        'team_name', 'tournament', 'registration_status', 'seed_order',
        'registration_date', 'player_count', 'contact_person'
    ]
    
    list_filter = [
        'registration_status', 'tournament__sport', 'tournament__level',
        'registration_date', 'confirmed_date'
    ]
    
    search_fields = [
        'team_name', 'tournament__name', 'contact_person', 'contact_email'
    ]
    
    readonly_fields = [
        'registration_date', 'confirmed_date', 'player_count'
    ]
    
    fieldsets = (
        ('Team Information', {
            'fields': (
                'tournament', 'team_id', 'team_name', 'school_id'
            )
        }),
        ('Registration', {
            'fields': (
                'registration_status', 'registration_date', 'confirmed_date',
                'seed_order', 'group_assignment'
            )
        }),
        ('Contact Information', {
            'fields': (
                'contact_person', 'contact_phone', 'contact_email'
            )
        }),
        ('Additional Information', {
            'fields': (
                'notes', 'registration_data'
            ),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': (
                'player_count',
            ),
            'classes': ('collapse',)
        })
    )
    
    inlines = [TournamentPlayerInline]
    
    actions = ['approve_registrations', 'reject_registrations']
    
    def player_count(self, obj):
        """Get count of players in the team."""
        return obj.players.count()
    player_count.short_description = 'Players'
    
    def approve_registrations(self, request, queryset):
        """Bulk action to approve team registrations."""
        from django.utils import timezone
        updated = queryset.update(
            registration_status='registered',
            confirmed_date=timezone.now()
        )
        self.message_user(request, f'{updated} team registrations were approved.')
    approve_registrations.short_description = 'Approve selected registrations'
    
    def reject_registrations(self, request, queryset):
        """Bulk action to reject team registrations."""
        updated = queryset.update(registration_status='rejected')
        self.message_user(request, f'{updated} team registrations were rejected.')
    reject_registrations.short_description = 'Reject selected registrations'


@admin.register(TournamentPlayer)
class TournamentPlayerAdmin(admin.ModelAdmin):
    """Admin configuration for TournamentPlayer model."""
    
    list_display = [
        'player_name', 'tournament_team', 'jersey_number', 'position',
        'is_captain', 'is_eligible'
    ]
    
    list_filter = [
        'is_captain', 'is_vice_captain', 'is_eligible', 'position',
        'tournament_team__tournament__sport'
    ]
    
    search_fields = [
        'player_name', 'tournament_team__team_name', 
        'tournament_team__tournament__name'
    ]
    
    fieldsets = (
        ('Player Information', {
            'fields': (
                'tournament_team', 'player_id', 'player_name'
            )
        }),
        ('Team Role', {
            'fields': (
                'jersey_number', 'position', 'is_captain', 'is_vice_captain'
            )
        }),
        ('Eligibility', {
            'fields': (
                'is_eligible', 'eligibility_notes'
            )
        }),
        ('Additional Data', {
            'fields': (
                'registration_data',
            ),
            'classes': ('collapse',)
        })
    )


@admin.register(TournamentSport)
class TournamentSportAdmin(admin.ModelAdmin):
    """Admin configuration for TournamentSport model."""
    
    list_display = [
        'sport_name', 'tournament', 'category', 'age_group', 'gender',
        'max_teams', 'format'
    ]
    
    list_filter = [
        'sport_name', 'gender', 'format', 'tournament__level'
    ]
    
    search_fields = [
        'sport_name', 'tournament__name', 'category', 'age_group'
    ]
    
    fieldsets = (
        ('Sport Information', {
            'fields': (
                'tournament', 'sport_name', 'category', 'age_group', 'gender'
            )
        }),
        ('Team Configuration', {
            'fields': (
                'max_teams', 'min_teams', 'players_per_team'
            )
        }),
        ('Competition Format', {
            'fields': (
                'format', 'rules', 'prize_details'
            )
        }),
        ('Configuration', {
            'fields': (
                'sport_config',
            ),
            'classes': ('collapse',)
        })
    )