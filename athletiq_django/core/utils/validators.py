"""
Custom validators for data validation.
"""
import re
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator as DjangoEmailValidator


def validate_phone_number(value):
    """
    Validate phone number format.
    Accepts various international formats.
    """
    if not value:
        return
    
    # Remove spaces, dashes, and parentheses
    cleaned = re.sub(r'[\s\-\(\)]', '', value)
    
    # Check if it's a valid phone number pattern
    phone_pattern = r'^\+?[1-9]\d{1,14}$'
    
    if not re.match(phone_pattern, cleaned):
        raise ValidationError(
            'Enter a valid phone number.',
            code='invalid_phone'
        )


def validate_school_code(value):
    """
    Validate school code format.
    Should be alphanumeric and 6-20 characters.
    """
    if not value:
        return
    
    if not re.match(r'^[A-Z0-9]{6,20}$', value):
        raise ValidationError(
            'School code must be 6-20 characters long and contain only uppercase letters and numbers.',
            code='invalid_school_code'
        )


def validate_tournament_code(value):
    """
    Validate tournament code format.
    """
    if not value:
        return
    
    if not re.match(r'^[A-Z0-9]{3,15}$', value):
        raise ValidationError(
            'Tournament code must be 3-15 characters long and contain only uppercase letters and numbers.',
            code='invalid_tournament_code'
        )


def validate_athlete_id(value):
    """
    Validate athlete ID format.
    Format: [COUNTRY][YY][4 Random] e.g., NP25X7A9
    """
    if not value:
        return
    
    if not re.match(r'^[A-Z]{2}\d{2}[A-Z0-9]{4}$', value):
        raise ValidationError(
            'Athlete ID must follow format: 2 letters + 2 digits + 4 alphanumeric characters (e.g., NP25X7A9).',
            code='invalid_athlete_id'
        )


def validate_password_strength(value):
    """
    Validate password strength.
    Must contain at least 8 characters with letters and numbers.
    """
    if len(value) < 8:
        raise ValidationError(
            'Password must be at least 8 characters long.',
            code='password_too_short'
        )
    
    if not re.search(r'[A-Za-z]', value):
        raise ValidationError(
            'Password must contain at least one letter.',
            code='password_no_letter'
        )
    
    if not re.search(r'\d', value):
        raise ValidationError(
            'Password must contain at least one number.',
            code='password_no_number'
        )


def validate_file_size(value, max_size_mb=10):
    """
    Validate uploaded file size.
    """
    if value.size > max_size_mb * 1024 * 1024:
        raise ValidationError(
            f'File size cannot exceed {max_size_mb}MB.',
            code='file_too_large'
        )


def validate_image_file(value):
    """
    Validate that uploaded file is an image.
    """
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    
    if hasattr(value, 'content_type'):
        if value.content_type not in allowed_types:
            raise ValidationError(
                'Only JPEG, PNG, GIF, and WebP images are allowed.',
                code='invalid_image_type'
            )
    
    # Also validate file size
    validate_file_size(value, max_size_mb=5)


def validate_document_file(value):
    """
    Validate that uploaded file is a document.
    """
    allowed_types = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
    
    if hasattr(value, 'content_type'):
        if value.content_type not in allowed_types:
            raise ValidationError(
                'Only PDF, DOC, DOCX, and TXT files are allowed.',
                code='invalid_document_type'
            )
    
    # Validate file size
    validate_file_size(value, max_size_mb=10)