"""
Unit tests for schools models.
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.schools.models import School, SchoolHouse, SchoolStaff, SchoolNotification
from tests.factories import UserFactory, SchoolFactory


class SchoolModelTest(TestCase):
    """Test cases for School model."""
    
    def setUp(self):
        """Set up test data."""
        self.admin_user = UserFactory(role='SchoolAdmin')
  