from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404

from ..models import PDFTemplate, GeneratedPDF
from ..serializers import (
    PDFTemplateSerializer, GeneratedPDFSerializer, 
    PDFGenerationRequestSerializer
)
from ..services.pdf_service import PDFGenerationService, PDFTemplateService
from ..permissions import PDFTemplatePermission, GeneratedPDFPermission
from core.permissions.base import IsAuthenticated


class PDFGenerationViewSet(viewsets.GenericViewSet):
    """ViewSet for PDF generation operations"""
    
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pdf_service = PDFGenerationService()
    
    @action(detail=False, methods=['post'])
    def generate_scoresheet(self, request):
        """Generate a scoresheet PDF"""
        try:
            tournament_data = request.data.get('tournament_data', {})
            match_data = request.data.get('match_data', {})
            
            if not tournament_data or not match_data:
                return Response({
                    'success': False,
                    'message': 'Tournament data and match data are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            generated_pdf = self.pdf_service.generate_scoresheet_pdf(
                tournament_data, match_data, request.user
            )
            
            serializer = GeneratedPDFSerializer(generated_pdf, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Scoresheet generated successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error generating scoresheet: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def generate_certificate(self, request):
        """Generate a certificate PDF"""
        try:
            athlete_data = request.data.get('athlete_data', {})
            tournament_data = request.data.get('tournament_data', {})
            
            if not athlete_data or not tournament_data:
                return Response({
                    'success': False,
                    'message': 'Athlete data and tournament data are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            generated_pdf = self.pdf_service.generate_certificate_pdf(
                athlete_data, tournament_data, request.user
            )
            
            serializer = GeneratedPDFSerializer(generated_pdf, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Certificate generated successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error generating certificate: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def generate_from_template(self, request):
        """Generate PDF from template"""
        serializer = PDFGenerationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validated_data = serializer.validated_data
            
            generated_pdf = self.pdf_service.generate_from_template(
                template_id=validated_data['template_id'],
                data=validated_data['data'],
                user=request.user,
                title=validated_data.get('title')
            )
            
            response_serializer = GeneratedPDFSerializer(generated_pdf, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'PDF generated successfully from template',
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error generating PDF from template: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """List available templates"""
        try:
            template_service = PDFTemplateService()
            template_type = request.query_params.get('type')
            
            templates = template_service.list_templates(template_type)
            serializer = PDFTemplateSerializer(templates, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error fetching templates: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PDFTemplateManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for PDF template management"""
    
    queryset = PDFTemplate.objects.filter(is_active=True)
    serializer_class = PDFTemplateSerializer
    permission_classes = [IsAuthenticated, PDFTemplatePermission]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.template_service = PDFTemplateService()
    
    def get_queryset(self):
        """Filter templates based on user permissions"""
        user = self.request.user
        
        # SuperAdmin can see all templates
        if user.role == 'SuperAdmin':
            return PDFTemplate.objects.filter(is_active=True)
        
        # Other users can only see active templates
        return PDFTemplate.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        """Create template with created_by user"""
        serializer.save(created_by=self.request.user)
    
    def perform_destroy(self, instance):
        """Soft delete template"""
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=['post'])
    def create_samples(self, request):
        """Create sample templates"""
        try:
            templates = self.template_service.create_sample_templates(request.user)
            serializer = PDFTemplateSerializer(templates, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'message': f'Created {len(templates)} sample templates',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error creating sample templates: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a template"""
        try:
            template = self.get_object()
            
            # Create a copy
            new_template = PDFTemplate.objects.create(
                name=f"{template.name} (Copy)",
                template_type=template.template_type,
                description=f"Copy of {template.description}",
                template_file=template.template_file,
                created_by=request.user
            )
            
            serializer = PDFTemplateSerializer(new_template, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Template duplicated successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error duplicating template: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GeneratedPDFManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for managing generated PDFs"""
    
    queryset = GeneratedPDF.objects.all()
    serializer_class = GeneratedPDFSerializer
    permission_classes = [IsAuthenticated, GeneratedPDFPermission]
    
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
        if not pdf.pdf_file or not pdf.pdf_file.storage.exists(pdf.pdf_file.name):
            raise Http404("PDF file not found")
        
        # Serve file
        response = HttpResponse(pdf.pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{pdf.title}.pdf"'
        return response
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview generated PDF in browser"""
        pdf = self.get_object()
        
        # Check if file exists
        if not pdf.pdf_file or not pdf.pdf_file.storage.exists(pdf.pdf_file.name):
            raise Http404("PDF file not found")
        
        # Serve file for preview
        response = HttpResponse(pdf.pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{pdf.title}.pdf"'
        return response
    
    @action(detail=False, methods=['get'])
    def by_template(self, request):
        """Get PDFs by template"""
        template_id = request.query_params.get('template_id')
        
        if not template_id:
            return Response({
                'success': False,
                'message': 'template_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(template_id=template_id)
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get PDFs by generation type"""
        pdf_type = request.query_params.get('type')
        
        if not pdf_type:
            return Response({
                'success': False,
                'message': 'type parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(
            generation_data__type=pdf_type
        )
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })