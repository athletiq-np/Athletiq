import json
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

from ..models import PDFTemplate, GeneratedPDF
from ..services.pdf_service import PDFGenerationService, PDFTemplateService

User = get_user_model()


class PDFGenerationServiceTest(TestCase):
    """Test PDF generation service"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='SuperAdmin'
        )
        
        self.pdf_service = PDFGenerationService()
        
        self.tournament_data = {
            'name': 'Test Tournament',
            'date': '2024-01-15',
            'location': 'Test Venue',
            'sport': 'Basketball'
        }
        
        self.match_data = {
            'team1': 'Team Alpha',
            'team2': 'Team Beta',
            'time': '14:00',
            'venue': 'Court 1'
        }
        
        self.athlete_data = {
            'name': 'John Doe',
            'achievement': 'First Place'
        }
    
    def test_generate_scoresheet_pdf(self):
        """Test scoresheet PDF generation"""
        generated_pdf = self.pdf_service.generate_scoresheet_pdf(
            self.tournament_data, self.match_data, self.user
        )
        
        self.assertIsInstance(generated_pdf, GeneratedPDF)
        self.assertEqual(generated_pdf.generated_by, self.user)
        self.assertIn('Test Tournament', generated_pdf.title)
        self.assertTrue(generated_pdf.pdf_file)
        self.assertGreater(generated_pdf.file_size, 0)
        self.assertEqual(generated_pdf.generation_data['type'], 'scoresheet')
    
    def test_generate_certificate_pdf(self):
        """Test certificate PDF generation"""
        generated_pdf = self.pdf_service.generate_certificate_pdf(
            self.athlete_data, self.tournament_data, self.user
        )
        
        self.assertIsInstance(generated_pdf, GeneratedPDF)
        self.assertEqual(generated_pdf.generated_by, self.user)
        self.assertIn('John Doe', generated_pdf.title)
        self.assertTrue(generated_pdf.pdf_file)
        self.assertGreater(generated_pdf.file_size, 0)
        self.assertEqual(generated_pdf.generation_data['type'], 'certificate')
    
    def test_generate_from_json_template(self):
        """Test PDF generation from JSON template"""
        # Create a test template
        template_data = {
            "sections": [
                {
                    "type": "title",
                    "text": "Test Document - {title}",
                    "fontSize": 18,
                    "center": True,
                    "spaceAfter": 20
                },
                {
                    "type": "paragraph",
                    "text": "This is a test document for {name}",
                    "fontSize": 12,
                    "spaceAfter": 10
                }
            ]
        }
        
        template_content = json.dumps(template_data)
        template_file = SimpleUploadedFile(
            "test_template.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        template = PDFTemplate.objects.create(
            name='Test Template',
            template_type='custom',
            description='Test template',
            template_file=template_file,
            created_by=self.user
        )
        
        # Generate PDF from template
        data = {
            'title': 'My Test Title',
            'name': 'Test User'
        }
        
        generated_pdf = self.pdf_service.generate_from_template(
            template.template_id, data, self.user, 'Test Generated PDF'
        )
        
        self.assertIsInstance(generated_pdf, GeneratedPDF)
        self.assertEqual(generated_pdf.template, template)
        self.assertEqual(generated_pdf.title, 'Test Generated PDF')
        self.assertEqual(generated_pdf.generation_data, data)
        self.assertTrue(generated_pdf.pdf_file)
        self.assertGreater(generated_pdf.file_size, 0)
    
    def test_replace_placeholders(self):
        """Test placeholder replacement"""
        text = "Hello {name}, welcome to {event}!"
        data = {
            'name': 'John',
            'event': 'Test Tournament'
        }
        
        result = self.pdf_service._replace_placeholders(text, data)
        expected = "Hello John, welcome to Test Tournament!"
        
        self.assertEqual(result, expected)
    
    def test_replace_placeholders_missing_data(self):
        """Test placeholder replacement with missing data"""
        text = "Hello {name}, welcome to {event}!"
        data = {
            'name': 'John'
            # 'event' is missing
        }
        
        result = self.pdf_service._replace_placeholders(text, data)
        expected = "Hello John, welcome to {event}!"  # {event} remains unchanged
        
        self.assertEqual(result, expected)


class PDFTemplateServiceTest(TestCase):
    """Test PDF template service"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='SuperAdmin'
        )
        
        self.template_service = PDFTemplateService()
    
    def test_create_template(self):
        """Test template creation"""
        template_content = '{"test": "template"}'
        template_file = SimpleUploadedFile(
            "test.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        template = self.template_service.create_template(
            name='Test Template',
            template_type='custom',
            description='Test description',
            template_file=template_file,
            user=self.user
        )
        
        self.assertIsInstance(template, PDFTemplate)
        self.assertEqual(template.name, 'Test Template')
        self.assertEqual(template.template_type, 'custom')
        self.assertEqual(template.created_by, self.user)
        self.assertTrue(template.is_active)
    
    def test_get_template(self):
        """Test getting a template"""
        template_content = '{"test": "template"}'
        template_file = SimpleUploadedFile(
            "test.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        created_template = PDFTemplate.objects.create(
            name='Test Template',
            template_type='custom',
            template_file=template_file,
            created_by=self.user
        )
        
        retrieved_template = self.template_service.get_template(created_template.template_id)
        
        self.assertEqual(retrieved_template, created_template)
    
    def test_get_inactive_template(self):
        """Test getting an inactive template raises exception"""
        template_content = '{"test": "template"}'
        template_file = SimpleUploadedFile(
            "test.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        template = PDFTemplate.objects.create(
            name='Test Template',
            template_type='custom',
            template_file=template_file,
            created_by=self.user,
            is_active=False
        )
        
        with self.assertRaises(Exception) as context:
            self.template_service.get_template(template.template_id)
        
        self.assertIn("Template not found or inactive", str(context.exception))
    
    def test_list_templates(self):
        """Test listing templates"""
        # Create test templates
        for i in range(3):
            template_content = f'{{"test": "template{i}"}}'
            template_file = SimpleUploadedFile(
                f"test{i}.json",
                template_content.encode(),
                content_type="application/json"
            )
            
            PDFTemplate.objects.create(
                name=f'Test Template {i}',
                template_type='custom',
                template_file=template_file,
                created_by=self.user
            )
        
        templates = self.template_service.list_templates()
        self.assertEqual(templates.count(), 3)
    
    def test_list_templates_by_type(self):
        """Test listing templates by type"""
        # Create templates of different types
        types = ['scoresheet', 'certificate', 'custom']
        
        for template_type in types:
            template_content = f'{{"test": "{template_type}"}}'
            template_file = SimpleUploadedFile(
                f"{template_type}.json",
                template_content.encode(),
                content_type="application/json"
            )
            
            PDFTemplate.objects.create(
                name=f'{template_type.title()} Template',
                template_type=template_type,
                template_file=template_file,
                created_by=self.user
            )
        
        scoresheet_templates = self.template_service.list_templates('scoresheet')
        self.assertEqual(scoresheet_templates.count(), 1)
        self.assertEqual(scoresheet_templates.first().template_type, 'scoresheet')
    
    def test_update_template(self):
        """Test updating a template"""
        template_content = '{"test": "template"}'
        template_file = SimpleUploadedFile(
            "test.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        template = PDFTemplate.objects.create(
            name='Original Name',
            template_type='custom',
            template_file=template_file,
            created_by=self.user
        )
        
        updated_template = self.template_service.update_template(
            template.template_id,
            name='Updated Name',
            description='Updated description'
        )
        
        self.assertEqual(updated_template.name, 'Updated Name')
        self.assertEqual(updated_template.description, 'Updated description')
    
    def test_delete_template(self):
        """Test soft deleting a template"""
        template_content = '{"test": "template"}'
        template_file = SimpleUploadedFile(
            "test.json",
            template_content.encode(),
            content_type="application/json"
        )
        
        template = PDFTemplate.objects.create(
            name='Test Template',
            template_type='custom',
            template_file=template_file,
            created_by=self.user
        )
        
        result = self.template_service.delete_template(template.template_id)
        
        self.assertTrue(result)
        
        # Refresh from database
        template.refresh_from_db()
        self.assertFalse(template.is_active)
    
    def test_create_sample_templates(self):
        """Test creating sample templates"""
        templates = self.template_service.create_sample_templates(self.user)
        
        self.assertEqual(len(templates), 2)
        
        # Check scoresheet template
        scoresheet_template = next(t for t in templates if t.template_type == 'scoresheet')
        self.assertEqual(scoresheet_template.name, 'Default Scoresheet Template')
        self.assertEqual(scoresheet_template.created_by, self.user)
        
        # Check certificate template
        certificate_template = next(t for t in templates if t.template_type == 'certificate')
        self.assertEqual(certificate_template.name, 'Default Certificate Template')
        self.assertEqual(certificate_template.created_by, self.user)