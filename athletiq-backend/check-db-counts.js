require('dotenv').config();
const DatabaseService = require('./src/services/DatabaseService');

async function getCounts() {
  try {
    console.log('Connecting to database...');
    const stats = await DatabaseService.getDashboardStats();
    
    console.log('\n=== DATABASE COUNTS ===');
    console.log('Schools:', stats.total_schools);
    console.log('Athletes/Players:', stats.total_athletes);
    console.log('Tournaments:', stats.total_tournaments);
    console.log('Teams:', stats.total_teams);
    console.log('Matches:', stats.total_matches);
    console.log('Active Tournaments:', stats.active_tournaments);
    console.log('Pending Matches:', stats.pending_matches);
    console.log('=======================\n');
    
    // Also validate database connection
    const validation = await DatabaseService.validateDatabase();
    if (validation.connected) {
      console.log('✅ Database connection: OK');
      console.log('📊 Table counts:');
      Object.entries(validation.tables).forEach(([table, count]) => {
        console.log(`   ${table}: ${count} records`);
      });
    } else {
      console.log('❌ Database connection: FAILED');
      console.log('Error:', validation.error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching database stats:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

getCounts();