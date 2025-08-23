import os
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from ..models import Document, ProcessedImage, PDFTemplate, GeneratedPDF
from ..serializers import (
    DocumentUploadSerializer, DocumentSerializer, ProcessedImageSerializer,
    PDFTemplateSerializer, GeneratedPDFSerializer, FileUploadResponseSerializer,
    PDFGenerationRequestSerializer
)
from ..services.file_service import FileProcessingService, FileStorageService
from ..permissions import DocumentPermission
from core.permissions.base import IsAuthenticated


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for document management"""
    
    queryset = Document.objects.all()
    permission_classes = [IsAuthenticated, DocumentPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['document_type', 'status', 'is_public', 'athlete', 'school', 'tournament', 'guardian']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'file_size']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """Filter documents based on user permissions"""
        user = self.request.user
        queryset = Document.objects.all()
        
        # SuperAdmin can see all documents
        if user.role == 'SuperAdmin':
            return queryset
        
        # SchoolAdmin can see their school's documents
        if user.role == 'SchoolAdmin' and hasattr(user, 'school'):
            return queryset.filter(
                models.Q(uploaded_by=user) |
                models.Q(school=user.school) |
                models.Q(is_public=True)
            )
        
        # Regular users can only see their own documents and public ones
        return queryset.filter(
            models.Q(uploaded_by=user) |
            models.Q(is_public=True)
        )
    
    def perform_create(self, serializer):
        """Create document and process file"""
        document = serializer.save()
        
        # Process file asynchronously (or synchronously for now)
        try:
            file_service = FileProcessingService()
            file_service.process_uploaded_file(document)
        except Exception as e:
            # Log error but don't fail the upload
            print(f"Error processing file: {e}")
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download document file"""
        document = self.get_object()
        
        # Check if user has permission to download
        if not self._can_download(request.user, document):
            raise PermissionDenied("You don't have permission to download this file")
        
        # Check if file exists
        storage_service = FileStorageService()
        if not storage_service.file_exists(document):
            raise Http404("File not found")
        
        # Serve file
        file_path = storage_service.get_file_path(document)
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=document.mime_type)
            response['Content-Disposition'] = f'attachment; filename="{document.file.name}"'
            return response
    
    @action(detail=True, methods=['get'])
    def processed_images(self, request, pk=None):
        """Get processed images for document"""
        document = self.get_object()
        processed_images = document.processed_images.all()
        serializer = ProcessedImageSerializer(processed_images, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """Reprocess document file"""
        document = self.get_object()
        
        # Check permission
        if document.uploaded_by != request.user and request.user.role != 'SuperAdmin':
            raise PermissionDenied("You can only reprocess your own documents")
        
        try:
            file_service = FileProcessingService()
            result = file_service.process_uploaded_file(document)
            
            return Response({
                'success': True,
                'message': 'File reprocessed successfully',
                'data': result
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error reprocessing file: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _can_download(self, user, document):
        """Check if user can download document"""
        # Public documents can be downloaded by anyone
        if document.is_public:
            return True
        
        # Owner can always download
        if document.uploaded_by == user:
            return True
        
        # SuperAdmin can download anything
        if user.role == 'SuperAdmin':
            return True
        
        # SchoolAdmin can download their school's documents
        if user.role == 'SchoolAdmin' and hasattr(user, 'school'):
            return document.school == user.school
        
        return False


class FileUploadView(viewsets.GenericViewSet):
    """Dedicated view for file uploads"""
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload single file"""
        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                document = serializer.save()
                
                # Process file
                file_service = FileProcessingService()
                file_service.process_uploaded_file(document)
                
                response_serializer = FileUploadResponseSerializer({
                    'success': True,
                    'message': 'File uploaded successfully',
                    'document': DocumentSerializer(document, context={'request': request}).data
                })
                
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                return Response({
                    'success': False,
                    'message': f'Error uploading file: {str(e)}',
                    'errors': {}
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Upload multiple files"""
        files = request.FILES.getlist('files')
        
        if not files:
            return Response({
                'success': False,
                'message': 'No files provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        errors = []
        
        for file in files:
            try:
                # Create document data
                document_data = {
                    'file': file,
                    'title': file.name,
                    'document_type': request.data.get('document_type', 'other'),
                    'description': request.data.get('description', ''),
                }
                
                serializer = DocumentUploadSerializer(data=document_data, context={'request': request})
                
                if serializer.is_valid():
                    document = serializer.save()
                    
                    # Process file
                    file_service = FileProcessingService()
                    file_service.process_uploaded_file(document)
                    
                    results.append({
                        'filename': file.name,
                        'document': DocumentSerializer(document, context={'request': request}).data,
                        'success': True
                    })
                else:
                    errors.append({
                        'filename': file.name,
                        'errors': serializer.errors,
                        'success': False
                    })
            
            except Exception as e:
                errors.append({
                    'filename': file.name,
                    'error': str(e),
                    'success': False
                })
        
        return Response({
            'success': len(errors) == 0,
            'message': f'Processed {len(files)} files. {len(results)} successful, {len(errors)} failed.',
            'results': results,
            'errors': errors
        }, status=status.HTTP_200_OK if len(errors) == 0 else status.HTTP_207_MULTI_STATUS)


class PDFTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for PDF template management"""
    
    queryset = PDFTemplate.objects.all()
    serializer_class = PDFTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['template_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter templates based on user permissions"""
        user = self.request.user
        
        # SuperAdmin can see all templates
        if user.role == 'SuperAdmin':
            return PDFTemplate.objects.all()
        
        # Other users can only see active templates
        return PDFTemplate.objects.filter(is_active=True)


class GeneratedPDFViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing generated PDFs"""
    
    queryset = GeneratedPDF.objects.all()
    serializer_class = GeneratedPDFSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['template', 'athlete', 'tournament']
    search_fields = ['title']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter PDFs based on user permissions"""
        user = self.request.user
        queryset = GeneratedPDF.objects.all()
        
        # SuperAdmin can see all PDFs
        if user.role == 'SuperAdmin':
            return queryset
        
        # Users can only see their own generated PDFs
        return queryset.filter(generated_by=user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download generated PDF"""
        pdf = self.get_object()
        
        # Check if file exists
        if not pdf.pdf_file or not os.path.exists(pdf.pdf_file.path):
            raise Http404("PDF file not found")
        
        # Serve file
        with open(pdf.pdf_file.path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{pdf.title}.pdf"'
            return response
