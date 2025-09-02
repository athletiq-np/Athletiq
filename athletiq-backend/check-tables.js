const db = require('./src/config/db');

async function checkTables() {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
    // Also check if notifications table exists and its structure
    try {
      const notificationsInfo = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      if (notificationsInfo.rows.length > 0) {
        console.log('\n📋 Notifications table structure:');
        notificationsInfo.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    } catch (e) {
      console.log('\n📋 Notifications table does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
    process.exit(1);
  }
}

checkTables();
