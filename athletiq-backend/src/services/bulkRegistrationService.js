// src/services/bulkRegistrationService.js
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const AthleteIdGenerator = require('./ai/athleteIdGenerator');
const GuardianNotificationService = require('./guardianNotificationService');
const { generateShortCode } = require('../utils/codeGenerator');

class BulkRegistrationService {
  constructor() {
    this.athleteIdGenerator = new AthleteIdGenerator();
    this.guardianService = new GuardianNotificationService();
    this.requiredColumns = [
      'full_name',
      'date_of_birth',
      'gender',
      'grade'
    ];
    this.optionalColumns = [
      'section',
      'guardian_name',
      'guardian_phone',
      'guardian_email',
      'address'
    ];
  }

  /**
   * Generate CSV template for bulk registration
   */
  generateCSVTemplate() {
    const headers = [
      'full_name*',
      'date_of_birth*',
      'gender*',
      'grade*',
      'section',
      'guardian_name',
      'guardian_phone',
      'guardian_email',
      'address'
    ];

    // Generate template with empty rows for user to fill
    const templateRows = [
      ['[Full Name]', '[YYYY-MM-DD]', '[male/female]', '[Grade]', '[Section]', '[Guardian Name]', '[Phone]', '[Email]', '[Address]'],
      ['', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '']
    ];

    const csvContent = [
      headers.join(','),
      ...templateRows.map(row => row.join(','))
    ].join('\n');

    return {
      content: csvContent,
      filename: `athlete_registration_template_${new Date().toISOString().split('T')[0]}.csv`,
      instructions: {
        required_fields: 'Fields marked with * are required',
        date_format: 'Use YYYY-MM-DD format for date_of_birth',
        gender_values: 'Use "male" or "female" for gender',
        phone_format: 'Use Nepal phone format (98XXXXXXXX)',
        max_rows: 'Maximum 100 athletes per upload'
      }
    };
  }

  /**
   * Validate CSV file structure and data
   */
  async validateCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rowNumber++;
          
          // Validate row data
          const rowErrors = this.validateRowData(data, rowNumber);
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          }
          
          results.push(data);
        })
        .on('end', () => {
          // Check file structure
          if (results.length === 0) {
            errors.push('CSV file is empty');
          }

          if (results.length > 100) {
            errors.push('Maximum 100 athletes allowed per upload');
          }

          // Check required columns
          if (results.length > 0) {
            const columns = Object.keys(results[0]);
            const missingColumns = this.requiredColumns.filter(col => 
              !columns.some(csvCol => csvCol.toLowerCase().replace('*', '') === col)
            );
            
            if (missingColumns.length > 0) {
              errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
            }
          }

          resolve({
            isValid: errors.length === 0,
            errors,
            data: results,
            totalRows: results.length
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Validate individual row data
   */
  validateRowData(row, rowNumber) {
    const errors = [];
    const rowPrefix = `Row ${rowNumber}`;

    // Clean column names (remove asterisks)
    const cleanRow = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.toLowerCase().replace('*', '');
      cleanRow[cleanKey] = row[key]?.trim();
    });

    // Check required fields
    this.requiredColumns.forEach(field => {
      if (!cleanRow[field] || cleanRow[field] === '') {
        errors.push(`${rowPrefix}: Missing required field '${field}'`);
      }
    });

    // Validate date format
    if (cleanRow.date_of_birth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(cleanRow.date_of_birth)) {
        errors.push(`${rowPrefix}: Invalid date format. Use YYYY-MM-DD`);
      } else {
        // Check if date is valid and reasonable for students
        const birthDate = new Date(cleanRow.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 3 || age > 20) {
          errors.push(`${rowPrefix}: Student age must be between 3 and 20 years`);
        }
      }
    }

    // Validate gender
    if (cleanRow.gender) {
      const validGenders = ['male', 'female'];
      if (!validGenders.includes(cleanRow.gender.toLowerCase())) {
        errors.push(`${rowPrefix}: Gender must be 'male' or 'female'`);
      }
    }

    // Validate phone number format
    if (cleanRow.guardian_phone) {
      const phoneRegex = /^[+]?[977]?[98]\d{8}$/;
      if (!phoneRegex.test(cleanRow.guardian_phone.replace(/[\s-]/g, ''))) {
        errors.push(`${rowPrefix}: Invalid Nepal phone number format`);
      }
    }

    // Validate email format
    if (cleanRow.guardian_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanRow.guardian_email)) {
        errors.push(`${rowPrefix}: Invalid email format`);
      }
    }

    return errors;
  }

  /**
   * Process bulk registration
   */
  async processBulkRegistration(csvData, schoolId, createdBy) {
    const results = {
      total: csvData.length,
      successful: 0,
      failed: 0,
      errors: [],
      athletes: [],
      notifications: []
    };

    for (let i = 0; i < csvData.length; i++) {
      const rowData = csvData[i];
      const rowNumber = i + 1;

      try {
        // Clean column names
        const cleanData = {};
        Object.keys(rowData).forEach(key => {
          const cleanKey = key.toLowerCase().replace('*', '');
          cleanData[cleanKey] = rowData[key]?.trim();
        });

        // Check for duplicates in database
        const duplicateCheck = await pool.query(
          'SELECT id FROM players WHERE LOWER(full_name) = LOWER($1) AND date_of_birth = $2 AND school_id = $3',
          [cleanData.full_name, cleanData.date_of_birth, schoolId]
        );

        if (duplicateCheck.rowCount > 0) {
          results.errors.push(`Row ${rowNumber}: Athlete already exists - ${cleanData.full_name}`);
          results.failed++;
          continue;
        }

        // Generate Nepal Athlete ID
        const athleteCode = this.athleteIdGenerator.generateAlphanumericCode();
        const athlete_id = `NP${athleteCode}`;
        const player_code = await generateShortCode('PL', 8);

        // Insert athlete
        const insertQuery = `
          INSERT INTO players (
            player_code, athlete_id, full_name, date_of_birth, gender, grade, section,
            guardian_name, guardian_phone, guardian_email, address,
            school_id, created_by, is_active, registration_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, 'active')
          RETURNING *
        `;

        const values = [
          player_code,
          athlete_id,
          cleanData.full_name,
          cleanData.date_of_birth,
          cleanData.gender?.toLowerCase() || 'male',
          cleanData.grade,
          cleanData.section || null,
          cleanData.guardian_name || null,
          cleanData.guardian_phone || null,
          cleanData.guardian_email || null,
          cleanData.address || null,
          schoolId,
          createdBy
        ];

        const result = await pool.query(insertQuery, values);
        const newAthlete = result.rows[0];

        results.athletes.push(newAthlete);
        results.successful++;

        // Send guardian notification if contact provided
        if (cleanData.guardian_phone || cleanData.guardian_email) {
          try {
            const schoolQuery = 'SELECT name FROM schools WHERE id = $1';
            const schoolResult = await pool.query(schoolQuery, [schoolId]);
            const schoolName = schoolResult.rows[0]?.name || 'Your School';

            const athleteForNotification = {
              ...newAthlete,
              guardian_phone: cleanData.guardian_phone,
              guardian_email: cleanData.guardian_email,
              school_name: schoolName
            };

            const notificationResult = await this.guardianService.sendRegistrationNotification(athleteForNotification);
            results.notifications.push({
              athlete_id,
              notification: notificationResult
            });
          } catch (notificationError) {
            console.error(`Notification failed for ${athlete_id}:`, notificationError);
          }
        }

      } catch (error) {
        console.error(`Row ${rowNumber} processing error:`, error);
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Generate registration report
   */
  generateReport(results, schoolName) {
    const timestamp = new Date().toISOString();
    
    return {
      report_id: `BULK_REG_${Date.now()}`,
      timestamp,
      school_name: schoolName,
      summary: {
        total_processed: results.total,
        successful_registrations: results.successful,
        failed_registrations: results.failed,
        success_rate: `${((results.successful / results.total) * 100).toFixed(1)}%`
      },
      athletes_registered: results.athletes.map(athlete => ({
        nepal_id: athlete.athlete_id,
        name: athlete.full_name,
        grade: athlete.grade,
        guardian_notified: results.notifications.some(n => n.athlete_id === athlete.athlete_id)
      })),
      errors: results.errors,
      notifications_sent: results.notifications.length,
      guardian_notifications: results.notifications
    };
  }

  /**
   * Cleanup uploaded files
   */
  async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }
}

module.exports = BulkRegistrationService;
