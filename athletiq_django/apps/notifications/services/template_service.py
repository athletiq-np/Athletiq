"""
Template service for managing notification templates.
"""
import logging
from typing import Dict, Any
from django.template import Template, Context
from django.utils.html import strip_tags
from ..models import NotificationTemplate

logger = logging.getLogger(__name__)


class TemplateService:
    """Service for managing and rendering notification templates."""
    
    def get_template(self, template_type: str, category: str) -> NotificationTemplate:
        """
        Get or create notification template.
        
        Args:
            template_type: 'email' or 'sms'
            category: Template category (e.g., 'guardian_registration')
            
        Returns:
            NotificationTemplate instance
        """
        try:
            return NotificationTemplate.objects.get(
                template_type=template_type,
                category=category,
                is_active=True
            )
        except NotificationTemplate.DoesNotExist:
            # Create default template if it doesn't exist
            return self._create_default_template(template_type, category)
    
    def render_template_content(self, template_content: str, context: Dict[str, Any]) -> str:
        """
        Render template content with context variables.
        
        Args:
            template_content: Template string with Django template syntax
            context: Context variables for rendering
            
        Returns:
            Rendered content string
        """
        try:
            template = Template(template_content)
            django_context = Context(context)
            return template.render(django_context)
        except Exception as e:
            logger.error(f"Template rendering error: {str(e)}")
            return template_content  # Return original content if rendering fails
    
    def _create_default_template(self, template_type: str, category: str) -> NotificationTemplate:
        """Create default template for the given type and category."""
        
        if template_type == 'email' and category == 'guardian_registration':
            return self._create_guardian_registration_email_template()
        elif template_type == 'email' and category == 'athlete_registration':
            return self._create_athlete_registration_email_template()
        elif template_type == 'email' and category == 'reminder':
            return self._create_reminder_email_template()
        elif template_type == 'sms' and category == 'guardian_registration':
            return self._create_guardian_registration_sms_template()
        elif template_type == 'sms' and category == 'reminder':
            return self._create_reminder_sms_template()
        else:
            # Create basic template
            return NotificationTemplate.objects.create(
                name=f"Default {category} {template_type}",
                template_type=template_type,
                category=category,
                subject=f"Athletiq Notification - {category.replace('_', ' ').title()}",
                content="Default notification content.",
                html_content="<p>Default notification content.</p>",
                is_active=True
            )
    
    def _create_guardian_registration_email_template(self) -> NotificationTemplate:
        """Create default guardian registration email template."""
        
        subject = "🏆 Athlete Registration Confirmation - {{ athlete_name }}"
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Athlete Registration Confirmation</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 30px; }
                .athlete-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .claim-code { background-color: #e3f2fd; border: 2px dashed #2196f3; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
                .claim-code h3 { margin: 0; color: #1976d2; font-size: 24px; letter-spacing: 3px; }
                .button { display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .footer { background-color: #263238; color: #cfd8dc; padding: 20px; text-align: center; font-size: 14px; }
                .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏆 Athletiq Nepal</h1>
                    <p>Athlete Registration Confirmation</p>
                </div>
                
                <div class="content">
                    <h2>Dear Guardian,</h2>
                    <p>We are pleased to inform you that <strong>{{ athlete_name }}</strong> has been successfully registered as an athlete in our system.</p>
                    
                    <div class="athlete-info">
                        <h3>🏃‍♂️ Athlete Details</h3>
                        <p><strong>Full Name:</strong> {{ athlete_name }}</p>
                        <p><strong>Nepal Athlete ID:</strong> <span style="font-family: monospace; background: #e8f5e8; padding: 4px 8px; border-radius: 4px;">{{ athlete_id }}</span></p>
                        <p><strong>School:</strong> {{ school_name }}</p>
                        <p><strong>Grade:</strong> {{ grade }}</p>
                        <p><strong>Registration Date:</strong> {{ current_date }}</p>
                    </div>

                    <div class="claim-code">
                        <h3>Claim Code</h3>
                        <h3>{{ claim_code }}</h3>
                        <p>Use this code to complete your guardian profile</p>
                    </div>

                    <div style="text-align: center;">
                        <a href="{{ frontend_url }}/guardian/claim?code={{ claim_code }}" class="button">
                            Complete Guardian Profile
                        </a>
                    </div>

                    <div class="warning">
                        <h4>⚠️ Important Information:</h4>
                        <ul>
                            <li>This claim code expires in <strong>{{ expiry_hours }} hours</strong></li>
                            <li>Use the claim code to verify your identity and complete your guardian profile</li>
                            <li>The Nepal Athlete ID is unique and will be used for all future athletic activities</li>
                            <li>Keep this information secure and accessible</li>
                        </ul>
                    </div>

                    <h3>🚀 Next Steps:</h3>
                    <ol>
                        <li>Click the button above or visit our guardian portal</li>
                        <li>Enter your claim code: <strong>{{ claim_code }}</strong></li>
                        <li>Complete your guardian profile information</li>
                        <li>Verify your contact details</li>
                        <li>Set up notifications for athletic events</li>
                    </ol>

                    <p>If you have any questions or concerns, please contact the school administration or reply to this email.</p>
                    
                    <p>Thank you for your participation in Nepal's athletic development!</p>
                    
                    <p>Best regards,<br>
                    <strong>Athletiq Nepal Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>© 2025 Athletiq Nepal. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                    <p>If you received this in error, please contact us immediately.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_content = """
        ATHLETIQ REGISTRATION NOTICE

        Dear Guardian,

        Your child {{ athlete_name }} has been registered as an athlete.

        Nepal Athlete ID: {{ athlete_id }}
        School: {{ school_name }}
        Grade: {{ grade }}
        Claim Code: {{ claim_code }}

        Complete your profile at: {{ frontend_url }}/guardian/claim?code={{ claim_code }}
        This code expires in {{ expiry_hours }} hours.

        Best regards,
        Athletiq Nepal Team
        """
        
        return NotificationTemplate.objects.create(
            name="Guardian Registration Email",
            template_type='email',
            category='guardian_registration',
            subject=subject,
            content=plain_content.strip(),
            html_content=html_content.strip(),
            is_active=True
        )
    
    def _create_athlete_registration_email_template(self) -> NotificationTemplate:
        """Create default athlete registration email template."""
        
        subject = "New Athlete Registration - {{ athlete_name }}"
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New Athlete Registration</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                .header { background-color: #2196f3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 20px; }
                .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Athlete Registration</h1>
                </div>
                <div class="content">
                    <p>Dear School Administrator,</p>
                    <p>A new athlete has been registered in your school:</p>
                    
                    <div class="info-box">
                        <h3>Athlete Information</h3>
                        <p><strong>Name:</strong> {{ athlete_name }}</p>
                        <p><strong>Athlete ID:</strong> {{ athlete_id }}</p>
                        <p><strong>School:</strong> {{ school_name }}</p>
                        <p><strong>Registration Date:</strong> {{ registration_date }}</p>
                        <p><strong>Guardian Email:</strong> {{ guardian_email }}</p>
                        <p><strong>Guardian Phone:</strong> {{ guardian_phone }}</p>
                    </div>
                    
                    <p>Please review the registration and take any necessary actions.</p>
                    
                    <p>Best regards,<br>Athletiq Nepal Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_content = """
        New Athlete Registration

        Dear School Administrator,

        A new athlete has been registered in your school:

        Name: {{ athlete_name }}
        Athlete ID: {{ athlete_id }}
        School: {{ school_name }}
        Registration Date: {{ registration_date }}
        Guardian Email: {{ guardian_email }}
        Guardian Phone: {{ guardian_phone }}

        Please review the registration and take any necessary actions.

        Best regards,
        Athletiq Nepal Team
        """
        
        return NotificationTemplate.objects.create(
            name="Athlete Registration Email",
            template_type='email',
            category='athlete_registration',
            subject=subject,
            content=plain_content.strip(),
            html_content=html_content.strip(),
            is_active=True
        )
    
    def _create_reminder_email_template(self) -> NotificationTemplate:
        """Create default reminder email template."""
        
        subject = "⏰ Reminder: Complete Your Guardian Profile - {{ athlete_name }}"
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Guardian Profile Reminder</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 20px; }
                .urgent { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .button { display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Reminder</h1>
                    <p>Complete Your Guardian Profile</p>
                </div>
                <div class="content">
                    <p>Dear Guardian,</p>
                    
                    <div class="urgent">
                        <h3>⚠️ Action Required</h3>
                        <p>Your claim code for <strong>{{ athlete_name }}</strong> expires in {{ expiry_time }}!</p>
                    </div>
                    
                    <p><strong>Claim Code:</strong> {{ claim_code }}</p>
                    <p><strong>Nepal Athlete ID:</strong> {{ athlete_id }}</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="{{ frontend_url }}/guardian/claim?code={{ claim_code }}" class="button">
                            Complete Profile Now
                        </a>
                    </div>
                    
                    <p>Don't miss out on completing your guardian profile!</p>
                    
                    <p>Best regards,<br>Athletiq Nepal Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_content = """
        ATHLETIQ REMINDER

        Dear Guardian,

        Your claim code for {{ athlete_name }} expires in {{ expiry_time }}!

        Claim Code: {{ claim_code }}
        Nepal Athlete ID: {{ athlete_id }}

        Complete now: {{ frontend_url }}/guardian/claim?code={{ claim_code }}

        Don't miss out!

        Best regards,
        Athletiq Nepal Team
        """
        
        return NotificationTemplate.objects.create(
            name="Guardian Reminder Email",
            template_type='email',
            category='reminder',
            subject=subject,
            content=plain_content.strip(),
            html_content=html_content.strip(),
            is_active=True
        )
    
    def _create_guardian_registration_sms_template(self) -> NotificationTemplate:
        """Create default guardian registration SMS template."""
        
        content = """
🏫 ATHLETIQ REGISTRATION NOTICE

Your child {{ athlete_name }} has been registered as an athlete.

Nepal Athlete ID: {{ athlete_id }}
School: {{ school_name }}
Claim Code: {{ claim_code }}

Complete your profile at: {{ frontend_url }}/guardian/claim
This code expires in {{ expiry_hours }} hours.

Reply STOP to opt out.
        """.strip()
        
        return NotificationTemplate.objects.create(
            name="Guardian Registration SMS",
            template_type='sms',
            category='guardian_registration',
            subject='',  # SMS doesn't have subject
            content=content,
            html_content='',  # SMS doesn't have HTML
            is_active=True
        )
    
    def _create_reminder_sms_template(self) -> NotificationTemplate:
        """Create default reminder SMS template."""
        
        content = """
🏫 ATHLETIQ REMINDER

Your claim code for {{ athlete_name }} expires in {{ expiry_time }}!

Claim Code: {{ claim_code }}
Nepal Athlete ID: {{ athlete_id }}

Complete now: {{ frontend_url }}/guardian/claim

Don't miss out!
        """.strip()
        
        return NotificationTemplate.objects.create(
            name="Guardian Reminder SMS",
            template_type='sms',
            category='reminder',
            subject='',  # SMS doesn't have subject
            content=content,
            html_content='',  # SMS doesn't have HTML
            is_active=True
        )