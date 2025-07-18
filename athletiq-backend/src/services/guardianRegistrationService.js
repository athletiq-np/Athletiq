// src/services/guardianRegistrationService.js
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');
const AthleteIdGenerator = require('./ai/athleteIdGenerator');

class GuardianRegistrationService {
  constructor() {
    // Initialize athlete ID generator
    this.athleteIdGenerator = new AthleteIdGenerator();
    
    // Email configuration
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Register a new guardian account
   */
  async registerGuardian({ 
    fullName, 
    email, 
    phone, 
    password, 
    address,
    relationship = 'Parent'
  }) {
    try {
      // Check if guardian already exists
      const existingGuardian = await pool.query(
        'SELECT id FROM guardians WHERE email = $1 OR phone = $2',
        [email, phone]
      );

      if (existingGuardian.rowCount > 0) {
        return {
          success: false,
          message: 'Guardian account already exists with this email or phone number'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Insert guardian
      const guardianQuery = `
        INSERT INTO guardians (
          full_name, email, phone, password_hash, address, relationship,
          email_verified, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, false, 'active', NOW(), NOW()
        ) RETURNING id, full_name, email, phone, status
      `;

      const guardianResult = await pool.query(guardianQuery, [
        fullName, email, phone, hashedPassword, address, relationship.toLowerCase()
      ]);

      const guardian = guardianResult.rows[0];

      // Send welcome email
      await this.sendWelcomeEmail(guardian, null);

      return {
        success: true,
        data: {
          guardianId: guardian.id,
          fullName: guardian.full_name,
          email: guardian.email,
          phone: guardian.phone,
          accountStatus: guardian.status
        },
        message: 'Guardian account created successfully!'
      };

    } catch (error) {
      console.error('Guardian registration error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create guardian account'
      };
    }
  }

  /**
   * Add a child to guardian's account using the players table
   */
  async addChildToAccount({
    guardianId,
    childFullName,
    dateOfBirth,
    gender,
    grade,
    schoolName,
    schoolId = null,
    additionalInfo = {}
  }) {
    try {
      console.log('Adding child to guardian account:', { guardianId, childFullName, schoolName });

      // Check if child already exists with same guardian
      const existingChild = await pool.query(
        `SELECT id FROM players 
         WHERE guardian_id = $1 AND LOWER(full_name) = LOWER($2) AND date_of_birth = $3`,
        [guardianId, childFullName, dateOfBirth]
      );

      if (existingChild.rowCount > 0) {
        return {
          success: false,
          message: 'This child is already added to your account'
        };
      }

      // Check if child exists in school system (without guardian)
      let existingStudent = null;
      const studentQuery = `
        SELECT id, athlete_id, full_name, school_name, grade, verification_status, nepal_athlete_id
        FROM players 
        WHERE LOWER(full_name) = LOWER($1) AND date_of_birth = $2
        AND (LOWER(school_name) = LOWER($3) OR school_id = $4)
        AND guardian_id IS NULL
      `;
      
      const studentResult = await pool.query(studentQuery, [
        childFullName, dateOfBirth, schoolName, schoolId
      ]);

      if (studentResult.rowCount > 0) {
        existingStudent = studentResult.rows[0];
      }

      let child;

      if (existingStudent) {
        // Link existing student to guardian
        const updateQuery = `
          UPDATE players 
          SET guardian_id = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        const updateResult = await pool.query(updateQuery, [guardianId, existingStudent.id]);
        child = updateResult.rows[0];

        console.log('Linked existing student to guardian:', child.id);

        return {
          success: true,
          data: child,
          linkedToSchool: true,
          athleteId: child.nepal_athlete_id,
          message: 'Child linked to existing school record! Athlete ID is active.'
        };

      } else {
        // Create new pending athlete record
        
        // If no schoolId provided, try to find school by name
        let finalSchoolId = schoolId;
        let finalSchoolName = schoolName;
        
        if (!schoolId && schoolName) {
          const schoolQuery = `SELECT id, name FROM schools WHERE LOWER(name) LIKE LOWER($1) LIMIT 1`;
          const schoolResult = await pool.query(schoolQuery, [`%${schoolName}%`]);
          
          if (schoolResult.rowCount > 0) {
            finalSchoolId = schoolResult.rows[0].id;
            finalSchoolName = schoolResult.rows[0].name;
            console.log(`Found school by name: ${finalSchoolName} (ID: ${finalSchoolId})`);
          } else {
            console.log(`School not found: ${schoolName}, will create with school name only`);
            finalSchoolId = null;
          }
        }
        
        const insertQuery = `
          INSERT INTO players (
            full_name, date_of_birth, gender, grade,
            school_id, school_name, guardian_id, registration_method,
            verification_status, active_status, profile_status,
            guardian_name, guardian_phone, relationship_to_player,
            address, created_by_guardian, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, 'By guardian', 'pending_approval', 
            'Inactive', 'Incomplete', $8, $9, $10, $11, $7, NOW(), NOW()
          ) RETURNING *
        `;

        // Get guardian info for the record
        const guardianResult = await pool.query(
          'SELECT full_name, phone, relationship, address FROM guardians WHERE id = $1',
          [guardianId]
        );
        
        const guardian = guardianResult.rows[0];

        // Map guardian relationship to player relationship
        const relationshipMapping = {
          'parent': 'Father', // Default to Father for parent
          'father': 'Father',
          'mother': 'Mother', 
          'guardian': 'Guardian',
          'uncle': 'Uncle',
          'aunt': 'Aunt',
          'grandfather': 'Grandfather',
          'grandmother': 'Grandmother'
        };

        const playerRelationship = relationshipMapping[guardian.relationship?.toLowerCase()] || 'Guardian';

        // Normalize grade to just the number (e.g., "Grade 6" -> "6")
        let normalizedGrade = grade || '1';
        if (typeof normalizedGrade === 'string') {
          const gradeMatch = normalizedGrade.match(/\d+/);
          if (gradeMatch) {
            normalizedGrade = gradeMatch[0];
          } else if (!normalizedGrade || normalizedGrade.trim() === '') {
            normalizedGrade = '1';
          }
        }

        const insertResult = await pool.query(insertQuery, [
          childFullName,
          dateOfBirth,
          gender || 'Male',
          normalizedGrade, // Use normalized grade
          finalSchoolId,
          finalSchoolName,
          guardianId,
          guardian.full_name,
          guardian.phone,
          playerRelationship,
          guardian.address || 'Not provided'
        ]);

        child = insertResult.rows[0];

        console.log('Created new pending athlete:', child.id);

        // Notify school of pending registration
        await this.notifySchoolOfPendingRegistration(child);

        return {
          success: true,
          data: child,
          linkedToSchool: false,
          athleteId: null,
          message: 'Child added successfully! Registration is pending school approval.'
        };
      }

    } catch (error) {
      console.error('Add child error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add child to account'
      };
    }
  }

  /**
   * Notify school of pending athlete registration
   */
  async notifySchoolOfPendingRegistration(athlete) {
    try {
      console.log(`Notifying school ${athlete.school_id} of pending registration for ${athlete.full_name}`);
      
      // Get school contact information
      const schoolQuery = `
        SELECT name, email, contact_phone, principal_name
        FROM schools 
        WHERE id = $1
      `;
      
      const schoolResult = await pool.query(schoolQuery, [athlete.school_id]);
      
      if (schoolResult.rowCount === 0) {
        console.log('School not found for notification');
        return;
      }
      
      const school = schoolResult.rows[0];
      
      // Create notification record (for school dashboard) using existing notifications table structure
      const notificationQuery = `
        INSERT INTO notifications (
          type, title, message, user_id, organization_id,
          data, is_read, priority, created_at
        ) VALUES (
          $1, $2, $3, NULL, $4, $5, false, 'medium', NOW()
        )
      `;
      
      const notificationTitle = 'New Athlete Registration Pending Approval';
      const notificationMessage = `Guardian has registered ${athlete.full_name} (Grade ${athlete.grade}) for your school. Please review and approve this registration.`;
      const notificationData = {
        athleteId: athlete.id,
        athleteName: athlete.full_name,
        guardianId: athlete.guardian_id,
        schoolId: athlete.school_id,
        actionRequired: 'approve_athlete_registration'
      };
      
      await pool.query(notificationQuery, [
        'pending_athlete_registration',
        notificationTitle,
        notificationMessage,
        athlete.school_id, // Using school_id as organization_id
        JSON.stringify(notificationData)
      ]);
      
      console.log('School notification created successfully');
      
      // TODO: Add email notification if school email exists
      if (school.email) {
        // Email notification logic can be added here
        console.log(`Email notification would be sent to ${school.email}`);
      }
      
    } catch (error) {
      console.error('Error notifying school:', error);
      // Don't throw error as this is not critical to the registration process
    }
  }

  /**
   * Link guardian to existing student in school system
   */
  async linkGuardianToExistingStudent(guardianId, playerId, childId) {
    try {
      // Update players table with guardian information
      const updatePlayerQuery = `
        UPDATE players 
        SET guardian_id = $1, guardian_verified = true, updated_at = NOW()
        WHERE id = $2
      `;
      
      await pool.query(updatePlayerQuery, [guardianId, playerId]);

      // Update child record with link
      const updateChildQuery = `
        UPDATE guardian_children 
        SET linked_player_id = $1, verification_status = 'verified', updated_at = NOW()
        WHERE id = $2
      `;
      
      await pool.query(updateChildQuery, [playerId, childId]);

      // Send notification about successful linking
      await this.sendLinkingNotification(guardianId, playerId);

    } catch (error) {
      console.error('Link guardian to student error:', error);
      throw error;
    }
  }

  /**
   * Create pending registration for school approval
   */
  async createPendingRegistration(guardianId, child) {
    try {
      const pendingQuery = `
        INSERT INTO pending_registrations (
          guardian_id, child_id, full_name, date_of_birth, gender, grade,
          school_name, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'pending_school_approval', NOW(), NOW()
        ) RETURNING *
      `;

      const result = await pool.query(pendingQuery, [
        guardianId,
        child.id,
        child.full_name,
        child.date_of_birth,
        child.gender,
        child.grade,
        child.school_name
      ]);

      // Notify school administration about pending registration
      await this.notifySchoolOfPendingRegistration(result.rows[0]);

    } catch (error) {
      console.error('Create pending registration error:', error);
      throw error;
    }
  }

  /**
   * Approve pending registration (called by school)
   */
  async approvePendingRegistration(pendingId, schoolApprovalData = {}) {
    try {
      // Get pending registration details
      const pendingQuery = `
        SELECT pr.*, gc.*, g.full_name as guardian_name, g.email as guardian_email, g.phone as guardian_phone
        FROM pending_registrations pr
        JOIN guardian_children gc ON pr.child_id = gc.id
        JOIN guardians g ON pr.guardian_id = g.id
        WHERE pr.id = $1 AND pr.status = 'pending_school_approval'
      `;
      
      const pendingResult = await pool.query(pendingQuery, [pendingId]);
      
      if (pendingResult.rowCount === 0) {
        return {
          success: false,
          message: 'Pending registration not found or already processed'
        };
      }

      const registration = pendingResult.rows[0];

      // Generate Nepal athlete ID
      const athleteIdResult = await this.athleteIdGenerator.generateAthleteId({
        full_name: registration.full_name,
        date_of_birth: registration.date_of_birth,
        school_name: registration.school_name,
        guardian_phone: registration.guardian_phone
      });

      // Create official player record
      const playerQuery = `
        INSERT INTO players (
          athlete_id, full_name, date_of_birth, gender, grade,
          school_name, school_id, guardian_id, guardian_name, guardian_phone, guardian_email,
          registration_method, verification_status, enrollment_status,
          relationship_to_player, address, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          'By guardian', 'Verified', 'Active',
          $12, $13, NOW(), NOW()
        ) RETURNING *
      `;

      const playerResult = await pool.query(playerQuery, [
        athleteIdResult.athleteId,
        registration.full_name,
        registration.date_of_birth,
        registration.gender,
        registration.grade,
        registration.school_name,
        schoolApprovalData.school_id || null,
        registration.guardian_id,
        registration.guardian_name,
        registration.guardian_phone,
        registration.guardian_email,
        registration.relationship_type || 'Parent',
        registration.address || 'Not specified'
      ]);

      const player = playerResult.rows[0];

      // Update child record with athlete ID and link to player
      await pool.query(`
        UPDATE guardian_children 
        SET athlete_id = $1, linked_player_id = $2, athlete_id_status = 'active',
            verification_status = 'verified', updated_at = NOW()
        WHERE id = $3
      `, [athleteIdResult.athleteId, player.id, registration.child_id]);

      // Update pending registration status
      await pool.query(`
        UPDATE pending_registrations 
        SET status = 'approved', approved_at = NOW(), player_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [player.id, pendingId]);

      // Send notification to guardian about approval and athlete ID
      await this.sendAthleteIdActivationNotification(registration.guardian_id, player);

      return {
        success: true,
        data: player,
        athleteId: athleteIdResult.athleteId,
        message: 'Registration approved successfully! Athlete ID has been generated and guardian notified.'
      };

    } catch (error) {
      console.error('Approve pending registration error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to approve registration'
      };
    }
  }

  /**
   * Get guardian's children and their status from players table
   */
  async getGuardianChildren(guardianId) {
    try {
      const query = `
        SELECT 
          p.id,
          p.full_name,
          p.date_of_birth,
          p.gender,
          p.grade,
          p.school_name,
          p.school_id,
          p.verification_status,
          p.active_status,
          p.nepal_athlete_id as athlete_id,
          p.profile_photo_url,
          p.created_at,
          p.updated_at,
          CASE 
            WHEN p.nepal_athlete_id IS NOT NULL THEN 'verified'
            WHEN p.verification_status = 'pending_approval' THEN 'pending_approval'
            ELSE p.verification_status
          END as status,
          s.name as school_official_name
        FROM players p
        LEFT JOIN schools s ON p.school_id = s.id
        WHERE p.guardian_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [guardianId]);

      console.log(`Found ${result.rowCount} children for guardian ${guardianId}`);

      return {
        success: true,
        data: result.rows,
        message: 'Children retrieved successfully'
      };

    } catch (error) {
      console.error('Get guardian children error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve children'
      };
    }
  }

  /**
   * Upload documents for a child
   */
  async uploadChildDocuments(guardianId, childId, documents) {
    try {
      const documentsQuery = `
        INSERT INTO child_documents (
          guardian_id, child_id, document_type, file_path, file_name,
          file_size, upload_date, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'pending')
        RETURNING *
      `;

      const uploadedDocs = [];
      
      for (const doc of documents) {
        const result = await pool.query(documentsQuery, [
          guardianId, childId, doc.type, doc.filePath, doc.fileName, doc.fileSize
        ]);
        uploadedDocs.push(result.rows[0]);
      }

      return {
        success: true,
        data: uploadedDocs,
        message: 'Documents uploaded successfully'
      };

    } catch (error) {
      console.error('Upload documents error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to upload documents'
      };
    }
  }

  /**
   * Send welcome email to new guardian
   */
  async sendWelcomeEmail(guardian, verificationToken = null) {
    try {
      const verificationSection = verificationToken ? 
        `<div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/guardian/verify-email?token=${verificationToken}" class="button">
            Verify Your Email Address
          </a>
        </div>` : 
        `<div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
          <p><strong>Your account is ready to use!</strong></p>
        </div>`;

      const nextSteps = verificationToken ? 
        `<p><strong>Next Steps:</strong></p>
        <ol>
          <li>Click the button above to verify your email</li>
          <li>Log in to your dashboard</li>
          <li>Add your children to your account</li>
          <li>Upload any relevant documents</li>
        </ol>` :
        `<p><strong>Next Steps:</strong></p>
        <ol>
          <li>Log in to your dashboard</li>
          <li>Add your children to your account</li>
          <li>Upload any relevant documents</li>
        </ol>`;
      
      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Welcome to Athletiq Nepal</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .button { display: inline-block; background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background-color: #263238; color: #cfd8dc; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Welcome to Athletiq Nepal!</h1>
              <p>Your Guardian Account is Ready</p>
            </div>
            
            <div class="content">
              <h2>Dear ${guardian.full_name},</h2>
              <p>Thank you for creating your Guardian account with Athletiq Nepal! You can now easily manage your children's athletic journey.</p>
              
              <h3>🚀 What you can do now:</h3>
              <ul>
                <li>Add your children to your account</li>
                <li>Upload photos and documents</li>
                <li>Track athletic progress</li>
                <li>Receive notifications about events</li>
                <li>Connect with schools automatically</li>
              </ul>

              ${verificationSection}

              ${nextSteps}

              <p>If you have any questions, feel free to contact our support team.</p>
              
              <p>Welcome to the family!</p>
              <p><strong>The Athletiq Nepal Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 Athletiq Nepal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Athletiq Nepal" <${process.env.EMAIL_USER}>`,
        to: guardian.email,
        subject: '🏆 Welcome to Athletiq Nepal - Verify Your Account',
        html: emailTemplate
      };

      await this.emailTransporter.sendMail(mailOptions);

    } catch (error) {
      console.error('Welcome email error:', error);
    }
  }

  /**
   * Send athlete ID activation notification
   */
  async sendAthleteIdActivationNotification(guardianId, player) {
    try {
      // Get guardian details
      const guardianQuery = 'SELECT * FROM guardians WHERE id = $1';
      const guardianResult = await pool.query(guardianQuery, [guardianId]);
      const guardian = guardianResult.rows[0];

      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Athlete ID Activated!</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .athlete-id { background-color: #e8f5e8; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .athlete-id h3 { margin: 0; color: #2e7d32; font-size: 24px; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Great News!</h1>
              <p>Athlete ID Has Been Activated</p>
            </div>
            
            <div class="content">
              <h2>Dear ${guardian.full_name},</h2>
              <p>We're excited to inform you that <strong>${player.full_name}</strong>'s registration has been approved by the school!</p>
              
              <div class="athlete-id">
                <h3>Nepal Athlete ID</h3>
                <h3>${player.athlete_id}</h3>
                <p>This ID is now active and ready to use!</p>
              </div>

              <h3>🏃‍♂️ Athlete Details:</h3>
              <ul>
                <li><strong>Full Name:</strong> ${player.full_name}</li>
                <li><strong>School:</strong> ${player.school_name}</li>
                <li><strong>Grade:</strong> ${player.grade}</li>
                <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>

              <h3>🚀 What happens next:</h3>
              <ul>
                <li>Your child can now participate in athletic events</li>
                <li>You'll receive notifications about tournaments and matches</li>
                <li>Track performance and achievements</li>
                <li>Access school athletic programs</li>
              </ul>

              <p>Log in to your dashboard to view full details and manage your child's athletic profile.</p>
              
              <p>Thank you for choosing Athletiq Nepal!</p>
              <p><strong>The Athletiq Nepal Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Athletiq Nepal" <${process.env.EMAIL_USER}>`,
        to: guardian.email,
        subject: `🎉 Athlete ID Activated - ${player.full_name}`,
        html: emailTemplate
      };

      await this.emailTransporter.sendMail(mailOptions);

    } catch (error) {
      console.error('Athlete ID activation notification error:', error);
    }
  }

  /**
   * Send linking notification
   */
  async sendLinkingNotification(guardianId, playerId) {
    // Implementation for when guardian links to existing student
    // Similar to activation notification but for existing students
  }

  /**
   * Notify school of pending registration
   */
  async notifySchoolOfPendingRegistration(registration) {
    // Implementation to notify school administrators
    // Can be email, dashboard notification, etc.
  }
}

module.exports = GuardianRegistrationService;
