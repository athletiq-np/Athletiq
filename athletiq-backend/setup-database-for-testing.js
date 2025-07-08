const pool = require('./src/config/db');

async function setupDatabaseForTesting() {
  try {
    console.log('🏗️  Setting up database for testing...\n');

    // 1. Populate sports table
    console.log('1. 🏃‍♂️ Populating sports table...');
    const sports = [
      'Football', 'Basketball', 'Cricket', 'Volleyball', 'Badminton',
      'Table Tennis', 'Tennis', 'Athletics', 'Swimming', 'Wrestling',
      'Boxing', 'Kabaddi', 'Hockey', 'Baseball', 'Rugby'
    ];

    for (const sport of sports) {
      await pool.query(`
        INSERT INTO sports (name) 
        VALUES ($1) 
        ON CONFLICT (name) DO NOTHING
      `, [sport]);
    }
    
    const sportsResult = await pool.query('SELECT * FROM sports ORDER BY id');
    console.log('✓ Sports added:', sportsResult.rows.length);
    sportsResult.rows.forEach(sport => console.log(`  - ${sport.id}: ${sport.name}`));

    // 2. Check existing data
    console.log('\n2. 📊 Checking existing data...');
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('✓ Users:', userCount.rows[0].count);
    
    const schoolCount = await pool.query('SELECT COUNT(*) FROM schools');
    console.log('✓ Schools:', schoolCount.rows[0].count);
    
    const teamCount = await pool.query('SELECT COUNT(*) FROM teams');
    console.log('✓ Teams:', teamCount.rows[0].count);
    
    const playerCount = await pool.query('SELECT COUNT(*) FROM players');
    console.log('✓ Players:', playerCount.rows[0].count);

    const tournamentCount = await pool.query('SELECT COUNT(*) FROM tournaments');
    console.log('✓ Tournaments:', tournamentCount.rows[0].count);

    // 3. Create a default user if none exists
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('\n3. 👤 Creating default admin user...');
      await pool.query(`
        INSERT INTO users (full_name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4)
      `, ['System Admin', 'admin@athletiq.com', 'hashed_password', 'SuperAdmin']);
      console.log('✓ Default admin user created');
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Database is now ready for:');
    console.log('• Tournament creation and management');
    console.log('• Team registration with proper sport associations');
    console.log('• Player eligibility checking');
    console.log('• Enhanced registration workflows');
    
    return {
      success: true,
      sports_count: sportsResult.rows.length,
      users_count: parseInt(userCount.rows[0].count),
      schools_count: parseInt(schoolCount.rows[0].count),
      teams_count: parseInt(teamCount.rows[0].count),
      players_count: parseInt(playerCount.rows[0].count),
      tournaments_count: parseInt(tournamentCount.rows[0].count)
    };
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

// Run setup
setupDatabaseForTesting()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 Setup completed successfully!');
      console.log('Database stats:', result);
    } else {
      console.log('\n💥 Setup failed:', result.error);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
