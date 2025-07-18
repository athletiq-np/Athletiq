const pool = require('./src/config/db');

async function checkNotifications() {
  try {
    // Check if table exists
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
    `);
    
    if (result.rowCount > 0) {
      console.log('Notifications table exists with columns:');
      result.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    } else {
      console.log('Notifications table does not exist');
      // Create simple notifications table
      await pool.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          target_type VARCHAR(20) NOT NULL,
          target_id INTEGER,
          entity_type VARCHAR(20),
          entity_id INTEGER,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Notifications table created successfully!');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkNotifications();
