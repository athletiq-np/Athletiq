import os
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Document
from .services.file_service import FileProcessingService, FileStorageService


@receiver(post_save, sender=Document)
def process_uploaded_document(sender, instance, created, **kwargs):
    """Process document after it's saved"""
    if created and instance.file:
        # Create directory structure for user
        storage_service = FileStorageService()
        storage_service.create_directory_structure(instance.uploaded_by.user_id)
        
        # Process file asynchronously (for now, synchronously)
        try:
            file_service = FileProcessingService()
            file_service.process_uploaded_file(instance)
        except Exception as e:
            print(f"Error processing document {instance.document_id}: {e}")


@receiver(post_delete, sender=Document)
def delete_document_files(sender, instance, **kwargs):
    """Delete associated files when document is deleted"""
    try:
        file_service = FileProcessingService()
        file_service.delete_processed_files(instance)
    except Exception as e:
        print(f"Error deleting files for document {instance.document_id}: {e}")