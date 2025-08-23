"""Pytest configuration and fixtures for the project."""
import pytest
from django.conf import settings
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

# Import your models here as needed
# from apps.athletes.models import Athlete
# from apps.schools.models import School
# from apps.tournaments.models import Tournament

User = get_user_model()

@pytest.fixture(scope='session')
def django_db_setup():
    """Override database settings for tests."""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

@pytest.fixture
def api_client():
    """API client fixture."""
    return APIClient()

@pytest.fixture
def authenticated_client(api_client, user):
    """Authenticated API client fixture."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def admin_client(api_client, admin_user):
    """Admin authenticated API client fixture."""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def user():
    """Regular user fixture."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        is_active=True
    )

@pytest.fixture
def admin_user():
    """Admin user fixture."""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        is_staff=True,
        is_superuser=True
    )

# Add more fixtures as needed for your models
# @pytest.fixture
# def athlete(user):
#     return Athlete.objects.create(
#         user=user,
#         first_name='Test',
#         last_name='Athlete',
#         date_of_birth='2000-01-01'
#     )

# @pytest.fixture
# def school():
#     return School.objects.create(
#         name='Test School',
#         address='123 Test St',
#         city='Test City',
#         country='Test Country'
#     )
