from rest_framework import serializers
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
from .models import Document, ProcessedImage, OCRResult, PDFTemplate, GeneratedPDF
from .validators import validate_file_size, validate_file_type, validate_image_dimensions


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for document upload"""
    
    class Meta:
        model = Document
        fields = [
            'document_id', 'title', 'description', 'document_type', 'file',
            'file_size', 'mime_type', 'status', 'is_public', 'created_at',
            'athlete', 'school', 'tournament', 'guardian'
        ]
        read_only_fields = ['document_id', 'file_size', 'mime_type', 'status', 'created_at']
    
    def validate_file(self, value):
        """Validate uploaded file"""
        if not value:
            raise serializers.ValidationError("No file provided")
        
        # Validate file size
        validate_file_size(value)
        
        # Validate file type
        validate_file_type(value)
        
        # Additional validation for images
        if hasattr(value, 'content_type') and value.content_type.startswith('image/'):
            validate_image_dimensions(value)
        
        return value
    
    def create(self, validated_data):
        """Create document with uploaded by user"""
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for document details"""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'document_id', 'title', 'description', 'document_type', 'file',
            'file_size', 'mime_type', 'uploaded_by', 'uploaded_by_name',
            'status', 'processing_result', 'is_public', 'created_at', 'updated_at',
            'file_url', 'athlete', 'school', 'tournament', 'guardian'
        ]
        read_only_fields = [
            'document_id', 'file_size', 'mime_type', 'uploaded_by',
            'uploaded_by_name', 'created_at', 'updated_at', 'file_url'
        ]
    
    def get_file_url(self, obj):
        """Get file URL"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ProcessedImageSerializer(serializers.ModelSerializer):
    """Serializer for processed images"""
    
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcessedImage
        fields = [
            'image_id', 'original_document', 'image', 'width', 'height',
            'file_size', 'quality', 'is_thumbnail', 'created_at', 'image_url'
        ]
        read_only_fields = ['image_id', 'created_at', 'image_url']
    
    def get_image_url(self, obj):
        """Get image URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class OCRResultSerializer(serializers.ModelSerializer):
    """Serializer for OCR results"""
    
    class Meta:
        model = OCRResult
        fields = [
            'ocr_id', 'document', 'extracted_text', 'confidence_score',
            'language_detected', 'processing_time', 'metadata', 'created_at'
        ]
        read_only_fields = ['ocr_id', 'created_at']


class PDFTemplateSerializer(serializers.ModelSerializer):
    """Serializer for PDF templates"""
    
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = PDFTemplate
        fields = [
            'template_id', 'name', 'template_type', 'description', 'template_file',
            'is_active', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['template_id', 'created_by_name', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create template with created by user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class GeneratedPDFSerializer(serializers.ModelSerializer):
    """Serializer for generated PDFs"""
    
    generated_by_name = serializers.CharField(source='generated_by.full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedPDF
        fields = [
            'pdf_id', 'title', 'template', 'template_name', 'pdf_file',
            'generation_data', 'generated_by', 'generated_by_name',
            'file_size', 'created_at', 'pdf_url', 'athlete', 'tournament'
        ]
        read_only_fields = [
            'pdf_id', 'template_name', 'generated_by_name', 'file_size',
            'created_at', 'pdf_url'
        ]
    
    def get_pdf_url(self, obj):
        """Get PDF URL"""
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None
    
    def create(self, validated_data):
        """Create PDF with generated by user"""
        validated_data['generated_by'] = self.context['request'].user
        return super().create(validated_data)


class FileUploadResponseSerializer(serializers.Serializer):
    """Serializer for file upload response"""
    
    success = serializers.BooleanField()
    message = serializers.CharField()
    document = DocumentSerializer(required=False)
    errors = serializers.DictField(required=False)


class PDFGenerationRequestSerializer(serializers.Serializer):
    """Serializer for PDF generation request"""
    
    template_id = serializers.IntegerField()
    title = serializers.CharField(max_length=255)
    data = serializers.JSONField()
    athlete_id = serializers.IntegerField(required=False)
    tournament_id = serializers.IntegerField(required=False)
    
    def validate_template_id(self, value):
        """Validate template exists and is active"""
        try:
            template = PDFTemplate.objects.get(template_id=value, is_active=True)
        except PDFTemplate.DoesNotExist:
            raise serializers.ValidationError("Template not found or inactive")
        return value


class OCRRequestSerializer(serializers.Serializer):
    """Serializer for OCR processing request"""
    
    document_id = serializers.IntegerField()
    language = serializers.CharField(max_length=10, default='en')
    
    def validate_document_id(self, value):
        """Validate document exists and is an image"""
        try:
            document = Document.objects.get(document_id=value)
            if not document.mime_type.startswith('image/'):
                raise serializers.ValidationError("Document must be an image")
        except Document.DoesNotExist:
            raise serializers.ValidationError("Document not found")
        return value