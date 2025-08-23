"""
Test data factories for consistent test data generation.
"""
import factory
import factory.fuzzy
from django.contrib.auth import get_user_model
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for User model."""
    
    class Meta:
        model = User
    
    full_name = factory.Faker('name')
    email = factory.Faker('email')
    role = factory.fuzzy.FuzzyChoice(['SuperAdmin', 'SchoolAdmin', 'Coach', 'Referee'])
    is_active = True
    password_hash = factory.LazyFunction(lambda: '$2b$10$test.hash.for.testing')


class SchoolFactory(factory.django.DjangoModelFactory):
    """Factory for School model."""
    
    class Meta:
        model = 'schools.School'
    
    school_code = factory.Sequence(lambda n: f'SCH{n:04d}')
    name = factory.Faker('company')
    address = factory.Faker('address')
    country = 'Rwanda'
    province = factory.Faker('state')
    district = factory.Faker('city')
    city = factory.Faker('city')
    ward = factory.Faker('random_int', min=1, max=10)
    phone = factory.Faker('phone_number')
    email = factory.Faker('email')
    website = factory.Faker('url')
    principal_name = factory.Faker('name')
    admin_user = factory.SubFactory(UserFactory, role='SchoolAdmin')
    onboarding_status = 'completed'


class GuardianFactory(factory.django.DjangoModelFactory):
    """Factory for Guardian model."""
    
    class Meta:
        model = 'guardians.Guardian'
    
    full_name = factory.Faker('name')
    email = factory.Faker('email')
    phone = factory.Faker('phone_number')
    password_hash = factory.LazyFunction(lambda: '$2b$10$test.hash.for.testing')
    address = factory.Faker('address')
    city = factory.Faker('city')
    province = factory.Faker('state')
    district = factory.Faker('city')
    verification_status = 'verified'
    email_verified = True
    phone_verified = True


class AthleteFactory(factory.django.DjangoModelFactory):
    """Factory for Athlete model."""
    
    class Meta:
        model = 'athletes.Athlete'
    
    athlete_id = factory.Sequence(lambda n: f'NP-{n:07d}')
    full_name = factory.Faker('name')
    full_name_nepali = factory.Faker('name')
    date_of_birth = factory.Faker('date_of_birth', minimum_age=10, maximum_age=25)
    gender = factory.fuzzy.FuzzyChoice(['Male', 'Female'])
    nationality = 'Nepali'
    school = factory.SubFactory(SchoolFactory)
    guardian = factory.SubFactory(GuardianFactory)
    grade = factory.fuzzy.FuzzyChoice(['6', '7', '8', '9', '10', '11', '12'])
    section = factory.fuzzy.FuzzyChoice(['A', 'B', 'C'])
    guardian_name = factory.SelfAttribute('guardian.full_name')
    relationship_to_player = factory.fuzzy.FuzzyChoice(['Father', 'Mother', 'Guardian'])
    guardian_phone = factory.SelfAttribute('guardian.phone')
    guardian_email = factory.SelfAttribute('guardian.email')
    address = factory.Faker('address')
    province = factory.Faker('state')
    district = factory.Faker('city')
    height_cm = factory.fuzzy.FuzzyInteger(140, 200)
    weight_kg = factory.fuzzy.FuzzyDecimal(30.0, 100.0, 1)
    blood_group = factory.fuzzy.FuzzyChoice(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    registered_sports = factory.LazyFunction(lambda: ['Football', 'Basketball'])
    primary_sport = 'Football'
    registration_status = 'active'
    profile_completion = 85
    profile_status = 'complete'
    verification_status = 'verified'
    document_verified = True


class TournamentFactory(factory.django.DjangoModelFactory):
    """Factory for Tournament model."""
    
    class Meta:
        model = 'tournaments.Tournament'
    
    tournament_code = factory.Sequence(lambda n: f'TMT{n:05d}')
    name = factory.Faker('catch_phrase')
    description = factory.Faker('text')
    sport = factory.fuzzy.FuzzyChoice(['Football', 'Basketball', 'Volleyball', 'Cricket'])
    level = factory.fuzzy.FuzzyChoice(['school', 'district', 'provincial', 'national'])
    start_date = factory.Faker('future_date', end_date='+30d')
    end_date = factory.LazyAttribute(lambda obj: obj.start_date + timedelta(days=7))
    registration_deadline = factory.LazyAttribute(lambda obj: obj.start_date - timedelta(days=3))
    max_teams = factory.fuzzy.FuzzyInteger(8, 32)
    min_teams = 4
    max_players_per_team = factory.fuzzy.FuzzyInteger(11, 25)
    location = factory.Faker('city')
    address = factory.Faker('address')
    city = factory.Faker('city')
    country = 'Nepal'
    organizer_id = factory.SubFactory(UserFactory, role='SuperAdmin')
    organizer_type = 'school'
    created_by = factory.SelfAttribute('organizer_id')
    status = 'upcoming'
    format = factory.fuzzy.FuzzyChoice(['knockout', 'league', 'group_stage'])
    entry_fee = factory.fuzzy.FuzzyDecimal(0, 1000, 2)
    prize_pool = factory.fuzzy.FuzzyDecimal(0, 10000, 2)
    age_group = factory.fuzzy.FuzzyChoice(['U-15', 'U-17', 'U-19', 'Open'])
    gender = factory.fuzzy.FuzzyChoice(['male', 'female', 'mixed'])
    category = factory.fuzzy.FuzzyChoice(['Junior', 'Senior', 'Open'])


class TournamentTeamFactory(factory.django.DjangoModelFactory):
    """Factory for TournamentTeam model."""
    
    class Meta:
        model = 'tournaments.TournamentTeam'
    
    tournament = factory.SubFactory(TournamentFactory)
    team_id = factory.Sequence(lambda n: n)
    team_name = factory.Faker('company')
    school_id = factory.SelfAttribute('tournament.organizer_id.id')
    registration_status = 'registered'
    seed_order = factory.Sequence(lambda n: n)
    contact_person = factory.Faker('name')
    contact_phone = factory.Faker('phone_number')
    contact_email = factory.Faker('email')


class DocumentFactory(factory.django.DjangoModelFactory):
    """Factory for Document model."""
    
    class Meta:
        model = 'documents.Document'
    
    title = factory.Faker('sentence', nb_words=4)
    description = factory.Faker('text')
    file_path = factory.Faker('file_path', depth=2, extension='pdf')
    file_type = 'pdf'
    file_size = factory.fuzzy.FuzzyInteger(1024, 1024*1024)
    uploaded_by = factory.SubFactory(UserFactory)
    is_public = False
    document_type = factory.fuzzy.FuzzyChoice(['certificate', 'scoresheet', 'report'])


class NotificationLogFactory(factory.django.DjangoModelFactory):
    """Factory for creating test notification logs."""
    
    class Meta:
        model = 'notifications.NotificationLog'
    
    notification_type = factory.Iterator(['email', 'sms'])
    recipient_email = factory.Faker('email')
    recipient_phone = factory.Faker('phone_number')
    recipient_name = factory.Faker('name')
    subject = factory.Faker('sentence', nb_words=4)
    content = factory.Faker('text', max_nb_chars=200)
    status = factory.Iterator(['pending', 'sent', 'delivered', 'failed'])


class NotificationTemplateFactory(factory.django.DjangoModelFactory):
    """Factory for creating test notification templates."""
    
    class Meta:
        model = 'notifications.NotificationTemplate'
    
    name = factory.Faker('sentence', nb_words=3)
    template_type = factory.Iterator(['email', 'sms'])
    category = factory.Iterator(['guardian_registration', 'athlete_registration', 'tournament_notification'])
    subject = factory.Faker('sentence', nb_words=4)
    content = factory.Faker('text', max_nb_chars=500)
    is_active = True
    priority = factory.fuzzy.FuzzyChoice(['low', 'medium', 'high', 'urgent'])


class GoogleServiceUsageFactory(factory.django.DjangoModelFactory):
    """Factory for GoogleServiceUsage model."""
    
    class Meta:
        model = 'google_services.GoogleServiceUsage'
    
    service_type = factory.Iterator(['vision', 'translate', 'maps'])
    operation = factory.Faker('word')
    request_count = factory.fuzzy.FuzzyInteger(1, 10)
    success = True
    processing_time = factory.fuzzy.FuzzyFloat(0.1, 5.0)
    user = factory.SubFactory(UserFactory)


class TranslationCacheFactory(factory.django.DjangoModelFactory):
    """Factory for TranslationCache model."""
    
    class Meta:
        model = 'google_services.TranslationCache'
    
    source_text = factory.Faker('text', max_nb_chars=100)
    source_language = factory.Iterator(['en', 'fr', 'es', 'de'])
    target_language = factory.Iterator(['en', 'fr', 'es', 'de'])
    translated_text = factory.Faker('text', max_nb_chars=100)
    confidence = factory.fuzzy.FuzzyFloat(0.8, 1.0)
    user = factory.SubFactory(UserFactory)