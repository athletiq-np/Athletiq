const { pool } = require('./src/config/db');

/**
 * Initialize Sports Data
 * Ensures that the sports table has the necessary data for scoresheet generation
 */

async function initializeSportsData() {
  try {
    console.log('🏃‍♂️ Initializing sports data...');
    
    // Check if sports table has data
    const existingSports = await pool.query('SELECT COUNT(*) as count FROM sports');
    const sportCount = parseInt(existingSports.rows[0].count);
    
    console.log(`📊 Current sports in database: ${sportCount}`);
    
    if (sportCount === 0) {
      console.log('📝 Adding basic sports data...');
      
      const sportsToAdd = [
        'Football',
        'Basketball', 
        'Cricket',
        'Volleyball',
        'Table Tennis',
        'Badminton',
        'Tennis',
        'Rugby',
        'Hockey',
        'Swimming',
        'Athletics',
        'Boxing',
        'Wrestling',
        'Chess',
        'Carrom'
      ];
      
      for (const sport of sportsToAdd) {
        await pool.query(
          'INSERT INTO sports (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [sport]
        );
      }
      
      console.log(`✅ Added ${sportsToAdd.length} sports to database`);
    }
    
    // Verify football exists
    const footballCheck = await pool.query(
      "SELECT id, name FROM sports WHERE LOWER(name) IN ('football', 'soccer')"
    );
    
    if (footballCheck.rows.length === 0) {
      await pool.query('INSERT INTO sports (name) VALUES ($1)', ['Football']);
      console.log('⚽ Added Football to sports table');
    } else {
      console.log(`⚽ Football found in database (ID: ${footballCheck.rows[0].id})`);
    }
    
    // Show all sports
    const allSports = await pool.query('SELECT id, name FROM sports ORDER BY name');
    console.log('🏆 Available sports:');
    allSports.rows.forEach(sport => {
      console.log(`   ${sport.id}. ${sport.name}`);
    });
    
    return allSports.rows;
    
  } catch (error) {
    console.error('❌ Error initializing sports data:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  initializeSportsData()
    .then(() => {
      console.log('✅ Sports data initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sports data initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeSportsData };
