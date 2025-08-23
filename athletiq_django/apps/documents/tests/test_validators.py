import os
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from io import BytesIO

from ..validators import (
    validate_file_size, validate_file_type, validate_image_dimensions,
    validate_pdf_file, validate_image_file, sanitize_filename,
    validate_template_file
)


class FileValidatorTest(TestCase):
    """Test file validation functions"""
    
    def test_validate_file_size_valid(self):
        """Test file size validation with valid file"""
        test_file = SimpleUploadedFile(
            "test.txt",
            b"Small file content",
            content_type="text/plain"
        )
        
        # Should not raise exception
        try:
            validate_file_size(test_file)
        except ValidationError:
            self.fail("validate_file_size raised ValidationError unexpectedly")
    
    def test_validate_file_size_too_large(self):
        """Test file size validation with oversized file"""
        # Create a large content (simulate large file)
        large_content = b"x" * (51 * 1024 * 1024)  # 51MB
        test_file = SimpleUploadedFile(
            "large.txt",
            large_content,
            content_type="text/plain"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_file_size(test_file)
        
        self.assertIn("File size too large", str(context.exception))
    
    def test_validate_image_dimensions_valid(self):
        """Test image dimension validation with valid image"""
        # Create a valid image
        image = Image.new('RGB', (500, 400), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        test_file = SimpleUploadedFile(
            "test.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        # Should not raise exception
        try:
            validate_image_dimensions(test_file)
        except ValidationError:
            self.fail("validate_image_dimensions raised ValidationError unexpectedly")
    
    def test_validate_image_dimensions_too_large(self):
        """Test image dimension validation with oversized image"""
        # Create an oversized image
        image = Image.new('RGB', (5000, 4000), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        test_file = SimpleUploadedFile(
            "large.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_image_dimensions(test_file)
        
        self.assertIn("Image dimensions too large", str(context.exception))
    
    def test_validate_image_dimensions_too_small(self):
        """Test image dimension validation with undersized image"""
        # Create an undersized image
        image = Image.new('RGB', (50, 30), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        test_file = SimpleUploadedFile(
            "small.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_image_dimensions(test_file)
        
        self.assertIn("Image dimensions too small", str(context.exception))
    
    def test_validate_pdf_file_valid(self):
        """Test PDF file validation with valid PDF"""
        # Create a mock PDF file
        pdf_content = b"%PDF-1.4\n%Test PDF content"
        test_file = SimpleUploadedFile(
            "test.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        # Should not raise exception
        try:
            validate_pdf_file(test_file)
        except ValidationError:
            self.fail("validate_pdf_file raised ValidationError unexpectedly")
    
    def test_validate_pdf_file_invalid_extension(self):
        """Test PDF file validation with invalid extension"""
        test_file = SimpleUploadedFile(
            "test.txt",
            b"Not a PDF file",
            content_type="text/plain"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_pdf_file(test_file)
        
        self.assertIn("File must be a PDF", str(context.exception))
    
    def test_validate_pdf_file_invalid_content(self):
        """Test PDF file validation with invalid PDF content"""
        test_file = SimpleUploadedFile(
            "test.pdf",
            b"Not a real PDF file",
            content_type="application/pdf"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_pdf_file(test_file)
        
        self.assertIn("Invalid PDF file", str(context.exception))
    
    def test_sanitize_filename_basic(self):
        """Test basic filename sanitization"""
        filename = "test file.txt"
        sanitized = sanitize_filename(filename)
        self.assertEqual(sanitized, "test file.txt")
    
    def test_sanitize_filename_dangerous_chars(self):
        """Test filename sanitization with dangerous characters"""
        filename = "test<>file|name?.txt"
        sanitized = sanitize_filename(filename)
        self.assertEqual(sanitized, "test__file_name_.txt")
    
    def test_sanitize_filename_long_name(self):
        """Test filename sanitization with long name"""
        long_name = "a" * 150 + ".txt"
        sanitized = sanitize_filename(long_name)
        self.assertTrue(len(sanitized) <= 104)  # 100 chars + ".txt"
        self.assertTrue(sanitized.endswith(".txt"))
    
    def test_validate_template_file_valid_json(self):
        """Test template file validation with valid JSON"""
        test_file = SimpleUploadedFile(
            "template.json",
            b'{"template": "content"}',
            content_type="application/json"
        )
        
        # Should not raise exception
        try:
            validate_template_file(test_file)
        except ValidationError:
            self.fail("validate_template_file raised ValidationError unexpectedly")
    
    def test_validate_template_file_valid_html(self):
        """Test template file validation with valid HTML"""
        test_file = SimpleUploadedFile(
            "template.html",
            b'<html><body>Template content</body></html>',
            content_type="text/html"
        )
        
        # Should not raise exception
        try:
            validate_template_file(test_file)
        except ValidationError:
            self.fail("validate_template_file raised ValidationError unexpectedly")
    
    def test_validate_template_file_invalid_extension(self):
        """Test template file validation with invalid extension"""
        test_file = SimpleUploadedFile(
            "template.txt",
            b'Template content',
            content_type="text/plain"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_template_file(test_file)
        
        self.assertIn("Template file type not allowed", str(context.exception))
    
    def test_validate_template_file_too_large(self):
        """Test template file validation with oversized file"""
        large_content = b"x" * (2 * 1024 * 1024)  # 2MB
        test_file = SimpleUploadedFile(
            "template.json",
            large_content,
            content_type="application/json"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_template_file(test_file)
        
        self.assertIn("Template file too large", str(context.exception))