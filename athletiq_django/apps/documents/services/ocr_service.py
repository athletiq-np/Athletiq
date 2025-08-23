import time
from io import BytesIO
from django.conf import settings
from PIL import Image
from ..models import Document, OCRResult

# Optional imports for Google Vision API
try:
    from google.cloud import vision
    HAS_GOOGLE_VISION = True
except ImportError:
    HAS_GOOGLE_VISION = False

# Optional imports for Tesseract OCR
try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


class OCRService:
    """Service for OCR text extraction from images"""
    
    def __init__(self):
        self.google_client = None
        if HAS_GOOGLE_VISION:
            try:
                self.google_client = vision.ImageAnnotatorClient()
            except Exception as e:
                print(f"Failed to initialize Google Vision client: {e}")
    
    def extract_text_from_document(self, document, language='en'):
        """Extract text from a document using OCR"""
        if not document.mime_type.startswith('image/'):
            raise ValueError("Document must be an image for OCR processing")
        
        start_time = time.time()
        
        try:
            # Try Google Vision API first if available
            if self.google_client:
                result = self._extract_with_google_vision(document, language)
            elif HAS_TESSERACT:
                result = self._extract_with_tesseract(document, language)
            else:
                # Fallback to mock OCR for testing
                result = self._mock_ocr_extraction(document, language)
            
            processing_time = time.time() - start_time
            
            # Save OCR result
            ocr_result = OCRResult.objects.create(
                document=document,
                extracted_text=result['text'],
                confidence_score=result.get('confidence'),
                language_detected=result.get('language', language),
                processing_time=processing_time,
                metadata=result.get('metadata', {})
            )
            
            # Update document status
            document.status = 'completed'
            document.processing_result = {
                'ocr_completed': True,
                'text_length': len(result['text']),
                'confidence': result.get('confidence'),
                'processing_time': processing_time
            }
            document.save()
            
            return ocr_result
            
        except Exception as e:
            # Update document status to failed
            document.status = 'failed'
            document.processing_result = {
                'ocr_failed': True,
                'error': str(e),
                'processing_time': time.time() - start_time
            }
            document.save()
            raise Exception(f"OCR processing failed: {str(e)}")
    
    def _extract_with_google_vision(self, document, language):
        """Extract text using Google Vision API"""
        try:
            # Read image file
            with document.file.open('rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Configure image context for language hints
            image_context = vision.ImageContext(language_hints=[language])
            
            # Perform text detection
            response = self.google_client.text_detection(
                image=image,
                image_context=image_context
            )
            
            texts = response.text_annotations
            
            if response.error.message:
                raise Exception(f"Google Vision API error: {response.error.message}")
            
            if not texts:
                return {
                    'text': '',
                    'confidence': 0.0,
                    'language': language,
                    'metadata': {'method': 'google_vision', 'blocks': 0}
                }
            
            # First annotation contains the full text
            full_text = texts[0].description
            
            # Calculate average confidence from all text blocks
            confidences = []
            for text in texts[1:]:  # Skip the first one as it's the full text
                if hasattr(text, 'confidence'):
                    confidences.append(text.confidence)
            
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            # Detect language from the response
            detected_language = language
            if hasattr(response, 'full_text_annotation') and response.full_text_annotation:
                pages = response.full_text_annotation.pages
                if pages and pages[0].property and pages[0].property.detected_languages:
                    detected_language = pages[0].property.detected_languages[0].language_code
            
            return {
                'text': full_text,
                'confidence': avg_confidence,
                'language': detected_language,
                'metadata': {
                    'method': 'google_vision',
                    'blocks': len(texts) - 1,
                    'api_response_size': len(str(response))
                }
            }
            
        except Exception as e:
            raise Exception(f"Google Vision OCR failed: {str(e)}")
    
    def _extract_with_tesseract(self, document, language):
        """Extract text using Tesseract OCR"""
        try:
            # Open image with PIL
            image = Image.open(document.file.path)
            
            # Configure Tesseract
            config = f'--oem 3 --psm 6 -l {language}'
            
            # Extract text
            text = pytesseract.image_to_string(image, config=config)
            
            # Get confidence data
            data = pytesseract.image_to_data(image, config=config, output_type=pytesseract.Output.DICT)
            
            # Calculate average confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return {
                'text': text.strip(),
                'confidence': avg_confidence / 100.0,  # Convert to 0-1 scale
                'language': language,
                'metadata': {
                    'method': 'tesseract',
                    'words_detected': len([w for w in data['text'] if w.strip()]),
                    'avg_confidence': avg_confidence
                }
            }
            
        except Exception as e:
            raise Exception(f"Tesseract OCR failed: {str(e)}")
    
    def _mock_ocr_extraction(self, document, language):
        """Mock OCR extraction for testing when no OCR engine is available"""
        # This is a fallback for testing purposes
        mock_text = f"Mock OCR text extracted from {document.title}. " \
                   f"This is a placeholder text for testing purposes. " \
                   f"Language: {language}. File: {document.file.name}"
        
        return {
            'text': mock_text,
            'confidence': 0.85,
            'language': language,
            'metadata': {
                'method': 'mock',
                'note': 'This is mock OCR data for testing'
            }
        }
    
    def get_ocr_result(self, document):
        """Get existing OCR result for a document"""
        try:
            return document.ocr_result
        except OCRResult.DoesNotExist:
            return None
    
    def reprocess_document(self, document, language='en'):
        """Reprocess a document for OCR"""
        # Delete existing OCR result if it exists
        try:
            existing_result = document.ocr_result
            existing_result.delete()
        except OCRResult.DoesNotExist:
            pass
        
        # Extract text again
        return self.extract_text_from_document(document, language)
    
    def batch_process_documents(self, documents, language='en'):
        """Process multiple documents for OCR"""
        results = []
        errors = []
        
        for document in documents:
            try:
                if not document.mime_type.startswith('image/'):
                    errors.append({
                        'document_id': document.document_id,
                        'error': 'Document is not an image'
                    })
                    continue
                
                # Skip if already processed
                if hasattr(document, 'ocr_result'):
                    results.append({
                        'document_id': document.document_id,
                        'status': 'already_processed',
                        'ocr_result': document.ocr_result
                    })
                    continue
                
                ocr_result = self.extract_text_from_document(document, language)
                results.append({
                    'document_id': document.document_id,
                    'status': 'success',
                    'ocr_result': ocr_result
                })
                
            except Exception as e:
                errors.append({
                    'document_id': document.document_id,
                    'error': str(e)
                })
        
        return {
            'results': results,
            'errors': errors,
            'total_processed': len(results),
            'total_errors': len(errors)
        }
    
    def search_documents_by_text(self, query, user=None):
        """Search documents by OCR extracted text"""
        ocr_results = OCRResult.objects.filter(
            extracted_text__icontains=query
        )
        
        # Filter by user permissions if provided
        if user:
            if user.role != 'SuperAdmin':
                ocr_results = ocr_results.filter(document__uploaded_by=user)
        
        return ocr_results.select_related('document')
    
    def get_text_statistics(self, document):
        """Get statistics about extracted text"""
        try:
            ocr_result = document.ocr_result
            text = ocr_result.extracted_text
            
            words = text.split()
            lines = text.split('\n')
            
            return {
                'character_count': len(text),
                'word_count': len(words),
                'line_count': len(lines),
                'confidence_score': ocr_result.confidence_score,
                'language': ocr_result.language_detected,
                'processing_time': ocr_result.processing_time,
                'average_word_length': sum(len(word) for word in words) / len(words) if words else 0
            }
            
        except OCRResult.DoesNotExist:
            return None


class DocumentProcessingService:
    """Service for general document processing workflows"""
    
    def __init__(self):
        self.ocr_service = OCRService()
    
    def process_uploaded_document(self, document):
        """Process a newly uploaded document"""
        processing_results = {}
        
        try:
            # Update status
            document.status = 'processing'
            document.save()
            
            # Process based on document type
            if document.mime_type.startswith('image/'):
                # Process image and extract text
                ocr_result = self.ocr_service.extract_text_from_document(document)
                processing_results['ocr'] = {
                    'success': True,
                    'text_length': len(ocr_result.extracted_text),
                    'confidence': ocr_result.confidence_score
                }
            
            elif document.mime_type == 'application/pdf':
                # PDF processing (placeholder for future implementation)
                processing_results['pdf'] = {
                    'success': True,
                    'note': 'PDF processing not yet implemented'
                }
            
            else:
                # Other document types
                processing_results['general'] = {
                    'success': True,
                    'note': 'General document processing completed'
                }
            
            # Update document status
            document.status = 'completed'
            document.processing_result.update(processing_results)
            document.save()
            
            return processing_results
            
        except Exception as e:
            document.status = 'failed'
            document.processing_result = {
                'error': str(e),
                'processing_failed': True
            }
            document.save()
            raise
    
    def validate_document_content(self, document):
        """Validate document content and structure"""
        validation_results = {
            'is_valid': True,
            'issues': [],
            'warnings': []
        }
        
        try:
            # Check file size
            if document.file_size > 50 * 1024 * 1024:  # 50MB
                validation_results['warnings'].append('File size is very large')
            
            # Check if file exists
            if not document.file or not document.file.storage.exists(document.file.name):
                validation_results['is_valid'] = False
                validation_results['issues'].append('File does not exist')
            
            # Validate image files
            if document.mime_type.startswith('image/'):
                try:
                    image = Image.open(document.file.path)
                    width, height = image.size
                    
                    if width < 100 or height < 100:
                        validation_results['warnings'].append('Image resolution is very low')
                    
                    if width > 4000 or height > 4000:
                        validation_results['warnings'].append('Image resolution is very high')
                        
                except Exception as e:
                    validation_results['is_valid'] = False
                    validation_results['issues'].append(f'Invalid image file: {str(e)}')
            
            return validation_results
            
        except Exception as e:
            validation_results['is_valid'] = False
            validation_results['issues'].append(f'Validation error: {str(e)}')
            return validation_results
    
    def get_processing_status(self, document):
        """Get detailed processing status for a document"""
        status_info = {
            'document_id': document.document_id,
            'status': document.status,
            'processing_result': document.processing_result,
            'created_at': document.created_at,
            'updated_at': document.updated_at
        }
        
        # Add OCR information if available
        try:
            ocr_result = document.ocr_result
            status_info['ocr'] = {
                'text_length': len(ocr_result.extracted_text),
                'confidence': ocr_result.confidence_score,
                'language': ocr_result.language_detected,
                'processing_time': ocr_result.processing_time
            }
        except OCRResult.DoesNotExist:
            status_info['ocr'] = None
        
        # Add validation information
        validation = self.validate_document_content(document)
        status_info['validation'] = validation
        
        return status_info