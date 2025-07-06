const { TestDatabase } = require('./testDb');

async function resetTestDatabase() {
  try {
    console.log('Resetting test database...');
    
    // Drop test database
    await TestDatabase.dropTestDatabase();
    console.log('✅ Test database dropped successfully');
    
    // Create test database
    await TestDatabase.createTestDatabase();
    console.log('✅ Test database created successfully');
    
    // Setup test tables
    await TestDatabase.setupTestTables();
    console.log('✅ Test tables created successfully');
    
    console.log('🎉 Test database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test database reset failed:', error);
    process.exit(1);
  }
}

resetTestDatabase();
