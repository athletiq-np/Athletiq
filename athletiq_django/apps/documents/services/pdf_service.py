import os
import json
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings
from django.template.loader import render_to_string
from django.template import Template, Context
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib.colors import black, blue, red, green
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import uuid

from ..models import PDFTemplate, GeneratedPDF


class PDFGenerationService:
    """Service for generating PDFs from templates"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Set up custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=blue
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            alignment=TA_LEFT,
            textColor=black
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_LEFT
        ))
    
    def generate_scoresheet_pdf(self, tournament_data, match_data, user):
        """Generate a scoresheet PDF"""
        try:
            # Create PDF buffer
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []
            
            # Title
            title = f"Scoresheet - {tournament_data.get('name', 'Tournament')}"
            story.append(Paragraph(title, self.styles['CustomTitle']))
            story.append(Spacer(1, 20))
            
            # Tournament Information
            story.append(Paragraph("Tournament Information", self.styles['CustomHeading']))
            
            tournament_info = [
                ['Tournament:', tournament_data.get('name', 'N/A')],
                ['Date:', tournament_data.get('date', 'N/A')],
                ['Location:', tournament_data.get('location', 'N/A')],
                ['Sport:', tournament_data.get('sport', 'N/A')],
            ]
            
            tournament_table = Table(tournament_info, colWidths=[2*inch, 4*inch])
            tournament_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), '#f0f0f0'),
                ('TEXTCOLOR', (0, 0), (-1, -1), black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, black)
            ]))
            
            story.append(tournament_table)
            story.append(Spacer(1, 20))
            
            # Match Information
            story.append(Paragraph("Match Details", self.styles['CustomHeading']))
            
            match_info = [
                ['Team 1:', match_data.get('team1', 'N/A')],
                ['Team 2:', match_data.get('team2', 'N/A')],
                ['Match Time:', match_data.get('time', 'N/A')],
                ['Venue:', match_data.get('venue', 'N/A')],
            ]
            
            match_table = Table(match_info, colWidths=[2*inch, 4*inch])
            match_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), '#f0f0f0'),
                ('TEXTCOLOR', (0, 0), (-1, -1), black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, black)
            ]))
            
            story.append(match_table)
            story.append(Spacer(1, 30))
            
            # Score Section
            story.append(Paragraph("Score", self.styles['CustomHeading']))
            
            score_data = [
                ['Team', 'Set 1', 'Set 2', 'Set 3', 'Total'],
                [match_data.get('team1', 'Team 1'), '', '', '', ''],
                [match_data.get('team2', 'Team 2'), '', '', '', ''],
            ]
            
            score_table = Table(score_data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch, 1*inch])
            score_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), '#d0d0d0'),
                ('TEXTCOLOR', (0, 0), (-1, -1), black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, black)
            ]))
            
            story.append(score_table)
            story.append(Spacer(1, 30))
            
            # Officials Section
            story.append(Paragraph("Officials", self.styles['CustomHeading']))
            
            officials_data = [
                ['Referee:', ''],
                ['Umpire 1:', ''],
                ['Umpire 2:', ''],
                ['Scorer:', ''],
            ]
            
            officials_table = Table(officials_data, colWidths=[2*inch, 4*inch])
            officials_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), '#f0f0f0'),
                ('TEXTCOLOR', (0, 0), (-1, -1), black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, black)
            ]))
            
            story.append(officials_table)
            story.append(Spacer(1, 20))
            
            # Signatures
            story.append(Paragraph("Signatures", self.styles['CustomHeading']))
            
            signatures_data = [
                ['Referee Signature:', '', 'Date:', ''],
                ['Team 1 Captain:', '', 'Team 2 Captain:', ''],
            ]
            
            signatures_table = Table(signatures_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
            signatures_table.setStyle(TableStyle([
                ('TEXTCOLOR', (0, 0), (-1, -1), black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
                ('GRID', (0, 0), (-1, -1), 1, black)
            ]))
            
            story.append(signatures_table)
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            # Save to GeneratedPDF model
            filename = f"scoresheet_{uuid.uuid4()}.pdf"
            generated_pdf = GeneratedPDF.objects.create(
                title=f"Scoresheet - {tournament_data.get('name', 'Tournament')}",
                template=None,  # No template for programmatic generation
                generation_data={
                    'tournament_data': tournament_data,
                    'match_data': match_data,
                    'type': 'scoresheet'
                },
                generated_by=user,
                file_size=len(buffer.getvalue())
            )
            
            generated_pdf.pdf_file.save(
                filename,
                ContentFile(buffer.getvalue()),
                save=True
            )
            
            return generated_pdf
            
        except Exception as e:
            raise Exception(f"Error generating scoresheet PDF: {str(e)}")
    
    def generate_certificate_pdf(self, athlete_data, tournament_data, user):
        """Generate a certificate PDF"""
        try:
            # Create PDF buffer
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []
            
            # Add some space at the top
            story.append(Spacer(1, 50))
            
            # Certificate Title
            title_style = ParagraphStyle(
                name='CertificateTitle',
                parent=self.styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=blue
            )
            
            story.append(Paragraph("CERTIFICATE OF PARTICIPATION", title_style))
            story.append(Spacer(1, 30))
            
            # Certificate body
            body_style = ParagraphStyle(
                name='CertificateBody',
                parent=self.styles['Normal'],
                fontSize=14,
                spaceAfter=20,
                alignment=TA_CENTER,
                leading=20
            )
            
            story.append(Paragraph("This is to certify that", body_style))
            
            # Athlete name
            name_style = ParagraphStyle(
                name='AthleteName',
                parent=self.styles['Heading1'],
                fontSize=20,
                spaceAfter=20,
                alignment=TA_CENTER,
                textColor=red
            )
            
            athlete_name = athlete_data.get('name', 'N/A')
            story.append(Paragraph(f"<b>{athlete_name}</b>", name_style))
            
            # Participation text
            participation_text = f"""
            has successfully participated in the<br/>
            <b>{tournament_data.get('name', 'Tournament')}</b><br/>
            held on {tournament_data.get('date', 'N/A')}<br/>
            at {tournament_data.get('location', 'N/A')}
            """
            
            story.append(Paragraph(participation_text, body_style))
            story.append(Spacer(1, 50))
            
            # Achievement (if any)
            if athlete_data.get('achievement'):
                achievement_style = ParagraphStyle(
                    name='Achievement',
                    parent=self.styles['Normal'],
                    fontSize=16,
                    spaceAfter=30,
                    alignment=TA_CENTER,
                    textColor=green
                )
                
                achievement_text = f"Achievement: <b>{athlete_data.get('achievement')}</b>"
                story.append(Paragraph(achievement_text, achievement_style))
            
            story.append(Spacer(1, 50))
            
            # Date and signatures
            signature_data = [
                ['Date: _______________', '', 'Organizer Signature'],
                ['', '', '_______________'],
            ]
            
            signature_table = Table(signature_data, colWidths=[2*inch, 2*inch, 2*inch])
            signature_table.setStyle(TableStyle([
                ('TEXTCOLOR', (0, 0), (-1, -1), black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ]))
            
            story.append(signature_table)
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            # Save to GeneratedPDF model
            filename = f"certificate_{uuid.uuid4()}.pdf"
            generated_pdf = GeneratedPDF.objects.create(
                title=f"Certificate - {athlete_name}",
                template=None,  # No template for programmatic generation
                generation_data={
                    'athlete_data': athlete_data,
                    'tournament_data': tournament_data,
                    'type': 'certificate'
                },
                generated_by=user,
                file_size=len(buffer.getvalue())
            )
            
            generated_pdf.pdf_file.save(
                filename,
                ContentFile(buffer.getvalue()),
                save=True
            )
            
            return generated_pdf
            
        except Exception as e:
            raise Exception(f"Error generating certificate PDF: {str(e)}")
    
    def generate_from_template(self, template_id, data, user, title=None):
        """Generate PDF from a template"""
        try:
            template = PDFTemplate.objects.get(template_id=template_id, is_active=True)
            
            # Read template content
            template_content = template.template_file.read().decode('utf-8')
            
            if template.template_file.name.endswith('.json'):
                # JSON template format
                template_data = json.loads(template_content)
                return self._generate_from_json_template(template, template_data, data, user, title)
            
            elif template.template_file.name.endswith('.html'):
                # HTML template format (for future implementation)
                return self._generate_from_html_template(template, template_content, data, user, title)
            
            else:
                raise ValueError("Unsupported template format")
                
        except PDFTemplate.DoesNotExist:
            raise Exception("Template not found or inactive")
        except Exception as e:
            raise Exception(f"Error generating PDF from template: {str(e)}")
    
    def _generate_from_json_template(self, template, template_data, data, user, title):
        """Generate PDF from JSON template"""
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = []
            
            # Process template sections
            for section in template_data.get('sections', []):
                if section['type'] == 'title':
                    style = ParagraphStyle(
                        name='TemplateTitle',
                        parent=self.styles['Heading1'],
                        fontSize=section.get('fontSize', 18),
                        alignment=TA_CENTER if section.get('center') else TA_LEFT,
                        textColor=blue
                    )
                    text = self._replace_placeholders(section['text'], data)
                    story.append(Paragraph(text, style))
                    story.append(Spacer(1, section.get('spaceAfter', 20)))
                
                elif section['type'] == 'paragraph':
                    style = ParagraphStyle(
                        name='TemplateParagraph',
                        parent=self.styles['Normal'],
                        fontSize=section.get('fontSize', 12),
                        alignment=TA_CENTER if section.get('center') else TA_LEFT
                    )
                    text = self._replace_placeholders(section['text'], data)
                    story.append(Paragraph(text, style))
                    story.append(Spacer(1, section.get('spaceAfter', 12)))
                
                elif section['type'] == 'table':
                    table_data = []
                    for row in section['data']:
                        processed_row = []
                        for cell in row:
                            processed_row.append(self._replace_placeholders(str(cell), data))
                        table_data.append(processed_row)
                    
                    table = Table(table_data)
                    table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), '#d0d0d0'),
                        ('TEXTCOLOR', (0, 0), (-1, -1), black),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('GRID', (0, 0), (-1, -1), 1, black)
                    ]))
                    
                    story.append(table)
                    story.append(Spacer(1, section.get('spaceAfter', 20)))
                
                elif section['type'] == 'spacer':
                    story.append(Spacer(1, section.get('height', 20)))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            # Save to GeneratedPDF model
            filename = f"template_{template.template_id}_{uuid.uuid4()}.pdf"
            generated_pdf = GeneratedPDF.objects.create(
                title=title or f"Generated from {template.name}",
                template=template,
                generation_data=data,
                generated_by=user,
                file_size=len(buffer.getvalue())
            )
            
            generated_pdf.pdf_file.save(
                filename,
                ContentFile(buffer.getvalue()),
                save=True
            )
            
            return generated_pdf
            
        except Exception as e:
            raise Exception(f"Error generating PDF from JSON template: {str(e)}")
    
    def _generate_from_html_template(self, template, template_content, data, user, title):
        """Generate PDF from HTML template (placeholder for future implementation)"""
        # This would use a library like weasyprint or xhtml2pdf
        # For now, we'll raise an exception
        raise NotImplementedError("HTML template generation not yet implemented")
    
    def _replace_placeholders(self, text, data):
        """Replace placeholders in text with actual data"""
        if not isinstance(text, str):
            return str(text)
        
        # Simple placeholder replacement
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            if placeholder in text:
                text = text.replace(placeholder, str(value))
        
        return text


class PDFTemplateService:
    """Service for managing PDF templates"""
    
    def create_template(self, name, template_type, description, template_file, user):
        """Create a new PDF template"""
        try:
            template = PDFTemplate.objects.create(
                name=name,
                template_type=template_type,
                description=description,
                template_file=template_file,
                created_by=user
            )
            return template
        except Exception as e:
            raise Exception(f"Error creating template: {str(e)}")
    
    def get_template(self, template_id):
        """Get a template by ID"""
        try:
            return PDFTemplate.objects.get(template_id=template_id, is_active=True)
        except PDFTemplate.DoesNotExist:
            raise Exception("Template not found or inactive")
    
    def list_templates(self, template_type=None):
        """List available templates"""
        queryset = PDFTemplate.objects.filter(is_active=True)
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        return queryset.order_by('-created_at')
    
    def update_template(self, template_id, **kwargs):
        """Update a template"""
        try:
            template = PDFTemplate.objects.get(template_id=template_id)
            for key, value in kwargs.items():
                if hasattr(template, key):
                    setattr(template, key, value)
            template.save()
            return template
        except PDFTemplate.DoesNotExist:
            raise Exception("Template not found")
    
    def delete_template(self, template_id):
        """Soft delete a template"""
        try:
            template = PDFTemplate.objects.get(template_id=template_id)
            template.is_active = False
            template.save()
            return True
        except PDFTemplate.DoesNotExist:
            raise Exception("Template not found")
    
    def create_sample_templates(self, user):
        """Create sample templates for testing"""
        # Sample scoresheet template
        scoresheet_template = {
            "sections": [
                {
                    "type": "title",
                    "text": "SCORESHEET - {tournament_name}",
                    "fontSize": 18,
                    "center": True,
                    "spaceAfter": 30
                },
                {
                    "type": "paragraph",
                    "text": "Date: {date} | Location: {location}",
                    "fontSize": 12,
                    "center": True,
                    "spaceAfter": 20
                },
                {
                    "type": "table",
                    "data": [
                        ["Team", "Set 1", "Set 2", "Set 3", "Total"],
                        ["{team1}", "", "", "", ""],
                        ["{team2}", "", "", "", ""]
                    ],
                    "spaceAfter": 30
                },
                {
                    "type": "paragraph",
                    "text": "Referee: _________________ Date: _________",
                    "fontSize": 10,
                    "spaceAfter": 20
                }
            ]
        }
        
        # Sample certificate template
        certificate_template = {
            "sections": [
                {
                    "type": "spacer",
                    "height": 50
                },
                {
                    "type": "title",
                    "text": "CERTIFICATE OF ACHIEVEMENT",
                    "fontSize": 24,
                    "center": True,
                    "spaceAfter": 40
                },
                {
                    "type": "paragraph",
                    "text": "This is to certify that",
                    "fontSize": 14,
                    "center": True,
                    "spaceAfter": 20
                },
                {
                    "type": "title",
                    "text": "{athlete_name}",
                    "fontSize": 20,
                    "center": True,
                    "spaceAfter": 30
                },
                {
                    "type": "paragraph",
                    "text": "has successfully participated in {tournament_name}",
                    "fontSize": 14,
                    "center": True,
                    "spaceAfter": 20
                },
                {
                    "type": "paragraph",
                    "text": "Achievement: {achievement}",
                    "fontSize": 16,
                    "center": True,
                    "spaceAfter": 50
                }
            ]
        }
        
        templates = []
        
        # Create scoresheet template
        scoresheet_content = json.dumps(scoresheet_template, indent=2)
        scoresheet_file = ContentFile(scoresheet_content.encode(), name='scoresheet_template.json')
        
        scoresheet = PDFTemplate.objects.create(
            name='Default Scoresheet Template',
            template_type='scoresheet',
            description='Default template for generating scoresheets',
            template_file=scoresheet_file,
            created_by=user
        )
        templates.append(scoresheet)
        
        # Create certificate template
        certificate_content = json.dumps(certificate_template, indent=2)
        certificate_file = ContentFile(certificate_content.encode(), name='certificate_template.json')
        
        certificate = PDFTemplate.objects.create(
            name='Default Certificate Template',
            template_type='certificate',
            description='Default template for generating certificates',
            template_file=certificate_file,
            created_by=user
        )
        templates.append(certificate)
        
        return templates