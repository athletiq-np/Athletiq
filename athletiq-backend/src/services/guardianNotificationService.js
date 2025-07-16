// src/services/guardianNotificationService.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const crypto = require('crypto');
const pool = require('../config/db');

class GuardianNotificationService {
  constructor() {
    // Email configuration
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // SMS configuration (Twilio)
    this.smsClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  /**
   * Generate a secure claim code for guardian verification
   */
  generateClaimCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Store claim code in database with expiration
   */
  async storeClaimCode(athleteId, guardianPhone, guardianEmail, claimCode) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    const query = `
      INSERT INTO guardian_claims (
        athlete_id, guardian_phone, guardian_email, claim_code, 
        expires_at, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      ON CONFLICT (athlete_id) 
      DO UPDATE SET 
        claim_code = $4, 
        expires_at = $5, 
        status = 'pending',
        updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [
      athleteId, guardianPhone, guardianEmail, claimCode, expiresAt
    ]);

    return result.rows[0];
  }

  /**
   * Send registration notification to guardian
   */
  async sendRegistrationNotification(athleteData) {
    try {
      const claimCode = this.generateClaimCode();
      
      // Store claim code in database
      await this.storeClaimCode(
        athleteData.athlete_id,
        athleteData.guardian_phone,
        athleteData.guardian_email,
        claimCode
      );

      const notifications = [];

      // Send SMS if phone number provided
      if (athleteData.guardian_phone) {
        const smsResult = await this.sendSMS(athleteData, claimCode);
        notifications.push({ type: 'sms', success: smsResult.success, message: smsResult.message });
      }

      // Send Email if email provided
      if (athleteData.guardian_email) {
        const emailResult = await this.sendEmail(athleteData, claimCode);
        notifications.push({ type: 'email', success: emailResult.success, message: emailResult.message });
      }

      return {
        success: true,
        claimCode,
        notifications,
        message: 'Guardian notification sent successfully'
      };

    } catch (error) {
      console.error('Guardian notification error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send guardian notification'
      };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(athleteData, claimCode) {
    try {
      const message = `
🏫 ATHLETIQ REGISTRATION NOTICE

Your child ${athleteData.full_name} has been registered as an athlete.

Nepal Athlete ID: ${athleteData.athlete_id}
School: ${athleteData.school_name}
Claim Code: ${claimCode}

Complete your profile at: ${process.env.FRONTEND_URL}/guardian/claim
This code expires in 24 hours.

Reply STOP to opt out.
      `.trim();

      const result = await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: athleteData.guardian_phone
      });

      return {
        success: true,
        messageId: result.sid,
        message: 'SMS sent successfully'
      };

    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send SMS'
      };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(athleteData, claimCode) {
    try {
      const emailTemplate = this.generateEmailTemplate(athleteData, claimCode);

      const mailOptions = {
        from: `"Athletiq Nepal" <${process.env.EMAIL_USER}>`,
        to: athleteData.guardian_email,
        subject: `🏆 Athlete Registration Confirmation - ${athleteData.full_name}`,
        html: emailTemplate
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully'
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send email'
      };
    }
  }

  /**
   * Generate professional email template
   */
  generateEmailTemplate(athleteData, claimCode) {
    return `
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
          <p>We are pleased to inform you that <strong>${athleteData.full_name}</strong> has been successfully registered as an athlete in our system.</p>
          
          <div class="athlete-info">
            <h3>🏃‍♂️ Athlete Details</h3>
            <p><strong>Full Name:</strong> ${athleteData.full_name}</p>
            <p><strong>Nepal Athlete ID:</strong> <span style="font-family: monospace; background: #e8f5e8; padding: 4px 8px; border-radius: 4px;">${athleteData.athlete_id}</span></p>
            <p><strong>School:</strong> ${athleteData.school_name || 'School Name'}</p>
            <p><strong>Grade:</strong> ${athleteData.grade || 'N/A'}</p>
            <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="claim-code">
            <h3>Claim Code</h3>
            <h3>${claimCode}</h3>
            <p>Use this code to complete your guardian profile</p>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/guardian/claim?code=${claimCode}" class="button">
              Complete Guardian Profile
            </a>
          </div>

          <div class="warning">
            <h4>⚠️ Important Information:</h4>
            <ul>
              <li>This claim code expires in <strong>24 hours</strong></li>
              <li>Use the claim code to verify your identity and complete your guardian profile</li>
              <li>The Nepal Athlete ID is unique and will be used for all future athletic activities</li>
              <li>Keep this information secure and accessible</li>
            </ul>
          </div>

          <h3>🚀 Next Steps:</h3>
          <ol>
            <li>Click the button above or visit our guardian portal</li>
            <li>Enter your claim code: <strong>${claimCode}</strong></li>
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
    `;
  }

  /**
   * Verify claim code and retrieve athlete information
   */
  async verifyClaimCode(claimCode) {
    try {
      const query = `
        SELECT 
          gc.*,
          p.full_name,
          p.athlete_id,
          p.grade,
          p.date_of_birth,
          s.name as school_name
        FROM guardian_claims gc
        JOIN players p ON gc.athlete_id = p.athlete_id
        LEFT JOIN schools s ON p.school_id = s.id
        WHERE gc.claim_code = $1 
          AND gc.status = 'pending' 
          AND gc.expires_at > NOW()
      `;

      const result = await pool.query(query, [claimCode]);

      if (result.rowCount === 0) {
        return {
          success: false,
          message: 'Invalid or expired claim code'
        };
      }

      return {
        success: true,
        data: result.rows[0],
        message: 'Claim code verified successfully'
      };

    } catch (error) {
      console.error('Claim code verification error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to verify claim code'
      };
    }
  }

  /**
   * Mark claim as completed
   */
  async completeClaim(claimCode, guardianData) {
    try {
      const updateQuery = `
        UPDATE guardian_claims 
        SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE claim_code = $1
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [claimCode]);

      // Update guardian information in players table
      if (result.rowCount > 0) {
        const athleteId = result.rows[0].athlete_id;
        
        const updateAthleteQuery = `
          UPDATE players 
          SET 
            guardian_name = $1,
            guardian_phone = $2,
            guardian_email = $3,
            guardian_verified = true,
            updated_at = NOW()
          WHERE athlete_id = $4
        `;

        await pool.query(updateAthleteQuery, [
          guardianData.guardian_name,
          guardianData.guardian_phone,
          guardianData.guardian_email,
          athleteId
        ]);
      }

      return {
        success: true,
        message: 'Guardian profile completed successfully'
      };

    } catch (error) {
      console.error('Claim completion error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to complete guardian profile'
      };
    }
  }

  /**
   * Send reminder for pending claims
   */
  async sendReminders() {
    try {
      // Find claims expiring within 6 hours
      const query = `
        SELECT 
          gc.*,
          p.full_name,
          p.athlete_id
        FROM guardian_claims gc
        JOIN players p ON gc.athlete_id = p.athlete_id
        WHERE gc.status = 'pending' 
          AND gc.expires_at > NOW()
          AND gc.expires_at <= NOW() + INTERVAL '6 hours'
          AND gc.reminder_sent = false
      `;

      const result = await pool.query(query);
      const reminders = [];

      for (const claim of result.rows) {
        const reminderResult = await this.sendReminderNotification(claim);
        reminders.push(reminderResult);

        // Mark reminder as sent
        await pool.query(
          'UPDATE guardian_claims SET reminder_sent = true WHERE id = $1',
          [claim.id]
        );
      }

      return {
        success: true,
        remindersSent: reminders.length,
        reminders
      };

    } catch (error) {
      console.error('Reminder sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(claimData) {
    const message = `
🏫 ATHLETIQ REMINDER

Your claim code for ${claimData.full_name} expires in 6 hours!

Claim Code: ${claimData.claim_code}
Nepal Athlete ID: ${claimData.athlete_id}

Complete now: ${process.env.FRONTEND_URL}/guardian/claim

Don't miss out!
    `.trim();

    try {
      if (claimData.guardian_phone) {
        await this.smsClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: claimData.guardian_phone
        });
      }

      return {
        success: true,
        athleteId: claimData.athlete_id,
        message: 'Reminder sent successfully'
      };

    } catch (error) {
      return {
        success: false,
        athleteId: claimData.athlete_id,
        error: error.message
      };
    }
  }
}

module.exports = GuardianNotificationService;
