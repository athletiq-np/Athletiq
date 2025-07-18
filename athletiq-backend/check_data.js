const pool = require('./src/config/db');
const GuardianRegistrationService = require('./src/services/guardianRegistrationService');

async function testGetChildren() {
  try {
    const guardianService = new GuardianRegistrationService();
    
    console.log('Testing getGuardianChildren method...');
    
    // Test with guardian ID 14
    const result = await guardianService.getGuardianChildren(14);
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testGetChildren();
