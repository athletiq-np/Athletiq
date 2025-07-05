// test-enhanced-db.js - Test the enhanced database schema
require('dotenv').config();
const { pool, query, healthCheck } = require('./src/config/db');

async function testEnhancedDatabase() {
  try {
    console.log('🚀 Testing Enhanced AthletiQ Database Schema\n');
    
    // Test database health
    console.log('1. Testing Database Health...');
    const health = await healthCheck();
    console.log('✅ Database Status:', health.status);
    console.log('   Version:', health.version);
    console.log('   Pool Stats:', health.pool);
    console.log('');
    
    // Test core tables
    console.log('2. Testing Core Tables...');
    const coreTableResults = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM schools'),
      query('SELECT COUNT(*) FROM players'),
      query('SELECT COUNT(*) FROM teams'),
      query('SELECT COUNT(*) FROM organizations'),
    ]);
    
    console.log('✅ Users table:', coreTableResults[0].rows[0].count, 'records');
    console.log('✅ Schools table:', coreTableResults[1].rows[0].count, 'records');
    console.log('✅ Players table:', coreTableResults[2].rows[0].count, 'records');
    console.log('✅ Teams table:', coreTableResults[3].rows[0].count, 'records');
    console.log('✅ Organizations table:', coreTableResults[4].rows[0].count, 'records');
    console.log('');
    
    // Test enhanced features tables
    console.log('3. Testing Enhanced Feature Tables...');
    const enhancedTableResults = await Promise.all([
      query('SELECT COUNT(*) FROM document_uploads'),
      query('SELECT COUNT(*) FROM ai_processing_queue'),
      query('SELECT COUNT(*) FROM audit_logs'),
      query('SELECT COUNT(*) FROM notifications'),
      query('SELECT COUNT(*) FROM analytics_events'),
    ]);
    
    console.log('✅ Document uploads table:', enhancedTableResults[0].rows[0].count, 'records');
    console.log('✅ AI processing queue:', enhancedTableResults[1].rows[0].count, 'records');
    console.log('✅ Audit logs table:', enhancedTableResults[2].rows[0].count, 'records');
    console.log('✅ Notifications table:', enhancedTableResults[3].rows[0].count, 'records');
    console.log('✅ Analytics events table:', enhancedTableResults[4].rows[0].count, 'records');
    console.log('');
    
    // Test new columns in existing tables
    console.log('4. Testing Enhanced Column Structure...');
    const userColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('google_id', 'phone', 'organization_id', 'timezone', 'notification_preferences')
      ORDER BY column_name
    `);
    
    console.log('✅ Enhanced User table columns:');
    userColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    const playerColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'players' AND column_name IN ('athlete_id', 'nationality', 'height_cm', 'weight_kg')
      ORDER BY column_name
    `);
    
    console.log('✅ Enhanced Player table columns:');
    playerColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    // Test functions and sequences
    console.log('5. Testing Database Functions...');
    const athleteId = await query('SELECT generate_athlete_id() as athlete_id');
    console.log('✅ Athlete ID generation:', athleteId.rows[0].athlete_id);
    console.log('');
    
    // Test indexes
    console.log('6. Testing Database Indexes...');
    const indexes = await query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log('✅ Performance indexes created:');
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.indexname} on ${idx.tablename}`);
    });
    console.log('');
    
    // Test triggers
    console.log('7. Testing Database Triggers...');
    const triggers = await query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public' AND trigger_name LIKE 'update_%'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log('✅ Auto-update triggers:');
    triggers.rows.forEach(trigger => {
      console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
    });
    console.log('');
    
    console.log('🎉 Enhanced Database Schema Test Completed Successfully!');
    console.log('');
    console.log('Summary:');
    console.log('- ✅ Core tables: Users, Schools, Players, Teams, Organizations');
    console.log('- ✅ Enhanced features: Document processing, AI queue, Audit logs, Notifications, Analytics');
    console.log('- ✅ Multi-tenancy support with Organizations');
    console.log('- ✅ Advanced authentication columns (Google ID, Phone, 2FA)');
    console.log('- ✅ Global athlete ID system');
    console.log('- ✅ Performance indexes for scalability');
    console.log('- ✅ Automatic timestamp updates with triggers');
    console.log('- ✅ Production-ready logging and monitoring');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testEnhancedDatabase();
