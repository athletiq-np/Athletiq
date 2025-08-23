"""
Celery tasks for asynchronous document processing.
"""
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List
from celery import shared_task
from django.conf import settings
from django.core.files.storage import default_storage
from django.utils import timezone
from .services.pdf_service import PDFService
from .services.ocr_service import OCRService
from .services.file_service import FileService
from .models import Document, DocumentProcessingJob

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_scoresheet_pdf_task(self, tournament_id: int, match_data: Dict[str, Any]):
    """
    Asynchronous task to generate scoresheet PDF.
    
    Args:
        tournament_id: Tournament ID
        match_data: Match data for scoresheet generation
        
    Returns:
        Dict with task result including PDF file path
    """
    try:
        logger.info(f"Starting scoresheet PDF generation for tournament {tournament_id}")
        
        pdf_service = PDFService()
        result = pdf_service.generate_scoresheet(tournament_id, match_data)
        
        if result['success']:
            logger.info(f"Scoresheet PDF generated successfully: {result['file_path']}")
        else:
            logger.error(f"Scoresheet PDF generation failed: {result['message']}")
        
        return result
        
    except Exception as exc:
        logger.error(f"Scoresheet PDF generation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_certificate_pdf_task(self, athlete_id: int, tournament_id: int, certificate_data: Dict[str, Any]):
    """
    Asynchronous task to generate certificate PDF.
    
    Args:
        athlete_id: Athlete ID
        tournament_id: Tournament ID
        certificate_data: Certificate data for PDF generation
        
    Returns:
        Dict with task result including PDF file path
    """
    try:
        logger.info(f"Starting certificate PDF generation for athlete {athlete_id}, tournament {tournament_id}")
        
        pdf_service = PDFService()
        result = pdf_service.generate_certificate(athlete_id, tournament_id, certificate_data)
        
        if result['success']:
            logger.info(f"Certificate PDF generated successfully: {result['file_path']}")
        else:
            logger.error(f"Certificate PDF generation failed: {result['message']}")
        
        return result
        
    except Exception as exc:
        logger.error(f"Certificate PDF generation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def batch_generate_certificates_task(self, tournament_id: int, athlete_ids: List[int]):
    """
    Asynchronous task to generate certificates for multiple athletes.
    
    Args:
        tournament_id: Tournament ID
        athlete_ids: List of athlete IDs
        
    Returns:
        Dict with batch generation results
    """
    try:
        logger.info(f"Starting batch certificate generation for {len(athlete_ids)} athletes")
        
        pdf_service = PDFService()
        results = []
        successful_count = 0
        failed_count = 0
        
        for athlete_id in athlete_ids:
            try:
                result = pdf_service.generate_certificate(athlete_id, tournament_id)
                results.append({
                    'athlete_id': athlete_id,
                    'success': result['success'],
                    'file_path': result.get('file_path'),
                    'message': result.get('message')
                })
                
                if result['success']:
                    successful_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"Failed to generate certificate for athlete {athlete_id}: {str(e)}")
                results.append({
                    'athlete_id': athlete_id,
                    'success': False,
                    'message': str(e)
                })
                failed_count += 1
        
        logger.info(f"Batch certificate generation completed: {successful_count} successful, {failed_count} failed")
        
        return {
            'success': True,
            'total_processed': len(athlete_ids),
            'successful_count': successful_count,
            'failed_count': failed_count,
            'results': results
        }
        
    except Exception as exc:
        logger.error(f"Batch certificate generation task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_ocr_document_task(self, document_id: int):
    """
    Asynchronous task to process document with OCR.
    
    Args:
        document_id: Document ID to process
        
    Returns:
        Dict with OCR processing result
    """
    try:
        logger.info(f"Starting OCR processing for document {document_id}")
        
        # Get document
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return {
                'success': False,
                'message': f'Document {document_id} not found'
            }
        
        # Process with OCR
        ocr_service = OCRService()
        result = ocr_service.extract_text_from_document(document.file.path)
        
        if result['success']:
            # Update document with extracted text
            document.extracted_text = result['text']
            document.ocr_confidence = result.get('confidence', 0.0)
            document.processing_status = 'completed'
            document.save()
            
            logger.info(f"OCR processing completed for document {document_id}")
        else:
            document.processing_status = 'failed'
            document.save()
            logger.error(f"OCR processing failed for document {document_id}: {result['message']}")
        
        return result
        
    except Exception as exc:
        logger.error(f"OCR processing task failed for document {document_id}: {str(exc)}")
        
        # Update document status on failure
        try:
            document = Document.objects.get(id=document_id)
            document.processing_status = 'failed'
            document.save()
        except:
            pass
        
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def batch_process_documents_task(self, document_ids: List[int]):
    """
    Asynchronous task to process multiple documents with OCR.
    
    Args:
        document_ids: List of document IDs to process
        
    Returns:
        Dict with batch processing results
    """
    try:
        logger.info(f"Starting batch OCR processing for {len(document_ids)} documents")
        
        results = []
        successful_count = 0
        failed_count = 0
        
        for document_id in document_ids:
            try:
                # Process each document
                result = process_ocr_document_task.apply(args=[document_id])
                results.append({
                    'document_id': document_id,
                    'success': result.get('success', False),
                    'message': result.get('message', '')
                })
                
                if result.get('success'):
                    successful_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"Failed to process document {document_id}: {str(e)}")
                results.append({
                    'document_id': document_id,
                    'success': False,
                    'message': str(e)
                })
                failed_count += 1
        
        logger.info(f"Batch OCR processing completed: {successful_count} successful, {failed_count} failed")
        
        return {
            'success': True,
            'total_processed': len(document_ids),
            'successful_count': successful_count,
            'failed_count': failed_count,
            'results': results
        }
        
    except Exception as exc:
        logger.error(f"Batch OCR processing task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def cleanup_old_documents():
    """
    Periodic task to cleanup old temporary documents and files.
    This task should be scheduled to run daily.
    
    Returns:
        Dict with cleanup results
    """
    try:
        logger.info("Starting cleanup of old documents")
        
        # Clean up temporary files older than 7 days
        temp_cutoff = timezone.now() - timedelta(days=7)
        temp_documents = Document.objects.filter(
            document_type='temporary',
            created_at__lt=temp_cutoff
        )
        
        deleted_files = 0
        deleted_records = 0
        
        for document in temp_documents:
            try:
                # Delete physical file
                if document.file and default_storage.exists(document.file.name):
                    default_storage.delete(document.file.name)
                    deleted_files += 1
                
                # Delete database record
                document.delete()
                deleted_records += 1
                
            except Exception as e:
                logger.error(f"Failed to delete document {document.id}: {str(e)}")
        
        # Clean up failed processing jobs older than 3 days
        failed_cutoff = timezone.now() - timedelta(days=3)
        failed_jobs = DocumentProcessingJob.objects.filter(
            status='failed',
            created_at__lt=failed_cutoff
        )
        deleted_jobs = failed_jobs.count()
        failed_jobs.delete()
        
        # Clean up orphaned files in media directory
        orphaned_files = _cleanup_orphaned_files()
        
        logger.info(f"Document cleanup completed: {deleted_files} files, {deleted_records} records, {deleted_jobs} jobs, {orphaned_files} orphaned files")
        
        return {
            'success': True,
            'deleted_files': deleted_files,
            'deleted_records': deleted_records,
            'deleted_jobs': deleted_jobs,
            'orphaned_files': orphaned_files,
            'message': f'Cleaned up {deleted_files} files and {deleted_records} records'
        }
        
    except Exception as exc:
        logger.error(f"Document cleanup task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=300 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def optimize_document_storage_task(self):
    """
    Asynchronous task to optimize document storage by compressing images and PDFs.
    
    Returns:
        Dict with optimization results
    """
    try:
        logger.info("Starting document storage optimization")
        
        file_service = FileService()
        
        # Find large image files that can be optimized
        large_documents = Document.objects.filter(
            document_type__in=['image', 'photo'],
            file_size__gt=1024 * 1024,  # Files larger than 1MB
            optimized=False
        )[:50]  # Process 50 at a time
        
        optimized_count = 0
        space_saved = 0
        
        for document in large_documents:
            try:
                original_size = document.file_size
                result = file_service.optimize_image(document.file.path)
                
                if result['success']:
                    new_size = result['new_size']
                    space_saved += (original_size - new_size)
                    
                    # Update document record
                    document.file_size = new_size
                    document.optimized = True
                    document.save()
                    
                    optimized_count += 1
                    logger.info(f"Optimized document {document.id}: {original_size} -> {new_size} bytes")
                
            except Exception as e:
                logger.error(f"Failed to optimize document {document.id}: {str(e)}")
        
        logger.info(f"Document optimization completed: {optimized_count} files optimized, {space_saved} bytes saved")
        
        return {
            'success': True,
            'optimized_count': optimized_count,
            'space_saved': space_saved,
            'message': f'Optimized {optimized_count} documents, saved {space_saved} bytes'
        }
        
    except Exception as exc:
        logger.error(f"Document optimization task failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


def _cleanup_orphaned_files():
    """
    Helper function to cleanup orphaned files in media directory.
    
    Returns:
        Number of orphaned files cleaned up
    """
    try:
        media_root = settings.MEDIA_ROOT
        if not os.path.exists(media_root):
            return 0
        
        orphaned_count = 0
        
        # Walk through media directory
        for root, dirs, files in os.walk(media_root):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, media_root)
                
                # Check if file is referenced in database
                if not Document.objects.filter(file=relative_path).exists():
                    try:
                        os.remove(file_path)
                        orphaned_count += 1
                        logger.info(f"Removed orphaned file: {relative_path}")
                    except Exception as e:
                        logger.error(f"Failed to remove orphaned file {relative_path}: {str(e)}")
        
        return orphaned_count
        
    except Exception as e:
        logger.error(f"Failed to cleanup orphaned files: {str(e)}")
        return 0