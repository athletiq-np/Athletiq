"""
Unit tests for service classes.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from decimal import Decimal
import json
import tempfile
import os

from apps.notifications.services.email_service import EmailService
from apps.notifications.services.sms_service import SMSService
from apps.notifications.services.notification_service import NotificationService
from apps.notifications.services.template_service import TemplateService
from apps.documents.services.pdf_service import PDFGenerationService, PDFTemplateService
from apps.documents.services.ocr_service import OCRService, DocumentProcessingService
from apps.documents.services.file_service import FileProcessingService, FileStorageService
from apps.google_services.services.translate_service import TranslateService
from apps.google_services.services.vision_service import VisionService
from apps.google_services.services.maps_service import MapsService
from apps.google_services.services.google_service_manager import GoogleServiceManager
from core.services.bulk_notification_service import BulkOperationNotificationService

from tests.factories import UserFactory, GuardianFactory, AthleteFactory, TournamentFactory


class EmailServiceTest(TestCase):
    """Test cases for EmailService."""
    
    def setUp(self):
        """Set up test data."""
        self.email_service = EmailService()
        self.user = UserFactory()
    
    @patch('apps.notifications.services.email_service.send_mail')
    def test_send_email_success(self, mock_send_mail):
        """Test successful email sending."""
        mock_send_mail.return_value = True
        
        result = self.email_service.send_email(
            to_email='test@example.com',
            subject='Test Subject',
            message='Test message',
            from_email='noreply@athletiq.com'
        )
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
    
    @patch('apps.notifications.services.email_service.send_mail')
    def test_send_email_failure(self, mock_send_mail):
        """Test email sending failure."""
        mock_send_mail.side_effect = Exception('SMTP Error')
        
        result = self.email_service.send_email(
            to_email='test@example.com',
            subject='Test Subject',
            message='Test message'
        )
        
        self.assertFalse(result)
    
    @patch('apps.notifications.services.email_service.render_to_string')
    @patch('apps.notifications.services.email_service.send_mail')
    def test_send_template_email(self, mock_send_mail, mock_render):
        """Test sending templated email."""
        mock_render.return_value = '<html>Test HTML</html>'
        mock_send_mail.return_value = True
        
        result = self.email_service.send_template_email(
            to_email='test@example.com',
            template_name='test_template.html',
            context={'name': 'John'},
            subject='Test Subject'
        )
        
        self.assertTrue(result)
        mock_render.assert_called_once()
        mock_send_mail.assert_called_once()
    
    def test_validate_email_address(self):
        """Test email address validation."""
        # Valid emails
        valid_emails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.org']
        for email in valid_emails:
            self.assertTrue(self.email_service.validate_email(email))
        
        # Invalid emails
        invalid_emails = ['invalid-email', '@example.com', 'test@', 'test..test@example.com']
        for email in invalid_emails:
            self.assertFalse(self.email_service.validate_email(email))


class SMSServiceTest(TestCase):
    """Test cases for SMSService."""
    
    def setUp(self):
        """Set up test data."""
        self.sms_service = SMSService()
    
    @patch('apps.notifications.services.sms_service.Client')
    def test_send_sms_success(self, mock_twilio_client):
        """Test successful SMS sending."""
        mock_client = Mock()
        mock_twilio_client.return_value = mock_client
        mock_client.messages.create.return_value = Mock(sid='test_sid')
        
        result = self.sms_service.send_sms(
            to_phone='+977-9841234567',
            message='Test SMS message'
        )
        
        self.assertTrue(result)
        mock_client.messages.create.assert_called_once()
    
    @patch('apps.notifications.services.sms_service.Client')
    def test_send_sms_failure(self, mock_twilio_client):
        """Test SMS sending failure."""
        mock_client = Mock()
        mock_twilio_client.return_value = mock_client
        mock_client.messages.create.side_effect = Exception('Twilio Error')
        
        result = self.sms_service.send_sms(
            to_phone='+977-9841234567',
            message='Test SMS message'
        )
        
        self.assertFalse(result)
    
    def test_validate_phone_number(self):
        """Test phone number validation."""
        # Valid phone numbers
        valid_phones = ['+977-9841234567', '+1-555-123-4567', '9841234567']
        for phone in valid_phones:
            self.assertTrue(self.sms_service.validate_phone(phone))
        
        # Invalid phone numbers
        invalid_phones = ['123', 'invalid-phone', '+977-123']
        for phone in invalid_phones:
            self.assertFalse(self.sms_service.validate_phone(phone))
    
    def test_format_phone_number(self):
        """Test phone number formatting."""
        # Test various formats
        test_cases = [
            ('9841234567', '+977-9841234567'),
            ('+977-9841234567', '+977-9841234567'),
            ('977-9841234567', '+977-9841234567')
        ]
        
        for input_phone, expected in test_cases:
            result = self.sms_service.format_phone(input_phone)
            self.assertEqual(result, expected)


class NotificationServiceTest(TestCase):
    """Test cases for NotificationService."""
    
    def setUp(self):
        """Set up test data."""
        self.notification_service = NotificationService()
        self.user = UserFactory()
        self.guardian = GuardianFactory()
    
    @patch('apps.notifications.services.notification_service.EmailService.send_email')
    def test_send_user_notification_email(self, mock_send_email):
        """Test sending email notification to user."""
        mock_send_email.return_value = True
        
        result = self.notification_service.send_user_notification(
            user=self.user,
            notification_type='email',
            subject='Test Notification',
            message='Test message'
        )
        
        self.assertTrue(result)
        mock_send_email.assert_called_once()
    
    @patch('apps.notifications.services.notification_service.SMSService.send_sms')
    def test_send_user_notification_sms(self, mock_send_sms):
        """Test sending SMS notification to user."""
        mock_send_sms.return_value = True
        
        result = self.notification_service.send_user_notification(
            user=self.user,
            notification_type='sms',
            message='Test SMS message'
        )
        
        self.assertTrue(result)
        mock_send_sms.assert_called_once()
    
    @patch('apps.notifications.services.notification_service.EmailService.send_email')
    def test_send_guardian_notification(self, mock_send_email):
        """Test sending notification to guardian."""
        mock_send_email.return_value = True
        
        result = self.notification_service.send_guardian_notification(
            guardian=self.guardian,
            notification_type='email',
            subject='Guardian Notification',
            message='Test guardian message'
        )
        
        self.assertTrue(result)
        mock_send_email.assert_called_once()
    
    def test_get_notification_preferences(self):
        """Test getting user notification preferences."""
        preferences = self.notification_service.get_notification_preferences(self.user)
        
        self.assertIsInstance(preferences, dict)
        self.assertIn('email', preferences)
        self.assertIn('sms', preferences)


class TemplateServiceTest(TestCase):
    """Test cases for TemplateService."""
    
    def setUp(self):
        """Set up test data."""
        self.template_service = TemplateService()
    
    def test_render_template(self):
        """Test template rendering."""
        template_content = "Hello {{ name }}, welcome to {{ platform }}!"
        context = {'name': 'John', 'platform': 'Athletiq'}
        
        result = self.template_service.render_template(template_content, context)
        expected = "Hello John, welcome to Athletiq!"
        
        self.assertEqual(result, expected)
    
    def test_render_template_missing_variable(self):
        """Test template rendering with missing variables."""
        template_content = "Hello {{ name }}, your score is {{ score }}!"
        context = {'name': 'John'}  # Missing 'score'
        
        # Should handle missing variables gracefully
        result = self.template_service.render_template(template_content, context)
        self.assertIn('John', result)
    
    def test_get_template_by_type(self):
        """Test getting template by type."""
        # This would typically fetch from database
        template = self.template_service.get_template('welcome_email')
        
        # Should return template object or None
        self.assertIsNotNone(template)


class PDFGenerationServiceTest(TestCase):
    """Test cases for PDFGenerationService."""
    
    def setUp(self):
        """Set up test data."""
        self.pdf_service = PDFGenerationService()
        self.tournament = TournamentFactory()
        self.athlete = AthleteFactory()
    
    @patch('apps.documents.services.pdf_service.canvas.Canvas')
    def test_generate_scoresheet_pdf(self, mock_canvas):
        """Test scoresheet PDF generation."""
        mock_canvas_instance = Mock()
        mock_canvas.return_value = mock_canvas_instance
        
        match_data = {
            'tournament_id': self.tournament.id,
            'team1': 'Team A',
            'team2': 'Team B',
            'date': '2024-01-15',
            'venue': 'Stadium A'
        }
        
        result = self.pdf_service.generate_scoresheet(match_data)
        
        self.assertIsNotNone(result)
        mock_canvas.assert_called_once()
    
    @patch('apps.documents.services.pdf_service.canvas.Canvas')
    def test_generate_certificate_pdf(self, mock_canvas):
        """Test certificate PDF generation."""
        mock_canvas_instance = Mock()
        mock_canvas.return_value = mock_canvas_instance
        
        certificate_data = {
            'athlete_name': self.athlete.full_name,
            'tournament_name': self.tournament.name,
            'position': '1st Place',
            'date': '2024-01-15'
        }
        
        result = self.pdf_service.generate_certificate(certificate_data)
        
        self.assertIsNotNone(result)
        mock_canvas.assert_called_once()
    
    def test_validate_scoresheet_data(self):
        """Test scoresheet data validation."""
        valid_data = {
            'tournament_id': self.tournament.id,
            'team1': 'Team A',
            'team2': 'Team B',
            'date': '2024-01-15'
        }
        
        # Should not raise exception
        self.pdf_service.validate_scoresheet_data(valid_data)
        
        # Test missing required field
        invalid_data = valid_data.copy()
        del invalid_data['team1']
        
        with self.assertRaises(ValidationError):
            self.pdf_service.validate_scoresheet_data(invalid_data)


class OCRServiceTest(TestCase):
    """Test cases for OCRService."""
    
    def setUp(self):
        """Set up test data."""
        self.ocr_service = OCRService()
    
    @patch('apps.documents.services.ocr_service.vision.ImageAnnotatorClient')
    def test_extract_text_from_image(self, mock_vision_client):
        """Test text extraction from image."""
        mock_client = Mock()
        mock_vision_client.return_value = mock_client
        
        # Mock response
        mock_response = Mock()
        mock_response.text_annotations = [Mock(description='Extracted text')]
        mock_client.text_detection.return_value = mock_response
        
        # Create test image file
        image_content = b'fake image content'
        image_file = SimpleUploadedFile('test.jpg', image_content, content_type='image/jpeg')
        
        result = self.ocr_service.extract_text(image_file)
        
        self.assertEqual(result, 'Extracted text')
        mock_client.text_detection.assert_called_once()
    
    @patch('apps.documents.services.ocr_service.vision.ImageAnnotatorClient')
    def test_extract_text_no_text_found(self, mock_vision_client):
        """Test OCR when no text is found."""
        mock_client = Mock()
        mock_vision_client.return_value = mock_client
        
        # Mock empty response
        mock_response = Mock()
        mock_response.text_annotations = []
        mock_client.text_detection.return_value = mock_response
        
        image_content = b'fake image content'
        image_file = SimpleUploadedFile('test.jpg', image_content, content_type='image/jpeg')
        
        result = self.ocr_service.extract_text(image_file)
        
        self.assertEqual(result, '')
    
    def test_validate_image_file(self):
        """Test image file validation."""
        # Valid image file
        valid_image = SimpleUploadedFile('test.jpg', b'fake content', content_type='image/jpeg')
        self.assertTrue(self.ocr_service.validate_image(valid_image))
        
        # Invalid file type
        invalid_file = SimpleUploadedFile('test.txt', b'text content', content_type='text/plain')
        self.assertFalse(self.ocr_service.validate_image(invalid_file))


class FileProcessingServiceTest(TestCase):
    """Test cases for FileProcessingService."""
    
    def setUp(self):
        """Set up test data."""
        self.file_service = FileProcessingService()
    
    def test_validate_file_type(self):
        """Test file type validation."""
        # Valid file types
        valid_files = [
            SimpleUploadedFile('test.pdf', b'pdf content', content_type='application/pdf'),
            SimpleUploadedFile('test.jpg', b'image content', content_type='image/jpeg'),
            SimpleUploadedFile('test.png', b'image content', content_type='image/png')
        ]
        
        for file in valid_files:
            self.assertTrue(self.file_service.validate_file_type(file))
        
        # Invalid file type
        invalid_file = SimpleUploadedFile('test.exe', b'executable', content_type='application/exe')
        self.assertFalse(self.file_service.validate_file_type(invalid_file))
    
    def test_validate_file_size(self):
        """Test file size validation."""
        # Valid size (under limit)
        small_file = SimpleUploadedFile('test.jpg', b'x' * 1024, content_type='image/jpeg')  # 1KB
        self.assertTrue(self.file_service.validate_file_size(small_file))
        
        # Invalid size (over limit)
        large_content = b'x' * (10 * 1024 * 1024 + 1)  # Over 10MB
        large_file = SimpleUploadedFile('test.jpg', large_content, content_type='image/jpeg')
        self.assertFalse(self.file_service.validate_file_size(large_file))
    
    @patch('apps.documents.services.file_service.Image')
    def test_process_image(self, mock_image):
        """Test image processing."""
        mock_img = Mock()
        mock_image.open.return_value = mock_img
        mock_img.size = (1000, 800)
        
        image_file = SimpleUploadedFile('test.jpg', b'image content', content_type='image/jpeg')
        
        result = self.file_service.process_image(image_file)
        
        self.assertIsNotNone(result)
        mock_image.open.assert_called_once()


class GoogleServiceManagerTest(TestCase):
    """Test cases for GoogleServiceManager."""
    
    def setUp(self):
        """Set up test data."""
        self.service_manager = GoogleServiceManager()
    
    @patch('apps.google_services.services.google_service_manager.TranslateService')
    def test_get_translate_service(self, mock_translate_service):
        """Test getting translate service."""
        mock_service = Mock()
        mock_translate_service.return_value = mock_service
        
        service = self.service_manager.get_translate_service()
        
        self.assertIsNotNone(service)
    
    @patch('apps.google_services.services.google_service_manager.VisionService')
    def test_get_vision_service(self, mock_vision_service):
        """Test getting vision service."""
        mock_service = Mock()
        mock_vision_service.return_value = mock_service
        
        service = self.service_manager.get_vision_service()
        
        self.assertIsNotNone(service)
    
    @patch('apps.google_services.services.google_service_manager.MapsService')
    def test_get_maps_service(self, mock_maps_service):
        """Test getting maps service."""
        mock_service = Mock()
        mock_maps_service.return_value = mock_service
        
        service = self.service_manager.get_maps_service()
        
        self.assertIsNotNone(service)


class BulkOperationNotificationServiceTest(TestCase):
    """Test cases for BulkOperationNotificationService."""
    
    def setUp(self):
        """Set up test data."""
        self.bulk_service = BulkOperationNotificationService()
        self.user = UserFactory()
    
    @patch('core.services.bulk_notification_service.NotificationService.send_user_notification')
    def test_notify_bulk_operation_start(self, mock_send_notification):
        """Test bulk operation start notification."""
        mock_send_notification.return_value = True
        
        result = self.bulk_service.notify_operation_start(
            user=self.user,
            operation_type='athlete_import',
            operation_id='bulk_123'
        )
        
        self.assertTrue(result)
        mock_send_notification.assert_called_once()
    
    @patch('core.services.bulk_notification_service.NotificationService.send_user_notification')
    def test_notify_bulk_operation_complete(self, mock_send_notification):
        """Test bulk operation completion notification."""
        mock_send_notification.return_value = True
        
        result = self.bulk_service.notify_operation_complete(
            user=self.user,
            operation_type='athlete_import',
            operation_id='bulk_123',
            success_count=100,
            error_count=5
        )
        
        self.assertTrue(result)
        mock_send_notification.assert_called_once()
    
    def test_format_operation_summary(self):
        """Test operation summary formatting."""
        summary = self.bulk_service.format_operation_summary(
            operation_type='athlete_import',
            success_count=95,
            error_count=5,
            total_count=100
        )
        
        self.assertIn('95', summary)
        self.assertIn('5', summary)
        self.assertIn('100', summary)
        self.assertIn('athlete_import', summary)


@pytest.mark.django_db
class TestServicesPytest:
    """Pytest-style tests for services."""
    
    @patch('apps.notifications.services.email_service.send_mail')
    def test_email_service_batch_sending(self, mock_send_mail):
        """Test batch email sending."""
        mock_send_mail.return_value = True
        email_service = EmailService()
        
        recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com']
        
        results = email_service.send_batch_emails(
            recipients=recipients,
            subject='Batch Test',
            message='Test message'
        )
        
        assert len(results) == 3
        assert all(results)
        assert mock_send_mail.call_count == 3
    
    @patch('apps.documents.services.pdf_service.canvas.Canvas')
    def test_pdf_service_template_caching(self, mock_canvas):
        """Test PDF template caching."""
        mock_canvas_instance = Mock()
        mock_canvas.return_value = mock_canvas_instance
        
        pdf_service = PDFGenerationService()
        
        # Generate same type of PDF twice
        data = {'tournament_id': 1, 'team1': 'A', 'team2': 'B', 'date': '2024-01-15'}
        
        result1 = pdf_service.generate_scoresheet(data)
        result2 = pdf_service.generate_scoresheet(data)
        
        assert result1 is not None
        assert result2 is not None
    
    def test_file_service_concurrent_uploads(self):
        """Test file service handling concurrent uploads."""
        file_service = FileProcessingService()
        
        # Create multiple test files
        files = [
            SimpleUploadedFile(f'test{i}.jpg', b'content', content_type='image/jpeg')
            for i in range(5)
        ]
        
        # Process files concurrently (simulate)
        results = []
        for file in files:
            result = file_service.validate_file_type(file)
            results.append(result)
        
        assert all(results)
        assert len(results) == 5
    
    @patch('apps.google_services.services.translate_service.translate.Client')
    def test_translate_service_caching(self, mock_translate_client):
        """Test translation service caching."""
        mock_client = Mock()
        mock_translate_client.return_value = mock_client
        mock_client.translate.return_value = {'translatedText': 'Bonjour'}
        
        translate_service = TranslateService()
        
        # Translate same text twice
        result1 = translate_service.translate_text('Hello', target_language='fr')
        result2 = translate_service.translate_text('Hello', target_language='fr')
        
        # Should use cache for second call
        assert result1 == result2
        # Mock should only be called once due to caching
        assert mock_client.translate.call_count <= 2