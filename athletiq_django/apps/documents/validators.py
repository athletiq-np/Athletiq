import os
from django.core.exceptions import ValidationError
from django.conf import settings
from PIL import Image
from io import BytesIO

# Optional import for python-magic
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False


# File size limits (in bytes)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB for images

# Allowed file types
ALLOWED_DOCUMENT_TYPES = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
}

ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
}

# Image dimension limits
MAX_IMAGE_WIDTH = 4000
MAX_IMAGE_HEIGHT = 4000
MIN_IMAGE_WIDTH = 100
MIN_IMAGE_HEIGHT = 100


def validate_file_size(file):
    """Validate file size"""
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(
            f'File size too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)}MB'
        )
    
    # Additional check for images
    if hasattr(file, 'content_type') and file.content_type.startswith('image/'):
        if file.size > MAX_IMAGE_SIZE:
            raise ValidationError(
                f'Image size too large. Maximum allowed size is {MAX_IMAGE_SIZE // (1024 * 1024)}MB'
            )


def validate_file_type(file):
    """Validate file type using both extension and MIME type"""
    if not file.name:
        raise ValidationError('File name is required')
    
    # Get file extension
    file_ext = os.path.splitext(file.name)[1].lower()
    
    # Check if extension is allowed
    allowed_extensions = []
    for mime_type, extensions in ALLOWED_DOCUMENT_TYPES.items():
        allowed_extensions.extend(extensions)
    
    if file_ext not in allowed_extensions:
        raise ValidationError(
            f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'
        )
    
    # Validate MIME type using python-magic if available
    if HAS_MAGIC:
        try:
            file.seek(0)
            file_content = file.read(1024)  # Read first 1KB for MIME detection
            file.seek(0)  # Reset file pointer
            
            detected_mime = magic.from_buffer(file_content, mime=True)
            
            # Check if detected MIME type is allowed
            if detected_mime not in ALLOWED_DOCUMENT_TYPES:
                raise ValidationError(
                    f'File type not allowed. Detected type: {detected_mime}'
                )
            
            # Check if extension matches MIME type
            expected_extensions = ALLOWED_DOCUMENT_TYPES[detected_mime]
            if file_ext not in expected_extensions:
                raise ValidationError(
                    f'File extension does not match file type. Expected: {", ".join(expected_extensions)}'
                )
        
        except Exception as e:
            # If magic fails, fall back to basic extension check
            pass


def validate_image_dimensions(file):
    """Validate image dimensions"""
    try:
        file.seek(0)
        image = Image.open(file)
        width, height = image.size
        file.seek(0)  # Reset file pointer
        
        if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
            raise ValidationError(
                f'Image dimensions too large. Maximum allowed: {MAX_IMAGE_WIDTH}x{MAX_IMAGE_HEIGHT}px'
            )
        
        if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
            raise ValidationError(
                f'Image dimensions too small. Minimum required: {MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT}px'
            )
    
    except Exception as e:
        raise ValidationError(f'Invalid image file: {str(e)}')


def validate_pdf_file(file):
    """Validate PDF file specifically"""
    if not file.name.lower().endswith('.pdf'):
        raise ValidationError('File must be a PDF')
    
    try:
        file.seek(0)
        header = file.read(4)
        file.seek(0)
        
        if header != b'%PDF':
            raise ValidationError('Invalid PDF file')
    
    except Exception as e:
        raise ValidationError(f'Error validating PDF: {str(e)}')


def validate_image_file(file):
    """Validate image file specifically"""
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    file_ext = os.path.splitext(file.name)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise ValidationError(
            f'Image type not allowed. Allowed types: {", ".join(allowed_extensions)}'
        )
    
    validate_image_dimensions(file)


def sanitize_filename(filename):
    """Sanitize filename to prevent security issues"""
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove or replace dangerous characters
    dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Limit filename length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    
    return f"{name}{ext}"


def validate_template_file(file):
    """Validate PDF template file"""
    allowed_extensions = ['.html', '.json']
    file_ext = os.path.splitext(file.name)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise ValidationError(
            f'Template file type not allowed. Allowed types: {", ".join(allowed_extensions)}'
        )
    
    # Validate file size (templates should be small)
    max_template_size = 1024 * 1024  # 1MB
    if file.size > max_template_size:
        raise ValidationError(
            f'Template file too large. Maximum size: {max_template_size // 1024}KB'
        )