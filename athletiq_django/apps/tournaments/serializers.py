"""
Tournament serializers for Athletiq Django backend.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Tournament, TournamentTeam, TournamentPlayer, TournamentSport

User = get_user_model()


class TournamentSportSerializer(serializers.ModelSerializer):
    """Serializer for tournament sports configuration."""
    
    class Meta:
        model = TournamentSport
        fields = [
            'id', 'sport_name', 'category', 'age_group', 'gender',
            'max_teams', 'min_teams', 'players_per_team', 'format',
            'rules', 'prize_details', 'sport_config'
        ]


class TournamentPlayerSerializer(serializers.ModelSerializer):
    """Serializer for tournament players."""
    
    class Meta:
        model = TournamentPlayer
        fields = [
            'id', 'player_id', 'player_name', 'jersey_number', 'position',
            'is_captain', 'is_vice_captain', 'is_eligible', 'eligibility_notes',
            'registration_data'
        ]


class TournamentTeamSerializer(serializers.ModelSerializer):
    """Serializer for tournament teams."""
    
    players = TournamentPlayerSerializer(many=True, read_only=True)
    player_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TournamentTeam
        fields = [
            'id', 'team_id', 'team_name', 'school_id', 'registration_status',
            'registration_date', 'confirmed_date', 'seed_order', 'group_assignment',
            'contact_person', 'contact_phone', 'contact_email', 'notes',
            'registration_data', 'players', 'player_count'
        ]
        read_only_fields = ['registration_date']
    
    def get_player_count(self, obj):
        """Get the number of players in the team."""
        return obj.players.count()


class TournamentListSerializer(serializers.ModelSerializer):
    """Serializer for tournament list view (minimal fields)."""
    
    organizer_name = serializers.CharField(source='organizer_id.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    registered_teams_count = serializers.SerializerMethodField()
    is_registration_open = serializers.ReadOnlyField()
    
    class Meta:
        model = Tournament
        fields = [
            'id', 'tournament_id', 'tournament_code', 'name', 'description',
            'sport', 'level', 'start_date', 'end_date', 'registration_deadline',
            'location', 'city', 'country', 'status', 'format', 'entry_fee',
            'prize_pool', 'age_group', 'gender', 'category', 'is_published',
            'is_featured', 'logo_url', 'organizer_name', 'created_by_name',
            'registered_teams_count', 'is_registration_open', 'created_at'
        ]
    
    def get_registered_teams_count(self, obj):
        """Get the number of registered teams."""
        return obj.tournament_teams.filter(registration_status='registered').count()


class TournamentDetailSerializer(serializers.ModelSerializer):
    """Serializer for tournament detail view (all fields)."""
    
    organizer_name = serializers.CharField(source='organizer_id.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    sports = TournamentSportSerializer(many=True, read_only=True)
    tournament_teams = TournamentTeamSerializer(many=True, read_only=True)
    registered_teams_count = serializers.SerializerMethodField()
    pending_teams_count = serializers.SerializerMethodField()
    is_registration_open = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    
    class Meta:
        model = Tournament
        fields = [
            'id', 'tournament_id', 'tournament_code', 'name', 'description',
            'sport', 'level', 'start_date', 'end_date', 'registration_deadline',
            'max_teams', 'min_teams', 'max_players_per_team', 'location',
            'address', 'city', 'country', 'organizer_id', 'organizer_type',
            'created_by', 'status', 'format', 'rules', 'prize_details',
            'entry_fee', 'prize_pool', 'age_group', 'gender', 'category',
            'is_published', 'is_featured', 'visibility', 'logo_url',
            'sports_config', 'organizer_name', 'created_by_name', 'sports',
            'tournament_teams', 'registered_teams_count', 'pending_teams_count',
            'is_registration_open', 'is_active', 'is_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['tournament_id', 'tournament_code', 'created_at', 'updated_at']
    
    def get_registered_teams_count(self, obj):
        """Get the number of registered teams."""
        return obj.tournament_teams.filter(registration_status='registered').count()
    
    def get_pending_teams_count(self, obj):
        """Get the number of pending teams."""
        return obj.tournament_teams.filter(registration_status='pending').count()


class TournamentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tournaments."""
    
    sports_config = serializers.JSONField(required=False, allow_null=True)
    
    class Meta:
        model = Tournament
        fields = [
            'name', 'description', 'sport', 'level', 'start_date', 'end_date',
            'registration_deadline', 'max_teams', 'min_teams', 'max_players_per_team',
            'location', 'address', 'city', 'country', 'organizer_id', 'organizer_type',
            'format', 'rules', 'prize_details', 'entry_fee', 'prize_pool',
            'age_group', 'gender', 'category', 'visibility', 'logo_url',
            'sports_config'
        ]
    
    def validate(self, data):
        """Validate tournament data."""
        # Validate dates
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError("End date must be after start date")
        
        if data.get('registration_deadline') and data.get('start_date'):
            if data['registration_deadline'] > data['start_date']:
                raise serializers.ValidationError("Registration deadline must be before start date")
        
        # Validate team limits
        if data.get('max_teams') and data.get('min_teams'):
            if data['max_teams'] < data['min_teams']:
                raise serializers.ValidationError("Maximum teams must be greater than or equal to minimum teams")
        
        return data
    
    def create(self, validated_data):
        """Create tournament with created_by field."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)


class TournamentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tournaments."""
    
    sports_config = serializers.JSONField(required=False, allow_null=True)
    
    class Meta:
        model = Tournament
        fields = [
            'name', 'description', 'sport', 'level', 'start_date', 'end_date',
            'registration_deadline', 'max_teams', 'min_teams', 'max_players_per_team',
            'location', 'address', 'city', 'country', 'organizer_id', 'organizer_type',
            'status', 'format', 'rules', 'prize_details', 'entry_fee', 'prize_pool',
            'age_group', 'gender', 'category', 'is_published', 'is_featured',
            'visibility', 'logo_url', 'sports_config'
        ]
    
    def validate(self, data):
        """Validate tournament update data."""
        instance = self.instance
        
        # Get current values if not in data
        start_date = data.get('start_date', instance.start_date)
        end_date = data.get('end_date', instance.end_date)
        registration_deadline = data.get('registration_deadline', instance.registration_deadline)
        min_teams = data.get('min_teams', instance.min_teams)
        max_teams = data.get('max_teams', instance.max_teams)
        
        # Validate dates
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError("End date must be after start date")
        
        if registration_deadline and start_date and registration_deadline > start_date:
            raise serializers.ValidationError("Registration deadline must be before start date")
        
        # Validate team limits
        if max_teams and min_teams and max_teams < min_teams:
            raise serializers.ValidationError("Maximum teams must be greater than or equal to minimum teams")
        
        # Prevent certain changes if tournament has started
        if instance.status in ['ongoing', 'completed']:
            restricted_fields = ['sport', 'format', 'min_teams', 'max_teams']
            for field in restricted_fields:
                if field in data and data[field] != getattr(instance, field):
                    raise serializers.ValidationError(
                        f"Cannot change {field} for {instance.status} tournament"
                    )
        
        return data


class TeamRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for team registration in tournaments."""
    
    players = TournamentPlayerSerializer(many=True, required=False)
    
    class Meta:
        model = TournamentTeam
        fields = [
            'team_id', 'team_name', 'school_id', 'contact_person',
            'contact_phone', 'contact_email', 'notes', 'registration_data',
            'players'
        ]
    
    def validate(self, data):
        """Validate team registration data."""
        tournament = self.context.get('tournament')
        
        if not tournament:
            raise serializers.ValidationError("Tournament context is required")
        
        # Check if registration is open
        if not tournament.is_registration_open:
            raise serializers.ValidationError("Registration is closed for this tournament")
        
        # Check if team is already registered
        if TournamentTeam.objects.filter(
            tournament=tournament, 
            team_id=data['team_id']
        ).exists():
            raise serializers.ValidationError("Team is already registered for this tournament")
        
        # Check team limits
        if tournament.max_teams:
            registered_count = tournament.tournament_teams.filter(
                registration_status__in=['registered', 'pending']
            ).count()
            if registered_count >= tournament.max_teams:
                raise serializers.ValidationError("Tournament has reached maximum team capacity")
        
        return data
    
    def create(self, validated_data):
        """Create team registration."""
        tournament = self.context.get('tournament')
        players_data = validated_data.pop('players', [])
        
        # Create tournament team
        tournament_team = TournamentTeam.objects.create(
            tournament=tournament,
            **validated_data
        )
        
        # Create tournament players
        for player_data in players_data:
            TournamentPlayer.objects.create(
                tournament_team=tournament_team,
                **player_data
            )
        
        return tournament_team


class TournamentStatsSerializer(serializers.Serializer):
    """Serializer for tournament statistics."""
    
    total_tournaments = serializers.IntegerField()
    active_tournaments = serializers.IntegerField()
    upcoming_tournaments = serializers.IntegerField()
    completed_tournaments = serializers.IntegerField()
    total_teams_registered = serializers.IntegerField()
    total_players_registered = serializers.IntegerField()
    sports_breakdown = serializers.DictField()
    level_breakdown = serializers.DictField()
    recent_tournaments = TournamentListSerializer(many=True)


class BulkTeamUpdateSerializer(serializers.Serializer):
    """Serializer for bulk team registration updates."""
    
    updates = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_updates(self, value):
        """Validate bulk update data."""
        valid_statuses = ['pending', 'registered', 'rejected', 'withdrawn']
        
        for update in value:
            if 'tournament_team_id' not in update:
                raise serializers.ValidationError("tournament_team_id is required for each update")
            
            if 'status' in update and update['status'] not in valid_statuses:
                raise serializers.ValidationError(f"Invalid status: {update['status']}")
        
        return value