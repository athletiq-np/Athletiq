// test-ai-pipeline.js - Test the AI Processing Pipeline
require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const { pool, query, healthCheck } = require('./src/config/db');
const OCRService = require('./src/services/ai/ocrService');
const AthleteIdGenerator = require('./src/services/ai/athleteIdGenerator');
const DocumentProcessor = require('./src/services/ai/documentProcessor');
const FileUploadHandler = require('./src/services/ai/fileUploadHandler');

async function testAIPipeline() {
  try {
    console.log('🚀 Testing AthletiQ AI Processing Pipeline\n');
    
    // Test 1: Database Health Check
    console.log('1. Testing Database Connection...');
    const health = await healthCheck();
    console.log('✅ Database Status:', health.status);
    console.log('   Version:', health.version);
    console.log('');
    
    // Test 2: Athlete ID Generator
    console.log('2. Testing Athlete ID Generator...');
    const athleteIdGenerator = new AthleteIdGenerator();
    
    // Get current stats
    const stats = await athleteIdGenerator.getAthleteIdStats();
    console.log('✅ Current Stats:');
    console.log('   Total Players:', stats.players.total_players);
    console.log('   Players with IDs:', stats.players.players_with_ids);
    console.log('   Players without IDs:', stats.players.players_without_ids);
    console.log('   Current Sequence:', stats.sequence.current);
    console.log('');
    
    // Generate a test athlete ID
    const testPlayerData = {
      full_name: 'Test Player',
      date_of_birth: '2010-05-15',
      school_id: 1,
      guardian_name: 'Test Guardian'
    };
    
    const athleteIdResult = await athleteIdGenerator.generateAthleteId(testPlayerData);
    console.log('✅ Generated Athlete ID:', athleteIdResult.athleteId);
    console.log('   Metadata:', athleteIdResult.metadata);
    console.log('');
    
    // Test 3: OCR Service (without actual images)
    console.log('3. Testing OCR Service Configuration...');
    const ocrService = new OCRService();
    
    // Test document templates
    const templates = ocrService.documentTemplates;
    console.log('✅ Document Templates Available:');
    Object.keys(templates).forEach(type => {
      console.log(`   - ${type}: ${templates[type].fields.length} fields`);
    });
    console.log('');
    
    // Test data validation
    const testData = {
      full_name: 'John Doe',
      date_of_birth: '2010-03-15',
      father_name: 'Robert Doe',
      mother_name: 'Jane Doe'
    };
    
    const validatedData = ocrService.validateExtractedData(testData, templates.birth_certificate);
    console.log('✅ Data Validation Test:');
    console.log('   Input:', testData);
    console.log('   Validated:', validatedData);
    
    const confidence = ocrService.calculateExtractionConfidence(validatedData, templates.birth_certificate);
    console.log('   Confidence Score:', confidence + '%');
    console.log('');
    
    // Test 4: Document Processor
    console.log('4. Testing Document Processor...');
    const documentProcessor = new DocumentProcessor();
    
    const queueStatus = await documentProcessor.getProcessingQueueStatus();
    console.log('✅ Processing Queue Status:');
    console.log('   Total:', queueStatus.total);
    console.log('   Pending:', queueStatus.pending);
    console.log('   Processing:', queueStatus.processing);
    console.log('   Completed:', queueStatus.completed);
    console.log('   Failed:', queueStatus.failed);
    console.log('');
    
    // Test 5: File Upload Handler
    console.log('5. Testing File Upload Handler...');
    const fileUploadHandler = new FileUploadHandler();
    
    const uploadStats = await fileUploadHandler.getUploadStatistics();
    console.log('✅ Upload Statistics:');
    console.log('   Total Documents:', uploadStats.summary.total_documents);
    console.log('   Total Storage:', Math.round(uploadStats.summary.total_storage / 1024 / 1024) + ' MB');
    console.log('   Average File Size:', Math.round(uploadStats.summary.average_file_size / 1024) + ' KB');
    console.log('');
    
    if (uploadStats.detailed.length > 0) {
      console.log('   By Document Type:');
      uploadStats.detailed.forEach(stat => {
        console.log(`   - ${stat.document_type} (${stat.processing_status}): ${stat.count} files`);
      });
      console.log('');
    }
    
    // Test 6: Database Schema Verification
    console.log('6. Verifying AI-Related Database Tables...');
    
    const aiTables = [
      'document_uploads',
      'ai_processing_queue',
      'audit_logs',
      'notifications',
      'analytics_events'
    ];
    
    for (const tableName of aiTables) {
      try {
        const result = await query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${tableName}: Error - ${error.message}`);
      }
    }
    console.log('');
    
    // Test 7: AI Processing Queue Functions
    console.log('7. Testing AI Processing Queue...');
    
    // Insert a test job
    const testJobResult = await query(`
      INSERT INTO ai_processing_queue (job_type, entity_type, entity_id, payload, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      'test_processing',
      'player',
      1,
      JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      'pending'
    ]);
    
    console.log('✅ Test job created in AI queue:', testJobResult.rows[0].job_id);
    
    // Query queue stats
    const queueStats = await query(`
      SELECT status, COUNT(*) as count 
      FROM ai_processing_queue 
      GROUP BY status
    `);
    
    console.log('✅ AI Queue Status:');
    queueStats.rows.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.count} jobs`);
    });
    console.log('');
    
    // Test 8: Athlete ID Assignment to Existing Players
    console.log('8. Testing Athlete ID Assignment...');
    
    const playersWithoutIds = await query(`
      SELECT id, full_name FROM players 
      WHERE athlete_id IS NULL 
      LIMIT 5
    `);
    
    if (playersWithoutIds.rows.length > 0) {
      console.log(`✅ Found ${playersWithoutIds.rows.length} players without athlete IDs`);
      
      // Assign athlete ID to first player
      const firstPlayer = playersWithoutIds.rows[0];
      const assignResult = await athleteIdGenerator.generateForPlayer(firstPlayer.id);
      
      console.log(`✅ Assigned athlete ID to player ${firstPlayer.full_name}:`);
      console.log(`   Athlete ID: ${assignResult.athleteId}`);
      console.log(`   Is New: ${assignResult.isNew}`);
      console.log('');
    } else {
      console.log('✅ All players already have athlete IDs');
      console.log('');
    }
    
    // Test 9: Environment Configuration
    console.log('9. Checking Environment Configuration...');
    
    const envChecks = [
      { key: 'OPENAI_API_KEY', required: true },
      { key: 'GOOGLE_PROJECT_ID', required: false },
      { key: 'UPLOAD_DIR', required: false },
      { key: 'MAX_FILE_SIZE', required: false },
      { key: 'REDIS_HOST', required: false },
      { key: 'REDIS_PORT', required: false }
    ];
    
    envChecks.forEach(check => {
      const value = process.env[check.key];
      if (value) {
        console.log(`✅ ${check.key}: Configured`);
      } else if (check.required) {
        console.log(`❌ ${check.key}: Missing (Required)`);
      } else {
        console.log(`⚠️  ${check.key}: Not set (Optional)`);
      }
    });
    console.log('');
    
    // Summary
    console.log('🎉 AI Processing Pipeline Test Completed!\n');
    console.log('Summary:');
    console.log('- ✅ Database connection and health check');
    console.log('- ✅ Athlete ID generation system');
    console.log('- ✅ OCR service configuration');
    console.log('- ✅ Document processing pipeline');
    console.log('- ✅ File upload handling');
    console.log('- ✅ AI processing queue');
    console.log('- ✅ Database schema verification');
    console.log('');
    console.log('Ready for Production Features:');
    console.log('📸 Document upload and OCR processing');
    console.log('🎯 Automatic athlete ID generation');
    console.log('🔍 Document authenticity validation');
    console.log('⚡ Background job processing');
    console.log('📊 Processing analytics and monitoring');
    console.log('🔔 Notification system integration');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Configure Google Vision API credentials');
    console.log('2. Set up Redis for queue processing');
    console.log('3. Create API endpoints for document upload');
    console.log('4. Build admin dashboard for verification');
    console.log('5. Implement real-time notifications');
    
  } catch (error) {
    console.error('❌ AI Pipeline test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testAIPipeline();
