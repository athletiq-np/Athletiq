const { TestDatabase } = require('./testDb');

async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');
    
    // Create test database
    await TestDatabase.createTestDatabase();
    console.log('✅ Test database created successfully');
    
    // Setup test tables
    await TestDatabase.setupTestTables();
    console.log('✅ Test tables created successfully');
    
    console.log('🎉 Test database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    process.exit(1);
  }
}

setupTestDatabase();
