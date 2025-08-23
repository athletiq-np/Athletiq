"""
Bulk operation notification service.
"""
import logging
from typing import Dict, Any, List
from django.utils import timezone
from apps.notifications.services.notification_service import NotificationService
from apps.notifications.services.email_service import EmailService
from apps.notifications.services.sms_service import SMSService

logger = logging.getLogger(__name__)


class BulkOperationNotificationService:
    """
    Service for handling bulk operation notifications.
    """
    
    def __init__(self):
        self.notification_service = NotificationService()
        self.email_service = EmailService()
        self.sms_service = SMSService()
    
    def send_operation_started_notification(
        self,
        user_id: int,
        operation_id: str,
        operation_type: str,
        total_items: int
    ) -> Dict[str, Any]:
        """
        Send notification when bulk operation starts.
        
        Args:
            user_id: User ID
            operation_id: Operation ID
            operation_type: Type of operation
            total_items: Total items to process
            
        Returns:
            Dict with notification result
        """
        try:
            from apps.authentication.models import User
            
            user = User.objects.get(id=user_id)
            
            # Create in-app notification
            notification_data = {
                'user_id': user_id,
                'title': f'Bulk Operation Started',
                'message': f'Your {operation_type.replace("_", " ").title()} operation has started processing {total_items} items.',
                'notification_type': 'bulk_operation_started',
                'metadata': {
                    'operation_id': operation_id,
                    'operation_type': operation_type,
                    'total_items': total_items
                }
            }
            
            self.notification_service.create_notification(notification_data)
            
            logger.info(f"Sent operation started notification for {operation_id}")
            
            return {
                'success': True,
                'message': 'Operation started notification sent'
            }
            
        except Exception as e:
            logger.error(f"Error sending operation started notification: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }
    
    def send_operation_progress_notification(
        self,
        user_id: int,
        operation_id: str,
        operation_type: str,
        progress_percentage: float,
        processed_items: int,
        total_items: int
    ) -> Dict[str, Any]:
        """
        Send notification for operation progress milestones.
        
        Args:
            user_id: User ID
            operation_id: Operation ID
            operation_type: Type of operation
            progress_percentage: Progress percentage
            processed_items: Items processed
            total_items: Total items
            
        Returns:
            Dict with notification result
        """
        try:
            # Only send notifications at 25%, 50%, 75% milestones
            milestones = [25, 50, 75]
            if not any(abs(progress_percentage - milestone) < 1 for milestone in milestones):
                return {'success': True, 'message': 'No milestone reached'}
            
            from apps.authentication.models import User
            
            user = User.objects.get(id=user_id)
            
            # Create in-app notification
            notification_data = {
                'user_id': user_id,
                'title': f'Bulk Operation Progress: {progress_percentage:.0f}%',
                'message': f'Your {operation_type.replace("_", " ").title()} operation is {progress_percentage:.0f}% complete ({processed_items}/{total_items} items processed).',
                'notification_type': 'bulk_operation_progress',
                'metadata': {
                    'operation_id': operation_id,
                    'operation_type': operation_type,
                    'progress_percentage': progress_percentage,
                    'processed_items': processed_items,
                    'total_items': total_items
                }
            }
            
            self.notification_service.create_notification(notification_data)
            
            logger.info(f"Sent progress notification for {operation_id}: {progress_percentage:.0f}%")
            
            return {
                'success': True,
                'message': f'Progress notification sent: {progress_percentage:.0f}%'
            }
            
        except Exception as e:
            logger.error(f"Error sending progress notification: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }
    
    def send_operation_completed_notification(
        self,
        user_id: int,
        operation_id: str,
        operation_type: str,
        results: Dict[str, Any],
        send_email: bool = True,
        send_sms: bool = False
    ) -> Dict[str, Any]:
        """
        Send notification when bulk operation completes.
        
        Args:
            user_id: User ID
            operation_id: Operation ID
            operation_type: Type of operation
            results: Operation results
            send_email: Whether to send email notification
            send_sms: Whether to send SMS notification
            
        Returns:
            Dict with notification result
        """
        try:
            from apps.authentication.models import User
            
            user = User.objects.get(id=user_id)
            
            # Determine success status
            success = results.get('success', False)
            status_text = "completed successfully" if success else "failed"
            status_emoji = "✅" if success else "❌"
            
            # Get result counts
            total_processed = results.get('total_processed', 0)
            successful_count = results.get('successful_imports', results.get('successful_creations', results.get('updated_count', 0)))
            failed_count = results.get('failed_imports', results.get('failed_creations', 0))
            
            # Create in-app notification
            notification_data = {
                'user_id': user_id,
                'title': f'{status_emoji} Bulk Operation {status_text.title()}',
                'message': f'Your {operation_type.replace("_", " ").title()} operation has {status_text}. Processed: {total_processed}, Successful: {successful_count}, Failed: {failed_count}.',
                'notification_type': 'bulk_operation_completed',
                'metadata': {
                    'operation_id': operation_id,
                    'operation_type': operation_type,
                    'success': success,
                    'results': results
                }
            }
            
            self.notification_service.create_notification(notification_data)
            
            # Send email notification if requested
            if send_email and user.email:
                email_result = self._send_completion_email(user, operation_id, operation_type, results)
            
            # Send SMS notification if requested
            if send_sms and hasattr(user, 'phone') and user.phone:
                sms_result = self._send_completion_sms(user, operation_type, results)
            
            logger.info(f"Sent completion notification for {operation_id}")
            
            return {
                'success': True,
                'message': 'Operation completion notification sent',
                'email_sent': send_email,
                'sms_sent': send_sms
            }
            
        except Exception as e:
            logger.error(f"Error sending completion notification: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }
    
    def send_operation_failed_notification(
        self,
        user_id: int,
        operation_id: str,
        operation_type: str,
        error_message: str,
        send_email: bool = True
    ) -> Dict[str, Any]:
        """
        Send notification when bulk operation fails.
        
        Args:
            user_id: User ID
            operation_id: Operation ID
            operation_type: Type of operation
            error_message: Error message
            send_email: Whether to send email notification
            
        Returns:
            Dict with notification result
        """
        try:
            from apps.authentication.models import User
            
            user = User.objects.get(id=user_id)
            
            # Create in-app notification
            notification_data = {
                'user_id': user_id,
                'title': f'❌ Bulk Operation Failed',
                'message': f'Your {operation_type.replace("_", " ").title()} operation has failed: {error_message}',
                'notification_type': 'bulk_operation_failed',
                'metadata': {
                    'operation_id': operation_id,
                    'operation_type': operation_type,
                    'error_message': error_message
                }
            }
            
            self.notification_service.create_notification(notification_data)
            
            # Send email notification if requested
            if send_email and user.email:
                email_result = self._send_failure_email(user, operation_id, operation_type, error_message)
            
            logger.info(f"Sent failure notification for {operation_id}")
            
            return {
                'success': True,
                'message': 'Operation failure notification sent'
            }
            
        except Exception as e:
            logger.error(f"Error sending failure notification: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }
    
    def _send_completion_email(
        self,
        user,
        operation_id: str,
        operation_type: str,
        results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send completion email notification."""
        try:
            success = results.get('success', False)
            status_text = "completed successfully" if success else "failed"
            status_color = "#28a745" if success else "#dc3545"
            
            total_processed = results.get('total_processed', 0)
            successful_count = results.get('successful_imports', results.get('successful_creations', results.get('updated_count', 0)))
            failed_count = results.get('failed_imports', results.get('failed_creations', 0))
            
            subject = f"Bulk Operation {status_text.title()}: {operation_type.replace('_', ' ').title()}"
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: {status_color}; margin: 0;">
                        {'✅' if success else '❌'} Operation {status_text.title()}
                    </h1>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #333;">Operation Details</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Type:</td>
                            <td style="padding: 8px 0;">{operation_type.replace('_', ' ').title()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Operation ID:</td>
                            <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">{operation_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                            <td style="padding: 8px 0; color: {status_color}; font-weight: bold;">{status_text.title()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Completed At:</td>
                            <td style="padding: 8px 0;">{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #333;">Results Summary</h2>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-weight: bold;">Total Processed:</span>
                        <span style="background-color: #6c757d; color: white; padding: 4px 8px; border-radius: 4px;">{total_processed}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-weight: bold;">Successful:</span>
                        <span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px;">{successful_count}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: bold;">Failed:</span>
                        <span style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px;">{failed_count}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0;">
                        You can view detailed results and manage your operations in the Athletiq dashboard.
                    </p>
                </div>
            </div>
            """
            
            text_content = f"""
            Bulk Operation {status_text.title()}
            
            Dear {user.full_name},
            
            Your bulk operation has {status_text}.
            
            Operation Details:
            - Type: {operation_type.replace('_', ' ').title()}
            - Operation ID: {operation_id}
            - Status: {status_text.title()}
            - Completed At: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
            
            Results Summary:
            - Total Processed: {total_processed}
            - Successful: {successful_count}
            - Failed: {failed_count}
            
            You can view detailed results in your dashboard.
            
            Best regards,
            Athletiq Team
            """
            
            return self.email_service.send_email(
                to_email=user.email,
                subject=subject,
                text_content=text_content,
                html_content=html_content,
                template_name='bulk_operation_completion',
                context={
                    'user_name': user.full_name,
                    'operation_type': operation_type,
                    'operation_id': operation_id,
                    'results': results,
                    'success': success
                },
                recipient_name=user.full_name
            )
            
        except Exception as e:
            logger.error(f"Error sending completion email: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def _send_failure_email(
        self,
        user,
        operation_id: str,
        operation_type: str,
        error_message: str
    ) -> Dict[str, Any]:
        """Send failure email notification."""
        try:
            subject = f"Bulk Operation Failed: {operation_type.replace('_', ' ').title()}"
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #dc3545; margin: 0;">
                        ❌ Operation Failed
                    </h1>
                </div>
                
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #721c24;">Error Details</h2>
                    <p style="margin: 0; color: #721c24;">{error_message}</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #333;">Operation Information</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Type:</td>
                            <td style="padding: 8px 0;">{operation_type.replace('_', ' ').title()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Operation ID:</td>
                            <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">{operation_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Failed At:</td>
                            <td style="padding: 8px 0;">{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0;">
                        Please contact support if you need assistance with this operation.
                    </p>
                </div>
            </div>
            """
            
            text_content = f"""
            Bulk Operation Failed
            
            Dear {user.full_name},
            
            Your bulk operation has failed.
            
            Operation Details:
            - Type: {operation_type.replace('_', ' ').title()}
            - Operation ID: {operation_id}
            - Failed At: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
            
            Error: {error_message}
            
            Please contact support if you need assistance.
            
            Best regards,
            Athletiq Team
            """
            
            return self.email_service.send_email(
                to_email=user.email,
                subject=subject,
                text_content=text_content,
                html_content=html_content,
                template_name='bulk_operation_failure',
                context={
                    'user_name': user.full_name,
                    'operation_type': operation_type,
                    'operation_id': operation_id,
                    'error_message': error_message
                },
                recipient_name=user.full_name
            )
            
        except Exception as e:
            logger.error(f"Error sending failure email: {str(e)}")
            return {'success': False, 'message': str(e)}
    
    def _send_completion_sms(
        self,
        user,
        operation_type: str,
        results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send completion SMS notification."""
        try:
            success = results.get('success', False)
            status_text = "completed" if success else "failed"
            
            total_processed = results.get('total_processed', 0)
            successful_count = results.get('successful_imports', results.get('successful_creations', results.get('updated_count', 0)))
            
            message = f"Athletiq: Your {operation_type.replace('_', ' ')} operation has {status_text}. {successful_count}/{total_processed} items processed successfully."
            
            return self.sms_service.send_sms(
                phone_number=user.phone,
                message=message,
                message_type='bulk_operation_completion'
            )
            
        except Exception as e:
            logger.error(f"Error sending completion SMS: {str(e)}")
            return {'success': False, 'message': str(e)}


# Global instance
bulk_notification_service = BulkOperationNotificationService()