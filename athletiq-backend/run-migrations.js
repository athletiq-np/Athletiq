const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database file path
const dbPath = path.join(__dirname, 'athletiq.db');

// Read the SQL migration file
const sqlFile = path.join(__dirname, 'migrations', 'create_enhanced_features_tables.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('📦 Connected to SQLite database');
});

// Split SQL into individual statements
const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

// Execute each statement
let completed = 0;
const total = statements.length;

console.log(`🔄 Running ${total} migration statements...`);

statements.forEach((statement, index) => {
  const trimmedStatement = statement.trim();
  if (trimmedStatement) {
    db.run(trimmedStatement, (err) => {
      if (err) {
        console.error(`❌ Error executing statement ${index + 1}:`, err.message);
        console.error(`Statement: ${trimmedStatement.substring(0, 100)}...`);
      } else {
        completed++;
        console.log(`✅ Statement ${completed}/${total} completed`);
      }
      
      // Check if all statements are done
      if (completed === statements.filter(s => s.trim()).length) {
        console.log('🎉 All migration statements completed successfully!');
        
        // Close database connection
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message);
          } else {
            console.log('📦 Database connection closed');
          }
          process.exit(0);
        });
      }
    });
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Migration interrupted');
  db.close();
  process.exit(1);
});
