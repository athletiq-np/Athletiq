import os
import uuid
from PIL import Image, ImageOps
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings
from ..models import Document, ProcessedImage
from ..validators import sanitize_filename


class FileProcessingService:
    """Service for processing uploaded files"""
    
    def __init__(self):
        self.thumbnail_size = (300, 300)
        self.optimized_size = (1200, 1200)
        self.jpeg_quality = 85
    
    def process_uploaded_file(self, document):
        """Process uploaded file based on type"""
        try:
            if document.mime_type.startswith('image/'):
                return self._process_image(document)
            elif document.mime_type == 'application/pdf':
                return self._process_pdf(document)
            else:
                return self._process_document(document)
        except Exception as e:
            document.status = 'failed'
            document.processing_result = {'error': str(e)}
            document.save()
            raise
    
    def _process_image(self, document):
        """Process image file - create thumbnail and optimized version"""
        try:
            document.status = 'processing'
            document.save()
            
            # Open the image
            image = Image.open(document.file.path)
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            
            # Auto-orient based on EXIF data
            image = ImageOps.exif_transpose(image)
            
            original_size = image.size
            
            # Create thumbnail
            thumbnail = self._create_thumbnail(image, document)
            
            # Create optimized version if image is large
            optimized = None
            if original_size[0] > self.optimized_size[0] or original_size[1] > self.optimized_size[1]:
                optimized = self._create_optimized_image(image, document)
            
            # Update document status
            document.status = 'completed'
            document.processing_result = {
                'original_size': original_size,
                'thumbnail_created': thumbnail is not None,
                'optimized_created': optimized is not None,
            }
            document.save()
            
            return {
                'thumbnail': thumbnail,
                'optimized': optimized,
                'original_size': original_size
            }
        
        except Exception as e:
            document.status = 'failed'
            document.processing_result = {'error': str(e)}
            document.save()
            raise
    
    def _create_thumbnail(self, image, document):
        """Create thumbnail image"""
        try:
            # Create thumbnail
            thumbnail_image = image.copy()
            thumbnail_image.thumbnail(self.thumbnail_size, Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumbnail_io = BytesIO()
            thumbnail_image.save(thumbnail_io, format='JPEG', quality=self.jpeg_quality, optimize=True)
            thumbnail_io.seek(0)
            
            # Create ProcessedImage record
            thumbnail = ProcessedImage.objects.create(
                original_document=document,
                width=thumbnail_image.size[0],
                height=thumbnail_image.size[1],
                file_size=len(thumbnail_io.getvalue()),
                quality=self.jpeg_quality,
                is_thumbnail=True
            )
            
            # Save the file
            filename = f"thumb_{uuid.uuid4()}.jpg"
            thumbnail.image.save(
                filename,
                ContentFile(thumbnail_io.getvalue()),
                save=True
            )
            
            return thumbnail
        
        except Exception as e:
            print(f"Error creating thumbnail: {e}")
            return None
    
    def _create_optimized_image(self, image, document):
        """Create optimized version of large image"""
        try:
            # Create optimized version
            optimized_image = image.copy()
            optimized_image.thumbnail(self.optimized_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            optimized_io = BytesIO()
            optimized_image.save(optimized_io, format='JPEG', quality=self.jpeg_quality, optimize=True)
            optimized_io.seek(0)
            
            # Create ProcessedImage record
            optimized = ProcessedImage.objects.create(
                original_document=document,
                width=optimized_image.size[0],
                height=optimized_image.size[1],
                file_size=len(optimized_io.getvalue()),
                quality=self.jpeg_quality,
                is_thumbnail=False
            )
            
            # Save the file
            filename = f"opt_{uuid.uuid4()}.jpg"
            optimized.image.save(
                filename,
                ContentFile(optimized_io.getvalue()),
                save=True
            )
            
            return optimized
        
        except Exception as e:
            print(f"Error creating optimized image: {e}")
            return None
    
    def _process_pdf(self, document):
        """Process PDF file"""
        try:
            document.status = 'processing'
            document.save()
            
            # Basic PDF processing - just mark as completed
            # Additional PDF processing can be added here (e.g., text extraction, page count)
            
            document.status = 'completed'
            document.processing_result = {
                'file_type': 'pdf',
                'processed_at': document.updated_at.isoformat()
            }
            document.save()
            
            return {'status': 'completed'}
        
        except Exception as e:
            document.status = 'failed'
            document.processing_result = {'error': str(e)}
            document.save()
            raise
    
    def _process_document(self, document):
        """Process other document types"""
        try:
            document.status = 'processing'
            document.save()
            
            # Basic document processing - just mark as completed
            document.status = 'completed'
            document.processing_result = {
                'file_type': document.mime_type,
                'processed_at': document.updated_at.isoformat()
            }
            document.save()
            
            return {'status': 'completed'}
        
        except Exception as e:
            document.status = 'failed'
            document.processing_result = {'error': str(e)}
            document.save()
            raise
    
    def delete_processed_files(self, document):
        """Delete all processed files for a document"""
        try:
            # Delete processed images
            for processed_image in document.processed_images.all():
                if processed_image.image and os.path.exists(processed_image.image.path):
                    os.remove(processed_image.image.path)
                processed_image.delete()
            
            # Delete original file
            if document.file and os.path.exists(document.file.path):
                os.remove(document.file.path)
        
        except Exception as e:
            print(f"Error deleting processed files: {e}")


class FileStorageService:
    """Service for managing file storage"""
    
    def __init__(self):
        self.media_root = settings.MEDIA_ROOT
    
    def get_file_path(self, document):
        """Get full file path for document"""
        if document.file:
            return os.path.join(self.media_root, document.file.name)
        return None
    
    def file_exists(self, document):
        """Check if file exists on disk"""
        file_path = self.get_file_path(document)
        return file_path and os.path.exists(file_path)
    
    def get_file_size(self, document):
        """Get actual file size from disk"""
        file_path = self.get_file_path(document)
        if file_path and os.path.exists(file_path):
            return os.path.getsize(file_path)
        return 0
    
    def create_directory_structure(self, user_id):
        """Create directory structure for user uploads"""
        directories = [
            os.path.join(self.media_root, 'documents', str(user_id)),
            os.path.join(self.media_root, 'images', str(user_id)),
            os.path.join(self.media_root, 'generated_pdfs'),
            os.path.join(self.media_root, 'pdf_templates'),
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def cleanup_orphaned_files(self):
        """Clean up files that don't have corresponding database records"""
        # This would be implemented as a management command
        pass