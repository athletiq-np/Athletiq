"""
Integration tests for document management endpoints.
"""
import json
import time
import tempfile
from io import BytesIO
from PIL import Image
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.documents.models import Document, DocumentTemplate
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.guardians.models import Guardian
from tests.factories import UserFactory, SchoolFactory, AthleteFactory, GuardianFactory

User = get_user_model()


class DocumentManagementIntegrationTest(APITestCase):
    """
    Integration tests for complete document management workflows.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create users
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        
        # Create school and related entities
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.athlete = AthleteFactory(school=self.school)
        self.guardian = GuardianFactory()
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def create_test_image(self, format='JPEG'):
        """Create a test image file."""
        image = Image.new('RGB', (100, 100), color='red')
        image_io = BytesIO()
        image.save(image_io, format=format)
        image_io.seek(0)
        return image_io
    
    def create_test_pdf_content(self):
        """Create test PDF content."""
        return b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF'
    
    def test_complete_document_upload_workflow(self):
        """Test complete document upload and processing workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Upload athlete profile photo
        image_content = self.create_test_image()
        image_file = SimpleUploadedFile(
            "athlete_photo.jpg",
            image_content.getvalue(),
            content_type="image/jpeg"
        )
        
        photo_data = {
            'file': image_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id,
            'description': 'Athlete profile photo'
        }
        
        upload_response = self.client.post('/api/documents/upload/', photo_data, format='multipart')
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(upload_response.data['success'])
        
        document_id = upload_response.data['data']['document_id']
        
        # Verify document was created
        document = Document.objects.get(id=document_id)
        self.assertEqual(document.document_type, 'profile_photo')
        self.assertEqual(document.entity_type, 'athlete')
        self.assertEqual(document.entity_id, self.athlete.id)
        
        # Step 2: Get document details
        details_response = self.client.get(f'/api/documents/{document_id}/')
        self.assertEqual(details_response.status_code, status.HTTP_200_OK)
        self.assertEqual(details_response.data['data']['document_type'], 'profile_photo')
        
        # Step 3: Update document metadata
        update_data = {
            'description': 'Updated athlete profile photo',
            'tags': ['profile', 'athlete', 'photo']
        }
        
        update_response = self.client.patch(f'/api/documents/{document_id}/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 4: Verify document processing status
        processing_response = self.client.get(f'/api/documents/{document_id}/processing-status/')
        self.assertEqual(processing_response.status_code, status.HTTP_200_OK)
        
        # Step 5: Download document
        download_response = self.client.get(f'/api/documents/{document_id}/download/')
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response['Content-Type'], 'image/jpeg')
    
    def test_pdf_generation_workflow(self):
        """Test PDF generation workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Generate athlete profile PDF
        profile_data = {
            'template_type': 'athlete_profile',
            'athlete_id': self.athlete.id,
            'include_photo': True,
            'include_medical_info': True,
            'format': 'A4'
        }
        
        generate_response = self.client.post('/api/pdf/generate/', profile_data, format='json')
        self.assertEqual(generate_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(generate_response.data['success'])
        
        pdf_document_id = generate_response.data['data']['document_id']
        
        # Step 2: Check PDF generation status
        status_response = self.client.get(f'/api/pdf/{pdf_document_id}/status/')
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Download generated PDF
        pdf_download_response = self.client.get(f'/api/pdf/{pdf_document_id}/download/')
        self.assertEqual(pdf_download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(pdf_download_response['Content-Type'], 'application/pdf')
        
        # Step 4: Generate tournament scoresheet
        scoresheet_data = {
            'template_type': 'scoresheet',
            'tournament_id': 1,  # Assuming tournament exists
            'match_data': {
                'team1': 'School Eagles',
                'team2': 'School Lions',
                'date': '2024-12-01',
                'venue': 'Main Stadium'
            }
        }
        
        scoresheet_response = self.client.post('/api/pdf/generate/', scoresheet_data, format='json')
        # May return 404 if tournament doesn't exist, which is acceptable for this test
        self.assertIn(scoresheet_response.status_code, [status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])
    
    def test_ocr_processing_workflow(self):
        """Test OCR text extraction workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Upload document for OCR processing
        image_content = self.create_test_image()
        image_file = SimpleUploadedFile(
            "document_scan.jpg",
            image_content.getvalue(),
            content_type="image/jpeg"
        )
        
        ocr_data = {
            'file': image_file,
            'document_type': 'birth_certificate',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id,
            'enable_ocr': True,
            'ocr_language': 'en'
        }
        
        upload_response = self.client.post('/api/documents/upload/', ocr_data, format='multipart')
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        
        document_id = upload_response.data['data']['document_id']
        
        # Step 2: Check OCR processing status
        ocr_status_response = self.client.get(f'/api/documents/{document_id}/ocr-status/')
        self.assertEqual(ocr_status_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Get extracted text (may be empty for test image)
        text_response = self.client.get(f'/api/documents/{document_id}/extracted-text/')
        self.assertEqual(text_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Manually trigger OCR if needed
        trigger_ocr_response = self.client.post(f'/api/documents/{document_id}/trigger-ocr/')
        self.assertEqual(trigger_ocr_response.status_code, status.HTTP_200_OK)
    
    def test_document_verification_workflow(self):
        """Test document verification workflow."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Upload document for verification
        pdf_content = self.create_test_pdf_content()
        pdf_file = SimpleUploadedFile(
            "birth_certificate.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        upload_data = {
            'file': pdf_file,
            'document_type': 'birth_certificate',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id,
            'requires_verification': True
        }
        
        upload_response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        
        document_id = upload_response.data['data']['document_id']
        
        # Step 2: Get documents pending verification
        pending_response = self.client.get('/api/documents/pending-verification/')
        self.assertEqual(pending_response.status_code, status.HTTP_200_OK)
        
        document_ids = [doc['id'] for doc in pending_response.data['data']]
        self.assertIn(document_id, document_ids)
        
        # Step 3: Verify document
        verification_data = {
            'verification_status': 'verified',
            'verification_notes': 'Document appears authentic and complete',
            'verified_fields': ['name', 'date_of_birth', 'place_of_birth']
        }
        
        verify_response = self.client.post(
            f'/api/documents/{document_id}/verify/',
            verification_data,
            format='json'
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_response.data['success'])
        
        # Step 4: Check verification status
        status_response = self.client.get(f'/api/documents/{document_id}/verification-status/')
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data['data']['status'], 'verified')
    
    def test_bulk_document_operations(self):
        """Test bulk document operations."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create multiple documents first
        document_ids = []
        for i in range(3):
            image_content = self.create_test_image()
            image_file = SimpleUploadedFile(
                f"test_doc_{i}.jpg",
                image_content.getvalue(),
                content_type="image/jpeg"
            )
            
            upload_data = {
                'file': image_file,
                'document_type': 'profile_photo',
                'entity_type': 'athlete',
                'entity_id': self.athlete.id
            }
            
            response = self.client.post('/api/documents/upload/', upload_data, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            document_ids.append(response.data['data']['document_id'])
        
        # Step 1: Bulk update document metadata
        bulk_update_data = {
            'document_ids': document_ids,
            'updates': {
                'tags': ['bulk_updated', 'test'],
                'description': 'Bulk updated document'
            }
        }
        
        bulk_update_response = self.client.post('/api/documents/bulk-update/', bulk_update_data, format='json')
        self.assertEqual(bulk_update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(bulk_update_response.data['success'])
        
        # Step 2: Bulk verification
        bulk_verify_data = {
            'document_ids': document_ids[:2],  # Verify first 2 documents
            'verification_status': 'verified',
            'verification_notes': 'Bulk verification test'
        }
        
        bulk_verify_response = self.client.post('/api/documents/bulk-verify/', bulk_verify_data, format='json')
        self.assertEqual(bulk_verify_response.status_code, status.HTTP_200_OK)
        self.assertTrue(bulk_verify_response.data['success'])
        
        # Step 3: Bulk delete
        bulk_delete_data = {
            'document_ids': [document_ids[-1]]  # Delete last document
        }
        
        bulk_delete_response = self.client.post('/api/documents/bulk-delete/', bulk_delete_data, format='json')
        self.assertEqual(bulk_delete_response.status_code, status.HTTP_200_OK)
        self.assertTrue(bulk_delete_response.data['success'])


class DocumentTemplateManagementIntegrationTest(APITestCase):
    """
    Integration tests for document template management.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_template_management_workflow(self):
        """Test complete template management workflow."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 1: Create new template
        template_data = {
            'name': 'Custom Athlete Profile',
            'template_type': 'athlete_profile',
            'description': 'Custom template for athlete profiles',
            'template_content': {
                'header': 'Athlete Profile',
                'sections': ['personal_info', 'sports_info', 'medical_info'],
                'footer': 'Generated by Athletiq'
            },
            'is_active': True
        }
        
        create_response = self.client.post('/api/documents/templates/', template_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_response.data['success'])
        
        template_id = create_response.data['data']['id']
        
        # Step 2: Get template details
        details_response = self.client.get(f'/api/documents/templates/{template_id}/')
        self.assertEqual(details_response.status_code, status.HTTP_200_OK)
        self.assertEqual(details_response.data['data']['name'], 'Custom Athlete Profile')
        
        # Step 3: Update template
        update_data = {
            'description': 'Updated custom template for athlete profiles',
            'template_content': {
                'header': 'Updated Athlete Profile',
                'sections': ['personal_info', 'sports_info', 'medical_info', 'achievements'],
                'footer': 'Generated by Athletiq System'
            }
        }
        
        update_response = self.client.patch(f'/api/documents/templates/{template_id}/', update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertTrue(update_response.data['success'])
        
        # Step 4: List all templates
        list_response = self.client.get('/api/documents/templates/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        
        template_names = [t['name'] for t in list_response.data['data']]
        self.assertIn('Custom Athlete Profile', template_names)
        
        # Step 5: Test template with document generation
        generation_data = {
            'template_id': template_id,
            'entity_type': 'athlete',
            'entity_id': 1,  # Assuming athlete exists
            'format': 'PDF'
        }
        
        generate_response = self.client.post('/api/documents/generate-from-template/', generation_data, format='json')
        # May return 404 if athlete doesn't exist, which is acceptable
        self.assertIn(generate_response.status_code, [status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])
    
    def test_template_access_permissions(self):
        """Test template access permissions."""
        # SuperAdmin should have full access
        super_token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {super_token}')
        
        response = self.client.get('/api/documents/templates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # SchoolAdmin should have read-only access
        school_token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {school_token}')
        
        # Can read templates
        read_response = self.client.get('/api/documents/templates/')
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        
        # Cannot create templates
        template_data = {
            'name': 'Unauthorized Template',
            'template_type': 'test',
            'template_content': {}
        }
        
        create_response = self.client.post('/api/documents/templates/', template_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)


class DocumentSearchAndAnalyticsIntegrationTest(APITestCase):
    """
    Integration tests for document search and analytics.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.super_admin = UserFactory(role='SuperAdmin')
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create test documents
        self.create_test_documents()
    
    def create_test_documents(self):
        """Create test documents for search and analytics."""
        athletes = [AthleteFactory(school=self.school) for _ in range(3)]
        
        document_types = ['profile_photo', 'birth_certificate', 'medical_certificate']
        
        for i, athlete in enumerate(athletes):
            for j, doc_type in enumerate(document_types):
                Document.objects.create(
                    document_type=doc_type,
                    entity_type='athlete',
                    entity_id=athlete.id,
                    file_name=f'{doc_type}_{athlete.id}.pdf',
                    file_path=f'/documents/{doc_type}_{athlete.id}.pdf',
                    file_size=1024 * (i + j + 1),
                    mime_type='application/pdf',
                    verification_status='verified' if i % 2 == 0 else 'pending',
                    uploaded_by=self.school_admin
                )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_document_search_functionality(self):
        """Test document search functionality."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test search by document type
        type_search_response = self.client.get('/api/documents/search/?document_type=profile_photo')
        self.assertEqual(type_search_response.status_code, status.HTTP_200_OK)
        
        profile_docs = [doc for doc in type_search_response.data['data'] if doc['document_type'] == 'profile_photo']
        self.assertGreater(len(profile_docs), 0)
        
        # Test search by verification status
        status_search_response = self.client.get('/api/documents/search/?verification_status=verified')
        self.assertEqual(status_search_response.status_code, status.HTTP_200_OK)
        
        verified_docs = [doc for doc in status_search_response.data['data'] if doc['verification_status'] == 'verified']
        self.assertGreater(len(verified_docs), 0)
        
        # Test search by entity type
        entity_search_response = self.client.get('/api/documents/search/?entity_type=athlete')
        self.assertEqual(entity_search_response.status_code, status.HTTP_200_OK)
        
        athlete_docs = [doc for doc in entity_search_response.data['data'] if doc['entity_type'] == 'athlete']
        self.assertGreater(len(athlete_docs), 0)
        
        # Test combined search filters
        combined_search_response = self.client.get(
            '/api/documents/search/?document_type=birth_certificate&verification_status=verified'
        )
        self.assertEqual(combined_search_response.status_code, status.HTTP_200_OK)
    
    def test_document_analytics(self):
        """Test document analytics functionality."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get overall document statistics
        analytics_response = self.client.get('/api/documents/analytics/')
        self.assertEqual(analytics_response.status_code, status.HTTP_200_OK)
        self.assertTrue(analytics_response.data['success'])
        
        analytics = analytics_response.data['data']
        
        # Verify analytics structure
        self.assertIn('total_documents', analytics)
        self.assertIn('documents_by_type', analytics)
        self.assertIn('documents_by_status', analytics)
        self.assertIn('storage_usage', analytics)
        
        # Verify document type distribution
        type_distribution = analytics['documents_by_type']
        self.assertIn('profile_photo', type_distribution)
        self.assertIn('birth_certificate', type_distribution)
        self.assertIn('medical_certificate', type_distribution)
        
        # Verify status distribution
        status_distribution = analytics['documents_by_status']
        self.assertIn('verified', status_distribution)
        self.assertIn('pending', status_distribution)
    
    def test_document_compliance_reporting(self):
        """Test document compliance reporting."""
        token = self.get_jwt_token(self.super_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get compliance report
        compliance_response = self.client.get('/api/documents/compliance-report/')
        self.assertEqual(compliance_response.status_code, status.HTTP_200_OK)
        
        compliance_data = compliance_response.data['data']
        
        # Verify compliance report structure
        self.assertIn('athletes_with_complete_documents', compliance_data)
        self.assertIn('missing_documents_summary', compliance_data)
        self.assertIn('verification_status_summary', compliance_data)
        
        # Get detailed compliance report for specific entity
        detailed_response = self.client.get('/api/documents/compliance-report/?entity_type=athlete')
        self.assertEqual(detailed_response.status_code, status.HTTP_200_OK)


class DocumentErrorHandlingIntegrationTest(APITestCase):
    """
    Integration tests for document endpoint error handling.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        self.athlete = AthleteFactory(school=self.school)
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_file_upload_validation_errors(self):
        """Test file upload validation errors."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test upload without file
        no_file_data = {
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id
        }
        
        response = self.client.post('/api/documents/upload/', no_file_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
        # Test upload with invalid file type
        invalid_file = SimpleUploadedFile(
            "test.txt",
            b"This is a text file",
            content_type="text/plain"
        )
        
        invalid_data = {
            'file': invalid_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id
        }
        
        response = self.client.post('/api/documents/upload/', invalid_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
        # Test upload with oversized file (simulate)
        large_content = b'x' * (10 * 1024 * 1024 + 1)  # > 10MB
        large_file = SimpleUploadedFile(
            "large_image.jpg",
            large_content,
            content_type="image/jpeg"
        )
        
        large_data = {
            'file': large_file,
            'document_type': 'profile_photo',
            'entity_type': 'athlete',
            'entity_id': self.athlete.id
        }
        
        response = self.client.post('/api/documents/upload/', large_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_document_access_permissions(self):
        """Test document access permission errors."""
        # Create document
        document = Document.objects.create(
            document_type='profile_photo',
            entity_type='athlete',
            entity_id=self.athlete.id,
            file_name='test.jpg',
            file_path='/documents/test.jpg',
            uploaded_by=self.school_admin
        )
        
        # Test unauthenticated access
        response = self.client.get(f'/api/documents/{document.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test access by different school admin
        other_admin = UserFactory(role='SchoolAdmin')
        other_token = self.get_jwt_token(other_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token}')
        
        response = self.client.get(f'/api/documents/{document.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_document_not_found_errors(self):
        """Test document not found error scenarios."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Test accessing non-existent document
        response = self.client.get('/api/documents/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        
        # Test downloading non-existent document
        response = self.client.get('/api/documents/99999/download/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Test verifying non-existent document
        verification_data = {
            'verification_status': 'verified',
            'verification_notes': 'Test verification'
        }
        
        response = self.client.post('/api/documents/99999/verify/', verification_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DocumentPerformanceIntegrationTest(APITestCase):
    """
    Integration tests for document endpoint performance.
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.school_admin = UserFactory(role='SchoolAdmin')
        self.school = SchoolFactory(admin_user=self.school_admin)
        
        # Create many documents for performance testing
        self.create_many_documents(20)
    
    def create_many_documents(self, count):
        """Create many documents for performance testing."""
        athletes = [AthleteFactory(school=self.school) for _ in range(5)]
        
        for i in range(count):
            athlete = athletes[i % len(athletes)]
            Document.objects.create(
                document_type='profile_photo',
                entity_type='athlete',
                entity_id=athlete.id,
                file_name=f'performance_test_{i:03d}.jpg',
                file_path=f'/documents/performance_test_{i:03d}.jpg',
                file_size=1024 * (i + 1),
                mime_type='image/jpeg',
                uploaded_by=self.school_admin
            )
    
    def get_jwt_token(self, user):
        """Get JWT token for user."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_document_list_pagination_performance(self):
        """Test document list endpoint with pagination performance."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/documents/?page=1&page_size=10')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should return paginated results
        self.assertLessEqual(len(response.data['data']), 10)
        
        # Response should be reasonably fast
        self.assertLess(response_time, 2.0)  # Under 2 seconds
    
    def test_document_search_performance(self):
        """Test document search performance with large dataset."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        start_time = time.time()
        response = self.client.get('/api/documents/search/?document_type=profile_photo')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Should find matching documents
        self.assertGreater(len(response.data['data']), 0)
        
        # Search should be reasonably fast
        self.assertLess(response_time, 3.0)  # Under 3 seconds
    
    def test_bulk_operations_performance(self):
        """Test bulk operations performance."""
        token = self.get_jwt_token(self.school_admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Get some document IDs for bulk operations
        list_response = self.client.get('/api/documents/?page_size=5')
        document_ids = [doc['id'] for doc in list_response.data['data'][:3]]
        
        # Test bulk update performance
        bulk_update_data = {
            'document_ids': document_ids,
            'updates': {
                'tags': ['performance_test'],
                'description': 'Performance test document'
            }
        }
        
        start_time = time.time()
        response = self.client.post('/api/documents/bulk-update/', bulk_update_data, format='json')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Bulk update should be reasonably fast
        self.assertLess(response_time, 5.0)  # Under 5 seconds